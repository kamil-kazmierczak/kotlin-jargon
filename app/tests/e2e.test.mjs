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

    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());

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
    await page.getByRole('button', { name: 'Path: Kotlin type system and null safety', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Path: Kotlin type system and null safety', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('/');
    const hiddenSearch = page.getByRole('dialog', { name: 'Search concepts' });
    await hiddenSearch.getByRole('searchbox', { name: 'Search concepts' }).fill('not-null assertion');
    await page.keyboard.press('Enter');
    await expectConcept('Not-null assertion');
    await page.getByRole('button', { name: 'Close concept' }).click();
    await page.getByRole('complementary').waitFor({ state: 'detached' });
    assert.equal(await page.getByRole('button', { name: 'Path: Kotlin type system and null safety', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Return to previous view' }).click();
    assert.equal(await page.getByRole('button', { name: 'Path: Kotlin type system and null safety', exact: true }).getAttribute('aria-pressed'), 'true');
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

    console.log('Running acceptance: platform-types interview practice and self-assessment...');
    await page.goto(`${baseUrl}#platform-types`, { waitUntil: 'networkidle' });
    await expectConcept('Platform types');
    assert.equal(await page.getByRole('heading', { name: 'Interview practice' }).count(), 0);
    await page.getByRole('button', { name: 'Study this concept' }).click();
    await page.getByRole('button', { name: 'Continue to interview practice' }).click();
    const practice = page.getByRole('region', { name: 'Interview practice' });
    await practice.getByText(/Java API returns an unannotated String/).waitFor({ state: 'visible' });
    assert.equal(await practice.getByRole('heading', { name: 'Essential points' }).count(), 0);
    assert.equal(await practice.getByText('Not assessed', { exact: true }).count(), 1);

    const scratch = practice.getByRole('textbox', { name: 'Optional scratch answer' });
    await scratch.fill('I would normalize the Java boundary to String?.');
    assert.equal(await practice.getByRole('button', { name: 'Reveal reasoning' }).isEnabled(), true);
    await practice.getByRole('button', { name: 'Reveal reasoning' }).click();
    await practice.getByRole('heading', { name: 'Essential points' }).waitFor({ state: 'visible' });
    assert.equal(await practice.getByText('Not assessed', { exact: true }).count(), 1);

    await practice.getByRole('button', { name: 'Can explain' }).click();
    await practice.getByText(/^Assessed .*Can explain$/).waitFor({ state: 'visible' });
    const storedProgress = await page.evaluate(() => JSON.parse(localStorage.getItem('kotlin-concepts-progress')));
    assert.deepEqual(Object.keys(storedProgress).sort(), ['assessments', 'groupAssessments', 'version']);
    assert.equal(storedProgress.version, 2);
    assert.deepEqual(storedProgress.groupAssessments, {});
    assert.equal(storedProgress.assessments['platform-types'].status, 'can-explain');
    assert.equal(JSON.stringify(storedProgress).includes('normalize the Java boundary'), false);

    await page.reload({ waitUntil: 'networkidle' });
    await expectConcept('Platform types');
    assert.equal(await page.getByRole('heading', { name: 'Interview practice' }).count(), 0);
    assert.equal(await page.getByRole('heading', { name: 'Essential points' }).count(), 0);
    assert.equal(await page.getByRole('textbox', { name: 'Optional scratch answer' }).count(), 0);
    await page.getByRole('button', { name: 'Continue to interview practice' }).click();
    const revisitedPractice = page.getByRole('region', { name: 'Interview practice' });
    assert.equal(await revisitedPractice.getByRole('textbox', { name: 'Optional scratch answer' }).inputValue(), '');
    assert.equal(await revisitedPractice.getByRole('heading', { name: 'Essential points' }).count(), 0);
    await revisitedPractice.getByText(/^Assessed .*Can explain$/).waitFor({ state: 'visible' });

    await revisitedPractice.getByRole('button', { name: 'Needs review' }).click();
    await revisitedPractice.getByText(/^Assessed .*Needs review$/).waitFor({ state: 'visible' });
    const reassessedProgress = await page.evaluate(() => JSON.parse(localStorage.getItem('kotlin-concepts-progress')));
    assert.deepEqual(Object.keys(reassessedProgress.assessments['platform-types']).sort(), ['assessedAt', 'status']);
    assert.equal(reassessedProgress.assessments['platform-types'].status, 'needs-review');
    console.log('✓ Scratch and reveal stay ephemeral; explicit assessment persists and can be downgraded.');

    console.log('Running acceptance: progress filtering preserves prerequisites...');
    await page.getByRole('button', { name: 'Close concept' }).click();
    await page.getByRole('button', { name: 'deep-dive', exact: true }).click();
    await page.getByRole('button', { name: 'Path: Kotlin type system and null safety', exact: true }).click();
    const assessmentFilters = page.getByRole('group', { name: 'Assessment filters' });
    await assessmentFilters.getByRole('button', { name: /Needs review/ }).click();
    await page.getByRole('button', { name: /Open Platform types from graph · Needs review/ }).waitFor({ state: 'attached' });
    await page.getByRole('button', { name: /Open Nullable types from graph · Not assessed/ }).waitFor({ state: 'attached' });
    assert.equal(await page.getByRole('button', { name: /Open Not-null assertion from graph/ }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Path: Kotlin type system and null safety', exact: true }).getAttribute('aria-pressed'), 'true');
    console.log('✓ Assessment filtering focuses the graph while retaining prerequisites and the curated path.');

    console.log('Running acceptance: staged curriculum-group scenario and independent readiness...');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    const groupSummary = page.getByRole('region', { name: 'Kotlin execution and core semantics group summary' });
    await groupSummary.getByText(/Concepts: 9 Not assessed/).waitFor({ state: 'visible' });
    await groupSummary.getByText('Scenario: Not attempted').waitFor({ state: 'visible' });
    await groupSummary.getByRole('button', { name: 'Work through scenario' }).click();
    const scenario = page.getByRole('dialog', { name: 'Review a Kotlin cache policy for Java callers' });
    await scenario.getByRole('heading', { name: 'Review a Kotlin cache policy for Java callers' }).waitFor({ state: 'visible' });
    assert.equal(await scenario.getByLabel('Stage 1: Prediction').count(), 1);
    assert.equal(await scenario.getByLabel('Stage 2: Diagnosis').count(), 0);
    assert.equal(await scenario.getByRole('heading', { name: 'Final debrief' }).count(), 0);
    assert.equal(await scenario.getByRole('button', { name: 'Reveal stage 1 feedback' }).isDisabled(), true);

    await scenario.getByRole('textbox', { name: 'Stage 1 scratch work' }).fill('Trace construction before derived initialization.');
    await scenario.getByRole('button', { name: 'Reveal stage 1 feedback' }).click();
    await scenario.getByText(/Safe construction records base,init/).waitFor({ state: 'visible' });
    assert.equal(await scenario.getByLabel('Stage 2: Diagnosis').count(), 1);
    assert.equal(await scenario.getByLabel('Stage 3: Prediction').count(), 0);

    await scenario.getByRole('textbox', { name: 'Stage 2 scratch work' }).fill('Compare generated value equality with identity.');
    await scenario.getByRole('button', { name: 'Reveal stage 2 feedback' }).click();
    assert.equal(await scenario.getByLabel('Stage 3: Prediction').count(), 1);
    await scenario.getByRole('textbox', { name: 'Stage 3 scratch work' }).fill('Preserve the try result after normal cleanup.');
    await scenario.getByRole('button', { name: 'Reveal stage 3 feedback' }).click();
    await scenario.getByRole('textbox', { name: 'Stage 4 scratch work' }).fill('Compile and run a real Java consumer.');
    await scenario.getByRole('button', { name: 'Reveal stage 4 feedback' }).click();

    const debrief = scenario.getByRole('region', { name: 'Final debrief' });
    await debrief.getByText(/Construction establishes the state/).waitFor({ state: 'visible' });
    await debrief.getByText('Group-level reasoning rubric').waitFor({ state: 'visible' });
    await debrief.getByRole('button', { name: 'Scenario-ready' }).click();
    await debrief.getByText(/^Assessed .*Scenario-ready$/).waitFor({ state: 'visible' });
    const scenarioProgress = await page.evaluate(() => JSON.parse(localStorage.getItem('kotlin-concepts-progress')));
    assert.equal(scenarioProgress.groupAssessments['kotlin-execution-core-semantics'].status, 'scenario-ready');
    assert.equal(JSON.stringify(scenarioProgress).includes('Trace construction'), false);
    assert.equal(JSON.stringify(scenarioProgress).includes('revealedCount'), false);

    await scenario.getByRole('button', { name: 'Close scenario' }).click();
    await groupSummary.getByText('Scenario: Scenario-ready').waitFor({ state: 'visible' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('region', { name: 'Kotlin execution and core semantics group summary' }).getByText('Scenario: Scenario-ready').waitFor({ state: 'visible' });
    console.log('✓ Stages disclose one at a time, debrief connects concepts, scratch stays ephemeral, and group readiness persists independently.');

    console.log('Running acceptance: progress export, import validation, replacement, and reset...');
    await page.getByRole('button', { name: 'Manage progress' }).click();
    const progressDialog = page.getByRole('dialog', { name: 'Your learning progress' });
    const downloadPromise = page.waitForEvent('download');
    await progressDialog.getByRole('button', { name: 'Export progress JSON' }).click();
    const download = await downloadPromise;
    const exportedProgress = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.deepEqual(Object.keys(exportedProgress).sort(), ['assessments', 'groupAssessments', 'version']);
    assert.equal(exportedProgress.version, 2);
    assert.equal(exportedProgress.assessments['platform-types'].status, 'needs-review');
    assert.equal(exportedProgress.groupAssessments['kotlin-execution-core-semantics'].status, 'scenario-ready');

    const importInput = progressDialog.getByLabel('Progress JSON file');
    await importInput.setInputFiles({
      name: 'invalid-progress.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        version: 2,
        assessments: { unknown: { status: 'can-explain', assessedAt: '2026-09-20' } },
        groupAssessments: {}
      }))
    });
    await progressDialog.getByText(/^Import failed: Unknown concept: unknown\.$/).waitFor({ state: 'visible' });
    const afterFailedImport = await page.evaluate(() => JSON.parse(localStorage.getItem('kotlin-concepts-progress')));
    assert.equal(afterFailedImport.assessments['platform-types'].status, 'needs-review');

    await importInput.setInputFiles({
      name: 'valid-progress.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        version: 2,
        assessments: { 'nullable-types': { status: 'can-explain', assessedAt: '2026-09-20' } },
        groupAssessments: { 'kotlin-execution-core-semantics': { status: 'needs-review', assessedAt: '2026-09-20' } }
      }))
    });
    await progressDialog.getByText('Progress restored.').waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const progress = JSON.parse(localStorage.getItem('kotlin-concepts-progress'));
      return progress.assessments['nullable-types']?.status === 'can-explain' &&
        !progress.assessments['platform-types'] &&
        progress.groupAssessments['kotlin-execution-core-semantics']?.status === 'needs-review';
    });

    await progressDialog.getByRole('button', { name: 'Reset all progress' }).click();
    const resetDialog = progressDialog.getByRole('alertdialog', { name: 'Confirm reset progress' });
    await resetDialog.getByRole('button', { name: 'Yes, reset all progress' }).click();
    await progressDialog.getByText('Progress reset.').waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const progress = JSON.parse(localStorage.getItem('kotlin-concepts-progress'));
      return Object.keys(progress.assessments).length === 0 && Object.keys(progress.groupAssessments).length === 0;
    });
    console.log('✓ Export is versioned, invalid imports preserve data, valid imports replace it, and reset requires confirmation.');

  } catch (err) {
    console.error('Test failed:', err);
    exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
    process.exit(exitCode);
  }
});
