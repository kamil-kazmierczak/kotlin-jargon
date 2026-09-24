import assert from 'node:assert/strict';

import { LESSON_SECTIONS } from '../src/lessonSections.mjs';
import { withCurriculumPreview } from './preview-browser.mjs';

await withCurriculumPreview(5300, async ({ page, errors, baseUrl }) => {
  await page.goto(`${baseUrl}#data-classes`);
  await page.evaluate(() => localStorage.clear());
  const lesson = page.getByRole('complementary', { name: 'Data classes and generated value behavior concept' });
  await lesson.getByRole('button', { name: 'Study focused lesson' }).click();
  for (const [, name] of LESSON_SECTIONS) {
    await lesson.getByRole('heading', { name, exact: true }).waitFor();
  }
  await lesson.getByText(/shallow copy/i).first().waitFor();
  await lesson.getByRole('button', { name: 'Continue to interview practice' }).click();
  await lesson.getByRole('region', { name: 'Interview practice' }).waitFor();
  await lesson.getByRole('button', { name: 'Close concept' }).click();

  await page.keyboard.press('/');
  const search = page.getByRole('dialog', { name: 'Search concepts' });
  await search.getByRole('searchbox').fill('boxing wrapper');
  await page.keyboard.press('Enter');
  const valueLesson = page.getByRole('complementary', { name: 'Value classes and representation boundaries concept' });
  await valueLesson.waitFor();
  assert.equal(new URL(page.url()).hash, '#value-classes');
  await valueLesson.getByRole('button', { name: 'Close concept' }).click();

  const group = page.getByRole('region', { name: 'Kotlin domain modeling group summary' });
  await group.getByText('Scenario: Not attempted').waitFor();
  await group.getByRole('button', { name: 'Work through scenario' }).click();
  const scenario = page.getByRole('dialog', { name: 'Design a durable order model for Kotlin and Java' });
  for (let stage = 1; stage <= 4; stage += 1) {
    await scenario.getByRole('textbox', { name: `Stage ${stage} scratch work` }).fill('Choose the model from its invariants, generated behavior, representation, and Java API.');
    await scenario.getByRole('button', { name: `Reveal stage ${stage} feedback` }).click();
  }
  await scenario.getByRole('region', { name: 'Final debrief' }).getByText(/closed state space/i).waitFor();
  await scenario.getByRole('button', { name: 'Scenario-ready', exact: true }).click();
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('kotlin-concepts-progress')));
  assert.equal(progress.groupAssessments['kotlin-domain-modeling'].status, 'scenario-ready');
  assert.deepEqual(errors, []);
  console.log('Domain-modeling preview: lessons, search, scenario, and durable group progress passed.');
});
