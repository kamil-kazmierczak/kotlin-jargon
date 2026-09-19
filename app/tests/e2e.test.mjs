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
    assert.equal(await page.getByRole('complementary').count(), 0);
    console.log('✓ Root visit shows the graph with no concept panel.');

    console.log('Running acceptance: direct concept URL...');
    await page.goto(`${baseUrl}#thunk`, { waitUntil: 'networkidle' });
    await expectConcept('Thunk');
    console.log('✓ Direct #thunk URL opens the Thunk concept.');

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
    await expectConcept('Thunk');
    assert.equal(page.url(), `${baseUrl}#thunk`);
    console.log('✓ Selecting the centered concept from the graph opens its stable URL.');

    console.log('Running acceptance: search selection...');
    await page.keyboard.press('/');
    const search = page.getByRole('dialog', { name: 'Search concepts' });
    await search.getByRole('searchbox', { name: 'Search concepts' }).fill('profunctor');
    await page.keyboard.press('Enter');
    await expectConcept('Profunctor');
    assert.equal(page.url(), `${baseUrl}#profunctor`);
    console.log('✓ Search selection opens Profunctor and its stable URL.');

  } catch (err) {
    console.error('Test failed:', err);
    exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
    process.exit(exitCode);
  }
});
