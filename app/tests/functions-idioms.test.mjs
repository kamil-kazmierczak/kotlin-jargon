import assert from 'node:assert/strict';

import { LESSON_SECTIONS } from '../src/lessonSections.mjs';
import { withCurriculumPreview } from './preview-browser.mjs';

await withCurriculumPreview(5500, async ({ page, errors, baseUrl }) => {
  await page.goto(`${baseUrl}#scope-functions`);
  await page.evaluate(() => localStorage.clear());
  const lesson = page.getByRole('complementary', { name: 'Scope functions by receiver and result concept' });
  await lesson.getByRole('button', { name: 'Study this concept' }).click();
  for (const [, name] of LESSON_SECTIONS) {
    await lesson.getByRole('heading', { name, exact: true }).waitFor();
  }
  await lesson.getByText(/two-by-two grid/i).first().waitFor();
  await lesson.getByRole('button', { name: 'Continue to interview practice' }).click();
  await lesson.getByRole('region', { name: 'Interview practice' }).waitFor();
  await lesson.getByRole('button', { name: 'Close concept' }).click();

  await page.keyboard.press('/');
  const search = page.getByRole('dialog', { name: 'Search concepts' });
  await search.getByRole('searchbox').fill('non-local return');
  await page.keyboard.press('Enter');
  await page.getByRole('complementary', { name: 'Inline control flow and reified type parameters concept' }).waitFor();
  assert.equal(new URL(page.url()).hash, '#inline-reified-functions');
  await page.getByRole('button', { name: 'Close concept' }).click();

  const group = page.getByRole('region', { name: 'Kotlin functions and idioms group summary' });
  await group.getByText('Scenario: Not attempted').waitFor();
  await group.getByRole('button', { name: 'Work through scenario' }).click();
  const scenario = page.getByRole('dialog', { name: 'Design and defend a readable higher-order API' });
  for (let stage = 1; stage <= 4; stage += 1) {
    await scenario.getByRole('textbox', { name: `Stage ${stage} scratch work` }).fill('Make receivers, callback behavior, results, generated code, and Java access explicit.');
    await scenario.getByRole('button', { name: `Reveal stage ${stage} feedback` }).click();
  }
  await scenario.getByRole('region', { name: 'Final debrief' }).getByText(/higher-order contract owns predicate timing/i).waitFor();
  await scenario.getByRole('button', { name: 'Scenario-ready', exact: true }).click();
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('kotlin-concepts-progress')));
  assert.equal(progress.groupAssessments['kotlin-functions-idioms'].status, 'scenario-ready');
  assert.deepEqual(errors, []);
  console.log('Functions and idioms preview: lessons, search, scenario, and durable group progress passed.');
});
