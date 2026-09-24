import assert from 'node:assert/strict';

import { LESSON_SECTIONS } from '../src/lessonSections.mjs';
import { withCurriculumPreview } from './preview-browser.mjs';

await withCurriculumPreview(5500, async ({ page, errors, baseUrl }) => {
  await page.goto(`${baseUrl}#type-projections`);
  await page.evaluate(() => localStorage.clear());
  const lesson = page.getByRole('complementary', { name: 'Use-site and star projections concept' });
  await lesson.getByRole('button', { name: 'Study focused lesson' }).click();
  for (const [, name] of LESSON_SECTIONS) {
    await lesson.getByRole('heading', { name, exact: true }).waitFor();
  }
  await lesson.getByText(/restricted view/i).first().waitFor();
  await lesson.getByRole('button', { name: 'Continue to interview practice' }).click();
  await lesson.getByRole('region', { name: 'Interview practice' }).waitFor();
  await lesson.getByRole('button', { name: 'Close concept' }).click();

  await page.keyboard.press('/');
  const search = page.getByRole('dialog', { name: 'Search concepts' });
  await search.getByRole('searchbox').fill('unchecked cast');
  await page.keyboard.press('Enter');
  await page.getByRole('complementary', { name: 'Erased generic runtime types concept' }).waitFor();
  assert.equal(new URL(page.url()).hash, '#generic-runtime-types');
  await page.getByRole('button', { name: 'Close concept' }).click();

  const group = page.getByRole('region', { name: 'Kotlin generics and abstraction group summary' });
  await group.getByText('Scenario: Not attempted').waitFor();
  await group.getByRole('button', { name: 'Work through scenario' }).click();
  const scenario = page.getByRole('dialog', { name: 'Design and defend a type-safe variant API' });
  for (let stage = 1; stage <= 4; stage += 1) {
    await scenario.getByRole('textbox', { name: `Stage ${stage} scratch work` }).fill('Separate constraints, substitutability, available operations, and runtime evidence.');
    await scenario.getByRole('button', { name: `Reveal stage ${stage} feedback` }).click();
  }
  await scenario.getByRole('region', { name: 'Final debrief' }).getByText(/compile-time substitutability/i).waitFor();
  await scenario.getByRole('button', { name: 'Scenario-ready', exact: true }).click();
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('kotlin-concepts-progress')));
  assert.equal(progress.groupAssessments['kotlin-generics-abstraction'].status, 'scenario-ready');
  assert.deepEqual(errors, []);
  console.log('Generics preview: lessons, search, scenario, and durable group progress passed.');
});
