import assert from 'node:assert/strict';

import { LESSON_SECTIONS } from '../src/lessonSections.mjs';
import { withCurriculumPreview } from './preview-browser.mjs';

await withCurriculumPreview(5400, async ({ page, errors, baseUrl }) => {
  await page.goto(`${baseUrl}#sequences`);
  await page.evaluate(() => localStorage.clear());
  const lesson = page.getByRole('complementary', { name: 'Sequences, evaluation, and pipeline cost concept' });
  await lesson.getByRole('button', { name: 'Study this concept' }).click();
  for (const [, name] of LESSON_SECTIONS) {
    await lesson.getByRole('heading', { name, exact: true }).waitFor();
  }
  await lesson.getByText(/not automatically faster/i).first().waitFor();
  await lesson.getByRole('button', { name: 'Continue to interview practice' }).click();
  await lesson.getByRole('region', { name: 'Interview practice' }).waitFor();
  await lesson.getByRole('button', { name: 'Close concept' }).click();

  await page.keyboard.press('/');
  const search = page.getByRole('dialog', { name: 'Search concepts' });
  await search.getByRole('searchbox').fill('groupingBy');
  await page.keyboard.press('Enter');
  await page.getByRole('complementary', { name: 'Grouping and incremental aggregation concept' }).waitFor();
  assert.equal(new URL(page.url()).hash, '#grouping-aggregation');
  await page.getByRole('button', { name: 'Close concept' }).click();

  const group = page.getByRole('region', { name: 'Kotlin collections and sequences group summary' });
  await group.getByText('Scenario: Not attempted').waitFor();
  await group.getByRole('button', { name: 'Work through scenario' }).click();
  const scenario = page.getByRole('dialog', { name: 'Choose a collection pipeline for a bounded report' });
  for (let stage = 1; stage <= 4; stage += 1) {
    await scenario.getByRole('textbox', { name: `Stage ${stage} scratch work` }).fill('Choose ownership and evaluation from semantics, then account for traversal and allocation.');
    await scenario.getByRole('button', { name: `Reveal stage ${stage} feedback` }).click();
  }
  await scenario.getByRole('region', { name: 'Final debrief' }).getByText(/snapshot establishes structural ownership/i).waitFor();
  await scenario.getByRole('button', { name: 'Scenario-ready', exact: true }).click();
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('kotlin-concepts-progress')));
  assert.equal(progress.groupAssessments['kotlin-collections-sequences'].status, 'scenario-ready');
  assert.deepEqual(errors, []);
  console.log('Collections preview: lessons, search, scenario, and durable group progress passed.');
});
