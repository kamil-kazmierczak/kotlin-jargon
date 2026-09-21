import assert from 'node:assert/strict';

import { LESSON_SECTIONS } from '../src/lessonSections.mjs';
import { withCurriculumPreview } from './preview-browser.mjs';

await withCurriculumPreview(5199, async ({ page, errors, baseUrl }) => {
  await page.goto(`${baseUrl}#initialization`);
  const lesson = page.getByRole('complementary', { name: 'Initialization order and safe construction concept' });
  await lesson.getByRole('button', { name: 'Study this concept' }).click();
  for (const [, name] of LESSON_SECTIONS) {
    await lesson.getByRole('heading', { name, exact: true }).waitFor();
  }
  await lesson.getByText('This repaired design traces', { exact: false }).waitFor();
  assert.equal(await lesson.locator('code.language-kotlin').count(), 3);
  assert.equal(await lesson.locator('code.language-java').count(), 1);
  await lesson.getByRole('button', { name: 'Continue to interview practice' }).click();
  await lesson.getByRole('region', { name: 'Interview practice' }).waitFor();
  await lesson.getByRole('button', { name: 'Close concept' }).click();

  await page.keyboard.press('/');
  const search = page.getByRole('dialog', { name: 'Search concepts' });
  await search.getByRole('searchbox').fill('semicolon');
  await page.keyboard.press('Enter');
  const syntax = page.getByRole('complementary', { name: 'Basic Kotlin syntax concept' });
  await syntax.waitFor();
  assert.equal(new URL(page.url()).hash, '#basic-syntax');
  await syntax.getByRole('button', { name: 'Close concept' }).click();

  const scenarioButton = page.getByRole('region', { name: 'Kotlin execution and core semantics group summary' })
    .getByRole('button', { name: 'Work through scenario' });
  await scenarioButton.click();
  const scenario = page.getByRole('dialog', { name: 'Review a Kotlin cache policy for Java callers' });
  for (let stage = 1; stage <= 4; stage += 1) {
    await scenario.getByRole('textbox', { name: `Stage ${stage} scratch work` }).fill('Trace the order, state the contract, and justify the Java API.');
    await scenario.getByRole('button', { name: `Reveal stage ${stage} feedback` }).click();
  }
  await scenario.getByRole('region', { name: 'Final debrief' }).waitFor();
  await scenario.getByRole('button', { name: 'Scenario-ready', exact: true }).click();
  await page.reload();
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('kotlin-concepts-progress')));
  assert.equal(progress.groupAssessments['kotlin-execution-core-semantics'].status, 'scenario-ready');
  assert.deepEqual(progress.assessments, {});
  assert.deepEqual(errors, []);
  console.log('Core semantics preview: lesson sections, adjacent code prose, syntax search, staged scenario, and independent durable progress passed.');
});
