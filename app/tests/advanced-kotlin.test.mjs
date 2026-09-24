import assert from 'node:assert/strict';

import { LESSON_SECTIONS } from '../src/lessonSections.mjs';
import { withCurriculumPreview } from './preview-browser.mjs';

await withCurriculumPreview(5603, async ({ page, errors, baseUrl }) => {
  await page.goto(baseUrl + '#custom-contracts');
  await page.evaluate(() => localStorage.clear());
  const lesson = page.getByRole('complementary', { name: 'User-defined contracts and flow analysis concept' });
  await lesson.getByRole('button', { name: 'Study this concept' }).click();
  for (const [, name] of LESSON_SECTIONS) {
    await lesson.getByRole('heading', { name, exact: true }).waitFor();
  }
  await lesson.getByRole('button', { name: 'Continue to interview practice' }).click();
  await lesson.getByRole('region', { name: 'Interview practice' }).waitFor();
  await lesson.getByRole('button', { name: 'Close concept' }).click();

  await page.keyboard.press('/');
  const search = page.getByRole('dialog', { name: 'Search concepts' });
  await search.getByRole('searchbox').fill('backing field');
  await page.keyboard.press('Enter');
  await page.getByRole('complementary', { name: 'Explicit backing fields in Kotlin 2.4 concept' }).waitFor();
  assert.equal(new URL(page.url()).hash, '#explicit-backing-fields');
  await page.getByRole('button', { name: 'Close concept' }).click();

  const group = page.getByRole('region', { name: 'Advanced Kotlin design boundaries group summary' });
  await group.getByText('Scenario: Not attempted').waitFor();
  await group.getByRole('button', { name: 'Work through scenario' }).click();
  const scenario = page.getByRole('dialog', { name: 'Design a small framework adapter without hiding its contracts' });
  for (let stage = 1; stage <= 5; stage += 1) {
    await scenario.getByRole('textbox', { name: 'Stage ' + stage + ' scratch work' })
      .fill('State the boundary, cost, guarantee, and version constraint.');
    await scenario.getByRole('button', { name: 'Reveal stage ' + stage + ' feedback' }).click();
  }
  await scenario.getByRole('region', { name: 'Final debrief' })
    .getByText(/Specialized features can remove repeated code/i).waitFor();
  await scenario.getByRole('button', { name: 'Scenario-ready', exact: true }).click();
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('kotlin-concepts-progress')));
  assert.equal(progress.groupAssessments['kotlin-advanced-boundaries'].status, 'scenario-ready');
  assert.deepEqual(errors, []);
  console.log('Advanced Kotlin preview: lesson, search, scenario, and progress passed.');
});
