import assert from 'node:assert/strict';

import { LESSON_SECTIONS } from '../src/lessonSections.mjs';
import { withCurriculumPreview } from './preview-browser.mjs';

await withCurriculumPreview(5200, async ({ page, errors, baseUrl }) => {
  await page.goto(`${baseUrl}#smart-casts`);
  await page.evaluate(() => localStorage.clear());
  const lesson = page.getByRole('complementary', { name: 'Smart casts and stable checks concept' });
  await lesson.getByRole('button', { name: 'Study focused lesson' }).click();
  for (const [, name] of LESSON_SECTIONS) {
    await lesson.getByRole('heading', { name, exact: true }).waitFor();
  }
  await lesson.getByText(/On the Kotlin 2.4 baseline/).waitFor();
  assert.equal(await lesson.locator('code.language-kotlin').count(), 2);
  await lesson.getByRole('button', { name: 'Continue to interview practice' }).click();
  await lesson.getByRole('region', { name: 'Interview practice' }).waitFor();
  await lesson.getByRole('button', { name: 'Close concept' }).click();

  await page.keyboard.press('/');
  const search = page.getByRole('dialog', { name: 'Search concepts' });
  await search.getByRole('searchbox').fill('bottom type');
  await page.keyboard.press('Enter');
  const nothingLesson = page.getByRole('complementary', { name: 'Nothing and non-returning control flow concept' });
  await nothingLesson.waitFor();
  assert.equal(new URL(page.url()).hash, '#nothing');
  await nothingLesson.getByRole('button', { name: 'Close concept' }).click();

  const group = page.getByRole('region', { name: 'Kotlin type system and null safety group summary' });
  await group.getByText('Scenario: Not attempted').waitFor();
  await group.getByRole('button', { name: 'Work through scenario' }).click();
  const scenario = page.getByRole('dialog', { name: 'Make an uncertain Java customer boundary safe' });
  for (let stage = 1; stage <= 4; stage += 1) {
    await scenario.getByRole('textbox', { name: `Stage ${stage} scratch work` }).fill('Normalize the boundary, trace the type proof, and state the failure policy.');
    await scenario.getByRole('button', { name: `Reveal stage ${stage} feedback` }).click();
  }
  const debrief = scenario.getByRole('region', { name: 'Final debrief' });
  await debrief.getByText(/Nothing makes rejection compose/).waitFor();
  await debrief.getByRole('button', { name: 'Scenario-ready', exact: true }).click();
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('kotlin-concepts-progress')));
  assert.equal(progress.groupAssessments['java-developer-foundations'].status, 'scenario-ready');
  assert.deepEqual(progress.assessments, {});
  assert.deepEqual(errors, []);
  console.log('Type-system preview: deep lesson, version labeling, search, staged scenario, and durable group progress passed.');
});
