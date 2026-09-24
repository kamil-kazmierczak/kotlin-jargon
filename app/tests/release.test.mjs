import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContentModel, readContentSources } from '../scripts/content-pipeline.mjs';
import { renderGeneratedArtifacts } from '../scripts/generated-artifacts.mjs';
import { chromium } from 'playwright';

// Serve the production artifact at the actual Pages subpath, with real 404s.
const dist = new URL('../dist/', import.meta.url);
const prefix = '/kotlin-jargon/';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.png': 'image/png' };
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = new URL(pathname.slice(prefix.length) || 'index.html', dist);
  if (!pathname.startsWith(prefix) || !file.href.startsWith(dist.href) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.setHeader('Content-Type', types[path.extname(file.pathname)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(10000);
  const baseUrl = `http://127.0.0.1:${server.address().port}${prefix}`;
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith(baseUrl) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  const canonical = buildContentModel(readContentSources({
    manifestPath: fileURLToPath(new URL('../../content/curriculum.json', import.meta.url)),
    conceptsDirectory: fileURLToPath(new URL('../../content/concepts/', import.meta.url))
  }));
  for (const [name, contents] of renderGeneratedArtifacts(canonical)) {
    if (name.startsWith('public/')) assert.equal(fs.readFileSync(new URL(name.slice(7), dist), 'utf8'), contents, name);
  }
  const data = JSON.parse(fs.readFileSync(new URL('data/content.json', dist)));
  await page.goto(baseUrl);
  assert.match(await page.title(), /^Kotlin Concepts/);
  assert.equal(await page.locator('meta[property="og:site_name"]').getAttribute('content'), 'Kotlin Concepts');
  for (const artifact of ['llms.txt', 'llms-full.txt', 'data/content.json', 'data/graph.json', 'data/search-index.json', 'robots.txt', 'site-preview.png']) {
    const response = await page.request.get(baseUrl + artifact);
    assert.equal(response.status(), 200, artifact);
    if (!artifact.endsWith('.png')) assert.doesNotMatch(await response.text(), /FP Jargon|Functional Programming Jargon|hemanth\.github\.io/);
  }
  for (const concept of data.concepts) {
    await page.getByRole('button', { name: 'Search concepts', exact: true }).click();
    const search = page.getByRole('dialog', { name: 'Search concepts' });
    await search.getByRole('searchbox').fill(concept.id);
    await search.getByRole('searchbox').press('Enter');
    await page.getByRole('complementary', { name: `${concept.title} concept` }).waitFor();
    assert.equal(new URL(page.url()).hash, `#${concept.id}`);
    await page.getByRole('button', { name: 'Close concept', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Search concepts', exact: true }).click();
  const emptySearch = page.getByRole('dialog', { name: 'Search concepts' });
  await emptySearch.getByRole('searchbox').fill('monad-transformer');
  await emptySearch.getByText('No Kotlin concepts match "monad-transformer"', { exact: true }).waitFor();
  await page.keyboard.press('Escape');
  console.log(`Production release: all ${data.concepts.length} concepts are searchable at the Pages subpath.`);
  const longest = data.concepts.filter(({ curriculum }) => ['coroutines', 'streams-concurrency'].includes(curriculum.categoryId))
    .sort((a, b) => JSON.stringify(b.lesson).length - JSON.stringify(a.lesson).length)[0];
  await page.goto(baseUrl);
  const graph = page.getByRole('region', { name: 'Concept graph' });
  const cameraBeforeControls = await graph.getAttribute('data-camera');
  await graph.getByRole('button', { name: 'deep-dive', exact: true }).dispatchEvent('wheel', { deltaY: 120 });
  assert.equal(await graph.getAttribute('data-camera'), cameraBeforeControls, 'Scrolling graph controls must not zoom the canvas');
  await graph.getByRole('button', { name: 'deep-dive', exact: true }).click();
  assert.equal(await page.getByRole('complementary').count(), 0, 'Graph controls must not select nodes underneath');
  await graph.getByRole('button', { name: 'Path: Kotlin asynchronous streams and concurrency', exact: true }).click();
  await page.mouse.move(1100, 700);
  const cameraBeforeZoom = await graph.getAttribute('data-camera');
  await page.mouse.wheel(0, -240);
  await page.waitForFunction((before) => document.querySelector('[aria-label="Concept graph"]').dataset.camera !== before, cameraBeforeZoom);
  const graphBefore = await graph.evaluate((element) => ({
    camera: element.dataset.camera, selected: element.dataset.selectedConcept,
    pressed: [...element.querySelectorAll('[aria-pressed="true"]')].map((button) => button.textContent)
  }));
  const graphButton = graph.getByRole('button', { name: `Open ${longest.title} from graph · Not assessed`, exact: true });
  await graphButton.focus();
  await graphButton.press('Enter');
  const lesson = page.getByRole('complementary', { name: `${longest.title} concept` });
  assert.equal(await lesson.getByRole('heading', { name: 'Semantics', exact: true }).count(), 0, 'The overview must stay compact');
  await lesson.getByRole('button', { name: 'Study focused lesson' }).click();
  const outline = lesson.getByRole('navigation', { name: 'Lesson outline' });
  await outline.waitFor();
  const reader = lesson.getByRole('region', { name: 'Lesson reading column' });
  const bounds = await lesson.boundingBox();
  assert.ok(bounds.width > 900 && bounds.x > 0 && bounds.x + bounds.width < 1440);
  const readingWidth = await reader.locator('#lesson-start').evaluate((element) => element.getBoundingClientRect().width);
  assert.ok(readingWidth <= 768, 'Long lessons keep a bounded reading width');
  const railBefore = await outline.boundingBox();
  await outline.getByRole('button', { name: 'Common mistakes', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('nav[aria-label="Lesson outline"] [aria-current="location"]')?.textContent === 'Common mistakes');
  assert.ok(await reader.evaluate((element) => element.scrollTop > 400));
  assert.deepEqual(await outline.boundingBox(), railBefore, 'The outline stays fixed while the reader scrolls');
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  await outline.getByRole('button', { name: 'Deep Dives', exact: true }).click();
  await lesson.getByText('Deep Dives', { exact: true }).last().click();
  await lesson.getByRole('region', { name: 'Deep Dive connections' }).waitFor();
  const related = data.concepts.find(({ id }) => id === longest.relationships.related[0]);
  await lesson.getByRole('button', { name: related.title, exact: true }).first().click();
  const scrollBeforePreview = await reader.evaluate((element) => element.scrollTop);
  const preview = lesson.getByRole('dialog', { name: `Concept preview: ${related.title}` });
  await preview.waitFor();
  await page.keyboard.press('Escape');
  await preview.waitFor({ state: 'detached' });
  assert.equal(await reader.evaluate((element) => element.scrollTop), scrollBeforePreview);
  await lesson.getByRole('button', { name: related.title, exact: true }).first().click();
  await preview.getByRole('button', { name: `Study ${related.title}`, exact: true }).click();
  await page.getByRole('navigation', { name: 'Lesson outline' }).waitFor();
  await page.getByRole('button', { name: `Return to ${longest.title} lesson`, exact: true }).click();
  await outline.waitFor();
  // Returning after deliberate study restores the origin's reading position as well.
  assert.equal(await reader.evaluate((element) => element.scrollTop), scrollBeforePreview);
  const pathNavigation = lesson.getByRole('navigation', { name: 'Study path navigation' });
  const currentPath = data.studyPaths.find(({ id }) => id === 'kotlin-streams-concurrency');
  const next = data.concepts.find(({ id }) => id === currentPath.conceptIds[currentPath.conceptIds.indexOf(longest.id) + 1]);
  await pathNavigation.getByRole('button', { name: `Next: ${next.title}`, exact: true }).click();
  assert.equal(new URL(page.url()).hash, `#${next.id}`);
  await page.getByRole('button', { name: `Return to ${longest.title} lesson`, exact: true }).click();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await lesson.getByRole('button', { name: 'Copy stable concept URL' }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), `${baseUrl}#${longest.id}`);
  await lesson.getByRole('button', { name: 'Back to graph', exact: true }).click();
  await lesson.waitFor({ state: 'detached' });
  assert.equal(page.url(), baseUrl);
  assert.deepEqual(await graph.evaluate((element) => ({
    camera: element.dataset.camera, selected: element.dataset.selectedConcept,
    pressed: [...element.querySelectorAll('[aria-pressed="true"]')].map((button) => button.textContent)
  })), graphBefore, 'Closing the lesson restores the exact graph selection, camera, filters, and path');

  const representativeIds = ['platform-types', longest.id, 'custom-contracts'];
  const groups = ['java-developer-foundations', 'kotlin-streams-concurrency', 'kotlin-advanced-boundaries']
    .map((id) => data.studyPaths.find((group) => group.id === id));
  for (const id of representativeIds) {
    await page.goto(`${baseUrl}#${id}`);
    await page.getByRole('button', { name: 'Study focused lesson' }).click();
    await page.getByRole('button', { name: 'Continue to interview practice' }).click();
    const practice = page.getByRole('region', { name: 'Interview practice' });
    await practice.getByRole('textbox').fill('Session scratch must not be exported.');
    await practice.getByRole('button', { name: 'Reveal reasoning' }).click();
    await practice.getByRole('button', { name: 'Can explain', exact: true }).click();
    await page.getByRole('button', { name: 'Back to graph', exact: true }).click();
  }
  for (const group of groups) {
    const summary = page.getByRole('region', { name: `${group.name} group summary` });
    await summary.getByText('Scenario: Not attempted', { exact: true }).waitFor();
    await summary.getByRole('button', { name: 'Work through scenario' }).click();
    const scenario = page.getByRole('dialog', { name: group.scenario.title });
    for (let stage = 1; stage <= group.scenario.stages.length; stage++) {
      await scenario.getByRole('textbox', { name: `Stage ${stage} scratch work` }).fill('State the contract and its evidence.');
      await scenario.getByRole('button', { name: `Reveal stage ${stage} feedback` }).click();
    }
    await scenario.getByRole('button', { name: 'Scenario-ready', exact: true }).click();
    await scenario.getByRole('button', { name: 'Close scenario' }).click();
  }
  await page.reload();
  for (const group of groups) await page.getByRole('region', { name: `${group.name} group summary` }).getByText('Scenario: Scenario-ready', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'deep-dive', exact: true }).click();
  await page.getByRole('group', { name: 'Assessment filters' }).getByRole('button', { name: /Can explain/ }).click();
  for (const id of representativeIds) {
    const concept = data.concepts.find((item) => item.id === id);
    await graph.getByRole('button', { name: `Open ${concept.title} from graph · Can explain`, exact: true }).waitFor({ state: 'attached' });
  }
  assert.equal(await graph.getByRole('button', { name: /Open Explicit backing fields/ }).count(), 0);
  await page.getByRole('button', { name: 'Manage progress', exact: true }).click();
  const progress = page.getByRole('dialog', { name: 'Your learning progress' });
  const downloaded = page.waitForEvent('download');
  await progress.getByRole('button', { name: 'Export progress JSON' }).click();
  const download = await downloaded;
  assert.equal(download.suggestedFilename(), 'kotlin-concepts-progress.json');
  const backup = fs.readFileSync(await download.path());
  const exported = JSON.parse(backup);
  assert.deepEqual(Object.keys(exported).sort(), ['assessments', 'groupAssessments', 'version']);
  assert.deepEqual(Object.keys(exported.assessments).sort(), representativeIds.sort());
  assert.deepEqual(Object.keys(exported.groupAssessments).sort(), groups.map(({ id }) => id).sort());
  assert.doesNotMatch(backup.toString(), /scratch|camera|revealed/);
  const reset = async () => {
    await progress.getByRole('button', { name: 'Reset all progress' }).click();
    await progress.getByRole('button', { name: 'Yes, reset all progress' }).click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('kotlin-concepts-progress'));
      return !Object.keys(saved.assessments).length && !Object.keys(saved.groupAssessments).length;
    });
  };
  await reset();
  await progress.getByLabel('Progress JSON file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: backup });
  await progress.getByText('Progress restored.', { exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('kotlin-concepts-progress'))), exported);
  await reset();
  await progress.getByRole('button', { name: 'Close progress' }).click();
  await page.reload();
  for (const group of groups) await page.getByRole('region', { name: `${group.name} group summary` }).getByText('Scenario: Not attempted', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('Production release: three curriculum groups persist, filter, export, import, and reset independently.');
  console.log(`Production release: longest coroutine lesson (${longest.title}) passed.`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
