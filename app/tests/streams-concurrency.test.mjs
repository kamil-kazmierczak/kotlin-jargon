import assert from 'node:assert/strict';

import { LESSON_SECTIONS } from '../src/lessonSections.mjs';
import { withCurriculumPreview } from './preview-browser.mjs';

await withCurriculumPreview(5602, async ({ page, errors, baseUrl }) => {
  await page.goto(baseUrl + '#flow-backpressure');
  await page.evaluate(() => localStorage.clear());
  const lesson = page.getByRole('complementary', { name: 'Flow backpressure and overload policies concept' });
  await lesson.getByRole('button', { name: 'Study this concept' }).click();
  for (const [, name] of LESSON_SECTIONS) {
    await lesson.getByRole('heading', { name, exact: true }).waitFor();
  }
  await lesson.getByRole('button', { name: 'Continue to interview practice' }).click();
  await lesson.getByRole('region', { name: 'Interview practice' }).waitFor();
  await lesson.getByRole('button', { name: 'Close concept' }).click();

  await page.keyboard.press('/');
  const search = page.getByRole('dialog', { name: 'Search concepts' });
  await search.getByRole('searchbox').fill('replay cache');
  await page.keyboard.press('Enter');
  await page.getByRole('complementary', { name: 'SharedFlow for broadcast events concept' }).waitFor();
  assert.equal(new URL(page.url()).hash, '#shared-flow-events');
  await page.getByRole('button', { name: 'Close concept' }).click();

  const group = page.getByRole('region', { name: 'Kotlin asynchronous streams and concurrency group summary' });
  await group.getByText('Scenario: Not attempted').waitFor();
  await group.getByRole('button', { name: 'Work through scenario' }).click();
  const scenario = page.getByRole('dialog', { name: 'Design a bounded order update pipeline' });
  for (let stage = 1; stage <= 6; stage += 1) {
    await scenario.getByRole('textbox', { name: 'Stage ' + stage + ' scratch work' })
      .fill('Name the owner, subscriber contract, delivery policy, overload behavior, and state invariant.');
    await scenario.getByRole('button', { name: 'Reveal stage ' + stage + ' feedback' }).click();
  }
  await scenario.getByRole('region', { name: 'Final debrief' })
    .getByText(/a channel can distribute work but cannot provide crash durability/i).waitFor();
  await scenario.getByRole('button', { name: 'Scenario-ready', exact: true }).click();
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('kotlin-concepts-progress')));
  assert.equal(progress.groupAssessments['kotlin-streams-concurrency'].status, 'scenario-ready');
  assert.deepEqual(errors, []);
  console.log('Streams and concurrency preview: lesson, search, scenario, and durable group progress passed.');
});
