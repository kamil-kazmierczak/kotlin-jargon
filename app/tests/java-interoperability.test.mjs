import assert from 'node:assert/strict';

import { LESSON_SECTIONS } from '../src/lessonSections.mjs';
import { withCurriculumPreview } from './preview-browser.mjs';

await withCurriculumPreview(5501, async ({ page, errors, baseUrl }) => {
  await page.goto(`${baseUrl}#java-callable-surface`);
  await page.evaluate(() => localStorage.clear());
  const lesson = page.getByRole('complementary', { name: 'Kotlin callable API for Java concept' });
  await lesson.getByRole('button', { name: 'Study focused lesson' }).click();
  for (const [, name] of LESSON_SECTIONS) {
    await lesson.getByRole('heading', { name, exact: true }).waitFor();
  }
  await lesson.getByRole('button', { name: 'Continue to interview practice' }).click();
  await lesson.getByRole('region', { name: 'Interview practice' }).waitFor();
  await lesson.getByRole('button', { name: 'Close concept' }).click();

  await page.keyboard.press('/');
  const search = page.getByRole('dialog', { name: 'Search concepts' });
  await search.getByRole('searchbox').fill('annotation use-site target');
  await page.keyboard.press('Enter');
  await page.getByRole('complementary', { name: 'Annotation targets and Java sealed boundaries concept' }).waitFor();
  assert.equal(new URL(page.url()).hash, '#java-annotation-boundaries');
  await page.getByRole('button', { name: 'Close concept' }).click();

  const group = page.getByRole('region', { name: 'Kotlin and Java interoperability group summary' });
  await group.getByText('Scenario: Not attempted').waitFor();
  await group.getByRole('button', { name: 'Work through scenario' }).click();
  const scenario = page.getByRole('dialog', { name: 'Expose a predictable Kotlin API to Java and consume a Java API safely' });
  for (let stage = 1; stage <= 5; stage += 1) {
    await scenario.getByRole('textbox', { name: `Stage ${stage} scratch work` }).fill('Record the Java signature and the Kotlin boundary decision.');
    await scenario.getByRole('button', { name: `Reveal stage ${stage} feedback` }).click();
  }
  await scenario.getByRole('region', { name: 'Final debrief' }).getByText(/Platform types motivate boundary normalization/i).waitFor();
  await scenario.getByRole('button', { name: 'Scenario-ready', exact: true }).click();
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('kotlin-concepts-progress')));
  assert.equal(progress.groupAssessments['kotlin-java-interoperability'].status, 'scenario-ready');
  assert.deepEqual(errors, []);
  console.log('Java interoperability preview: lesson, search, scenario, and durable group progress passed.');
});
