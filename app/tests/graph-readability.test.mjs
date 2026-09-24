import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';

const { graph, categories, studyPaths } = JSON.parse(fs.readFileSync(new URL('../src/data/content.json', import.meta.url)));
const coreIds = graph.nodes.filter(({ depth }) => depth === 'core').map(({ id }) => id);
const nodeRadius = (node) => Math.max(18, Math.min(36, 16 + (node.val || 3) * 2.2));
const server = await preview({ preview: { host: '127.0.0.1', port: 5209, strictPort: true, open: false } });
let browser;

try {
  browser = await chromium.launch({ headless: true, ...(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {}) });
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // Observe real drawing operations without exposing rendering internals in the app.
    await page.addInitScript((theme) => {
      localStorage.setItem('kotlin-concepts-theme', theme);
      localStorage.setItem('kotlin-concepts-progress', JSON.stringify({ version: 2, assessments: {
        'platform-types': { status: 'needs-review', assessedAt: '2026-09-20' }
      }, groupAssessments: {} }));
      const prototype = CanvasRenderingContext2D.prototype;
      for (const method of ['clearRect', 'beginPath', 'moveTo', 'lineTo', 'quadraticCurveTo', 'arc', 'stroke', 'fill', 'fillText']) {
        const original = prototype[method];
        prototype[method] = function (...args) {
          if (method === 'clearRect') {
            this.record = window.graphFrame = { labels: [], curves: [], arrows: [], segments: [], markers: 0 };
          }
          if (method === 'beginPath') this.recordPath = [];
          const frame = this.record;
          const path = this.recordPath || [];
          if (['moveTo', 'lineTo', 'quadraticCurveTo', 'arc'].includes(method)) path.push([method, ...args]);
          if (frame && method === 'fillText') {
            const point = this.getTransform().transformPoint({ x: args[1], y: args[2] });
            frame.labels.push({ text: args[0], x: args[1], y: args[2], screenX: point.x, screenY: point.y, scale: this.getTransform().a });
          }
          if (frame && method === 'stroke') {
            if (path.some(([name]) => name === 'quadraticCurveTo')) {
              frame.curves.push({ path: [...path], alpha: this.globalAlpha, width: this.lineWidth });
            } else if (this.strokeStyle === '#f59e0b' && path.length === 2 && path[0][0] === 'moveTo' && path[1][0] === 'lineTo') {
              frame.segments.push([...path]);
            }
          }
          if (frame && method === 'fill') {
            if (path.length === 3 && path[0][0] === 'moveTo' && path[1][0] === 'lineTo' && path[2][0] === 'lineTo') {
              frame.arrows.push({ alpha: this.globalAlpha, curve: frame.curves.length - 1 });
            }
            if (path.length === 1 && path[0][0] === 'arc' && path[0][3] === 7) frame.markers += 1;
          }
          return original.apply(this, args);
        };
      }
    }, theme);
    await page.goto('http://127.0.0.1:5209/', { waitUntil: 'networkidle' });
    const region = page.getByRole('region', { name: 'Concept graph' });
    const frame = async () => page.evaluate(() => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(window.graphFrame)));
    }));
    const checkFrame = async (ids, selectedId = null, path = null) => {
      const drawn = await frame();
      const visible = new Set(ids);
      const nodes = graph.nodes.filter(({ id }) => visible.has(id));
      const names = new Set(graph.nodes.map(({ name }) => name));
      assert.deepEqual(drawn.labels.filter(({ text }) => names.has(text)).map(({ text }) => text).sort(), nodes.map(({ name }) => name).sort());
      assert.equal(drawn.markers, ids.length, 'Only visible nodes have assessment markers');
      assert.deepEqual(await region.getByRole('button', { name: /^Open .* from graph/ }).allTextContents(),
        nodes.map((node) => `Open ${node.name} from graph · ${node.id === 'platform-types' ? 'Needs review' : 'Not assessed'}`));
      const relationships = graph.links.filter((link) => visible.has(link.source) && visible.has(link.target) &&
        (link.type === 'prerequisite' || (selectedId && [link.source, link.target].includes(selectedId))));
      assert.equal(drawn.curves.length, relationships.length);
      assert.equal(drawn.arrows.length, relationships.filter(({ type }) => type === 'prerequisite').length);
      for (const arrow of drawn.arrows) assert.equal(arrow.alpha, drawn.curves[arrow.curve].alpha, 'Arrowheads dim with their lines');
      const pointFor = (id) => {
        const node = graph.nodes.find((node) => node.id === id);
        const label = drawn.labels.find(({ text }) => text === node.name);
        const radius = nodeRadius(node);
        return [label.x, label.y - radius - 7];
      };
      for (let index = 0; index < relationships.length; index += 1) {
        const curve = drawn.curves[index].path;
        const expected = [...pointFor(relationships[index].source), ...pointFor(relationships[index].target)];
        const actual = [...curve[0].slice(1), ...curve[1].slice(3)];
        actual.forEach((value, index) => assert.ok(Math.abs(value - expected[index]) < 0.001));
      }
      const expectedSegments = path ? path.conceptIds.slice(1).flatMap((target, index) => {
        const source = path.conceptIds[index];
        return visible.has(source) && visible.has(target) ? [[['moveTo', ...pointFor(source)], ['lineTo', ...pointFor(target)]]] : [];
      }) : [];
      assert.equal(drawn.segments.length, expectedSegments.length, 'Paths never bridge hidden concepts');
      drawn.segments.forEach((segment, index) => segment.forEach((command, commandIndex) => {
        assert.equal(command[0], expectedSegments[index][commandIndex][0]);
        command.slice(1).forEach((value, coordinate) => assert.ok(Math.abs(value - expectedSegments[index][commandIndex][coordinate + 1]) < 0.001));
      }));
      return drawn;
    };

    let drawn = await checkFrame(coreIds);
    assert.ok(drawn.curves.every(({ alpha, width }) => alpha === 1 && Math.abs(width - 1.4) < 0.001), 'Initial closed selection does not emphasize connections');
    await page.screenshot({ path: join(os.tmpdir(), `graph-readability-${theme}.png`) });
    // Hover a visible node that is not covered by floating controls.
    const canvas = await region.locator('canvas').boundingBox();
    const hoverableNames = new Set(graph.links.filter(({ source, target, type }) => type === 'prerequisite' && coreIds.includes(source) && coreIds.includes(target))
      .flatMap(({ source, target }) => [source, target]).map((id) => graph.nodes.find((node) => node.id === id).name));
    const hoverLabel = drawn.labels.find(({ text, screenX, screenY }) => hoverableNames.has(text) &&
      screenX > 400 && screenX < 1100 && screenY > 180 && screenY < 850);
    assert.ok(hoverLabel, 'A graph node is available for pointer verification');
    const hoverNode = graph.nodes.find(({ name }) => name === hoverLabel.text);
    const hoverRadius = nodeRadius(hoverNode);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const label = (await frame()).labels.find(({ text }) => text === hoverLabel.text);
      await page.mouse.move(canvas.x + label.screenX, canvas.y + label.screenY - (hoverRadius + 7) * label.scale);
      drawn = await checkFrame(coreIds);
      if (drawn.curves.some(({ width }) => Math.abs(width - 2.8) < 0.001)) break;
    }
    assert.ok(drawn.curves.some(({ width }) => Math.abs(width - 2.8) < 0.001), 'Hover emphasizes prerequisites without revealing related edges');
    await page.mouse.move(1400, 20);

    const nullableButton = region.getByRole('button', { name: /^Open Nullable types from graph/ });
    await nullableButton.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Close concept' }).waitFor();
    drawn = await checkFrame(coreIds, 'nullable-types');
    assert.ok(drawn.curves.some(({ alpha }) => alpha < 1));
    assert.ok(drawn.curves.some(({ width }) => Math.abs(width - 2.8) < 0.001));
    await region.getByRole('button', { name: 'core', exact: true }).click();
    await checkFrame([], 'nullable-types');
    await region.getByRole('button', { name: 'core', exact: true }).click();
    await checkFrame(coreIds, 'nullable-types');
    await page.keyboard.press('/');
    await page.getByRole('searchbox', { name: 'Search concepts' }).fill('nullable');
    drawn = await checkFrame(coreIds, 'nullable-types');
    assert.ok(drawn.curves.every(({ alpha }) => alpha < 1), 'Search dims even the selected concept’s connections when their other endpoint does not match');
    await page.getByRole('searchbox', { name: 'Search concepts' }).fill('');
    await page.getByTitle('Close [Esc]', { exact: true }).click();
    await page.getByRole('button', { name: 'Close concept' }).click();
    await checkFrame(coreIds);

    const path = studyPaths.find(({ id }) => id === 'java-developer-foundations');
    assert.ok(path);
    await region.getByRole('button', { name: `Path: ${path.name}`, exact: true }).click();
    await checkFrame(coreIds, null, path);
    await region.getByRole('button', { name: categories['type-system'].name, exact: true }).click();
    const typeIds = graph.nodes.filter(({ category, depth }) => category === 'type-system' && depth === 'core').map(({ id }) => id);
    await checkFrame(typeIds, null, path);
    await region.getByRole('button', { name: 'deep-dive', exact: true }).click();
    const expandedIds = graph.nodes.filter(({ category, depth }) => category === 'type-system' && depth !== 'reference').map(({ id }) => id);
    await checkFrame(expandedIds, null, path);
    await region.getByRole('button', { name: categories['type-system'].name, exact: true }).click();
    await region.getByRole('group', { name: 'Assessment filters' }).getByRole('button', { name: /Needs review/ }).click();
    await checkFrame(['nullable-types', 'platform-types'], null, path);
    const beforeRevealCamera = await region.getAttribute('data-camera');
    await page.keyboard.press('/');
    await page.getByRole('searchbox', { name: 'Search concepts' }).fill('not-null assertion');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Close concept' }).waitFor();
    const revealedIds = [...new Set(['not-null-assertion', ...graph.links.flatMap(({ source, target }) =>
      source === 'not-null-assertion' ? [target] : target === 'not-null-assertion' ? [source] : [])])];
    await checkFrame(revealedIds, 'not-null-assertion', path);
    await page.getByRole('button', { name: 'Close concept' }).click();
    await checkFrame(revealedIds, null, path);
    await region.getByRole('button', { name: 'Return to previous view' }).click();
    drawn = await checkFrame(['nullable-types', 'platform-types'], null, path);
    assert.equal(await region.getAttribute('data-camera'), beforeRevealCamera);
    const hiddenLabel = drawn.labels.find(({ text }) => text === 'Nullable types');
    await region.getByRole('group', { name: 'Assessment filters' }).getByRole('button', { name: /Needs review/ }).click();
    await region.getByRole('button', { name: 'core', exact: true }).click();
    await region.getByRole('button', { name: 'deep-dive', exact: true }).click();
    await checkFrame([], null, path);
    const hiddenRadius = nodeRadius(graph.nodes.find(({ id }) => id === 'nullable-types'));
    const hiddenNodeY = canvas.y + hiddenLabel.screenY - (hiddenRadius + 7) * hiddenLabel.scale;
    await page.mouse.move(canvas.x + hiddenLabel.screenX, hiddenNodeY);
    await frame();
    assert.equal(await region.getByText('Nullable types', { exact: true }).count(), 0, 'Hidden nodes have no hover tooltip');
    await page.mouse.click(canvas.x + hiddenLabel.screenX, hiddenNodeY);
    assert.equal(await page.getByRole('complementary').count(), 0, 'Hidden nodes cannot be selected by pointer');
    assert.deepEqual(errors, []);
    console.log(`✓ ${theme}: canvas relationships, labels, markers, arrows, path gaps, keyboard selection, filters, search and reveal restoration`);
    await page.close();
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
