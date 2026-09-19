import http from 'node:http';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0].split('#')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const indexPath = path.join(distDir, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
  }
});

const PORT = 5198;
server.listen(PORT, '127.0.0.1', async () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  let exitCode = 0;
  let browser;

  try {
    const launchOptions = { headless: true };
    if (fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')) {
      launchOptions.executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (fs.existsSync('/usr/bin/chromium')) {
      launchOptions.executablePath = '/usr/bin/chromium';
    }
    browser = await chromium.launch(launchOptions);
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(10000);
    const baseUrl = `http://localhost:${PORT}/`;

    const expectConcept = async (title) => {
      const panel = page.getByRole('complementary', { name: `${title} concept` });
      await panel.waitFor({ state: 'visible' });
      await panel.getByRole('heading', { name: title, exact: true }).waitFor({ state: 'visible' });
    };

    console.log('Running acceptance: clean root visit...');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByRole('region', { name: 'Concept graph' }).waitFor({ state: 'visible' });
    await page.getByRole('heading', { name: 'Kotlin Concepts' }).waitFor({ state: 'visible' });
    assert.equal(await page.getByRole('complementary').count(), 0);
    assert.equal(await page.getByText('FP Jargon').count(), 0);
    console.log('✓ Root visit shows the Kotlin graph with no legacy catalogue or concept panel.');

    console.log('Running acceptance: direct concept URL...');
    await page.goto(`${baseUrl}#nullable-types`, { waitUntil: 'networkidle' });
    await expectConcept('Nullable types');
    const overview = page.getByRole('region', { name: 'Concept Overview' });
    await overview.getByText(/missing value explicit/).waitFor({ state: 'visible' });
    await overview.getByText(/Kotlin separates nullable and non-null types/).waitFor({ state: 'visible' });
    await overview.getByText('Core', { exact: true }).waitFor({ state: 'visible' });
    await overview.getByText('None', { exact: true }).waitFor({ state: 'visible' });
    await overview.getByRole('button', { name: 'Study this concept' }).click();
    await page.waitForFunction(() => {
      const lesson = document.getElementById('lesson-start');
      const scroller = lesson?.parentElement;
      if (!lesson || !scroller) return false;
      return scroller.scrollTop > 0;
    });
    await page.getByRole('heading', { name: 'Semantics' }).waitFor({ state: 'visible' });
    console.log('✓ Stable URL opens the docked Nullable types Concept Overview.');

    console.log('Running acceptance: close concept...');
    await page.getByRole('button', { name: 'Close concept' }).click();
    await page.getByRole('complementary').waitFor({ state: 'detached' });
    assert.equal(page.url(), baseUrl);
    console.log('✓ Closing the concept returns to the clean root URL.');

    console.log('Running acceptance: graph selection...');
    const graph = page.getByRole('region', { name: 'Concept graph' });
    await page.waitForTimeout(1500);
    const graphBounds = await graph.boundingBox();
    assert.ok(graphBounds, 'Concept graph should have visible bounds');
    await page.mouse.click(
      graphBounds.x + graphBounds.width / 2,
      graphBounds.y + graphBounds.height / 2
    );
    await expectConcept('Nullable types');
    assert.equal(page.url(), `${baseUrl}#nullable-types`);
    console.log('✓ Selecting Nullable types from the graph opens its stable URL.');

    console.log('Running acceptance: search selection...');
    await page.keyboard.press('/');
    const search = page.getByRole('dialog', { name: 'Search concepts' });
    await search.getByRole('searchbox', { name: 'Search concepts' }).fill('nullable');
    await page.keyboard.press('Enter');
    await expectConcept('Nullable types');
    assert.equal(page.url(), `${baseUrl}#nullable-types`);
    console.log('✓ Search selection opens Nullable types and its stable URL.');

    console.log('Running acceptance: focused platform-types lesson...');
    await page.goto(`${baseUrl}#platform-types`, { waitUntil: 'networkidle' });
    await expectConcept('Platform types');
    const platformOverview = page.getByRole('region', { name: 'Concept Overview' });
    await platformOverview.getByText(/flexible view of a Java type/).waitFor({ state: 'visible' });
    await platformOverview.getByText(/nullability Kotlin cannot prove/).waitFor({ state: 'visible' });
    await platformOverview.getByText('Core', { exact: true }).waitFor({ state: 'visible' });
    await platformOverview.getByText('Nullable types', { exact: true }).waitFor({ state: 'visible' });
    await platformOverview.getByRole('button', { name: 'Study focused lesson' }).click();
    const lesson = page.getByRole('region', { name: 'Platform types focused lesson' });
    await lesson.waitFor({ state: 'visible' });
    const lessonNavigation = page.getByRole('complementary', { name: 'Lesson navigation' });
    await lessonNavigation.getByRole('button', { name: 'Semantics' }).click();
    assert.equal(await lessonNavigation.getByRole('button', { name: 'Semantics' }).getAttribute('aria-current'), 'location');
    await lesson.getByText('Static result: Anonymous').waitFor({ state: 'visible' });
    await lessonNavigation.getByRole('button', { name: 'Worked example' }).click();
    await lesson.locator('button[title="Copy code to clipboard"]').first().waitFor({ state: 'visible' });
    assert.equal(await lesson.locator('code.language-java').count(), 1);
    assert.equal(await lesson.locator('code.language-kotlin').count(), 2);
    await lesson.getByText('JavaDirectory').first().waitFor({ state: 'visible' });
    const deepDive = lesson.getByRole('button', { name: /Deep Dive/ });
    await deepDive.click();
    assert.equal(await deepDive.getAttribute('aria-expanded'), 'true');
    await lesson.getByText(/annotation enhancement/i).waitFor({ state: 'visible' });
    const studyNavigation = lesson.getByRole('navigation', { name: 'Study path navigation' });
    assert.equal(await studyNavigation.getByRole('button', { name: 'Previous' }).isDisabled(), false);
    assert.equal(await studyNavigation.getByRole('button', { name: 'Next' }).isDisabled(), true);
    await lessonNavigation.getByRole('button', { name: 'Back to graph' }).click();
    await lesson.waitFor({ state: 'detached' });
    await page.getByRole('region', { name: 'Concept graph' }).waitFor({ state: 'visible' });
    console.log('✓ Platform types opens a focused lesson with navigable reading structure and a graph return.');

  } catch (err) {
    console.error('Test failed:', err);
    exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
    process.exit(exitCode);
  }
});
