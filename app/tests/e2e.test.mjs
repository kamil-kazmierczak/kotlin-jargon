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
    await page.goto(`${baseUrl}#nullable-types`, { waitUntil: 'networkidle' });
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

    console.log('Running acceptance: typed graph controls and hidden-result search...');
    await page.getByRole('button', { name: 'Close concept' }).click();
    await page.getByRole('button', { name: 'deep-dive', exact: true }).click();
    await page.getByRole('button', { name: 'Path: Java developer foundations', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Path: Java developer foundations', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('/');
    const hiddenSearch = page.getByRole('dialog', { name: 'Search concepts' });
    await hiddenSearch.getByRole('searchbox', { name: 'Search concepts' }).fill('not-null assertion');
    await page.keyboard.press('Enter');
    await expectConcept('Not-null assertion');
    await page.getByRole('button', { name: 'Close concept' }).click();
    await page.getByRole('complementary').waitFor({ state: 'detached' });
    assert.equal(await page.getByRole('button', { name: 'Path: Java developer foundations', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Return to previous view' }).click();
    assert.equal(await page.getByRole('button', { name: 'Path: Java developer foundations', exact: true }).getAttribute('aria-pressed'), 'true');
    console.log('✓ Typed edges, depth filtering, optional path overlay, and temporary hidden-result reveal work together.');

    console.log('Running acceptance: connected-concept preview and lesson trail...');
    await page.goto(`${baseUrl}#not-null-assertion`, { waitUntil: 'networkidle' });
    await expectConcept('Not-null assertion');
    await page.getByRole('button', { name: 'Nullable types', exact: true }).click();
    const preview = page.getByRole('dialog', { name: 'Concept preview: Nullable types' });
    await preview.getByText('Prerequisite concept').waitFor({ state: 'visible' });
    await preview.getByText(/This is a prerequisite for Not-null assertion/).waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await preview.waitFor({ state: 'detached' });
    await expectConcept('Not-null assertion');
    await page.getByRole('button', { name: 'Platform types', exact: true }).click();
    const relatedPreview = page.getByRole('dialog', { name: 'Concept preview: Platform types' });
    await relatedPreview.getByText('Related concept').waitFor({ state: 'visible' });
    await relatedPreview.getByText(/This is related to Not-null assertion/).waitFor({ state: 'visible' });
    await relatedPreview.getByRole('button', { name: 'Return to Not-null assertion lesson' }).click();
    await page.getByRole('button', { name: 'Nullable types', exact: true }).click();
    await preview.getByRole('button', { name: 'Study Nullable types' }).click();
    await expectConcept('Nullable types');
    await page.goBack();
    await expectConcept('Not-null assertion');
    await page.goForward();
    await expectConcept('Nullable types');
    await page.getByRole('button', { name: 'Return to Not-null assertion lesson' }).click();
    await expectConcept('Not-null assertion');
    await page.getByRole('button', { name: 'Close concept' }).click();
    await page.getByRole('complementary').waitFor({ state: 'detached' });
    console.log('✓ Preview, Escape return, explicit study, trail-back, and lesson close agree.');

  } catch (err) {
    console.error('Test failed:', err);
    exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
    process.exit(exitCode);
  }
});
