import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildContentModel, readContentSources } from '../scripts/content-pipeline.mjs';

const appDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDirectory = path.resolve(appDirectory, '..');
const sources = readContentSources({
  manifestPath: path.join(repositoryDirectory, 'content/curriculum.json'),
  conceptsDirectory: path.join(repositoryDirectory, 'content/concepts')
});
const preview = buildContentModel(sources, { publicationMode: 'preview' });
const production = buildContentModel(sources, { publicationMode: 'production' });
const conceptIds = [
  'flow-cold-lifecycle',
  'state-flow-state',
  'shared-flow-events',
  'flow-backpressure',
  'coroutine-channels',
  'shared-state-synchronization',
  'coroutine-testing'
];

test('streams and concurrency form a complete review-ready study path', () => {
  const group = preview.studyPaths.find(({ id }) => id === 'kotlin-streams-concurrency');
  assert.equal(group.name, 'Kotlin asynchronous streams and concurrency');
  assert.deepEqual(group.conceptIds, conceptIds);
  assert.equal(group.scenario.stages.length, 6);
  assert.match(group.scenario.title, /order update pipeline/i);

  const concepts = new Map(preview.concepts.map((concept) => [concept.id, concept]));
  for (const id of conceptIds) {
    const concept = concepts.get(id);
    assert.equal(concept.publication.status, 'review-ready');
    assert.equal(concept.profile, 'substantial');
    assert.equal(concept.curriculum.categoryId, 'streams-concurrency');
    assert.ok(concept.lesson.knowledgeCheck);
    assert.ok(concept.lesson.decisionGuidance);
    assert.ok(concept.interview.question);
    assert.ok(concept.provenance.sources.some(({ url }) => new URL(url).hostname === 'kotlinlang.org'));
  }

  assert.equal(production.studyPaths.some(({ id }) => id === group.id), false);
});

test('graph prerequisites connect stream choices to ownership, collections, types, and tests', () => {
  const concepts = new Map(preview.concepts.map((concept) => [concept.id, concept]));
  const prerequisites = conceptIds.flatMap((id) => concepts.get(id).relationships.prerequisites);

  for (const required of [
    'coroutine-ownership',
    'coroutine-cancellation',
    'collection-transformations',
    'collection-interfaces',
    'immutability',
    'generic-constraints'
  ]) assert.ok(prerequisites.includes(required), 'missing prerequisite ' + required);

  const authoredLessons = conceptIds
    .map((id) => sources.conceptSources.find(({ source }) => source.includes('id: ' + id + '\n')).source)
    .join('\n');
  for (const claim of [
    'cold',
    'StateFlow',
    'SharedFlow',
    'Channel',
    'backpressure',
    'Mutex',
    'runTest',
    'backgroundScope',
    'virtual time'
  ]) assert.match(authoredLessons, new RegExp(claim, 'i'));
  const code = conceptIds.map((id) => concepts.get(id).lesson.codeBlocks.map(({ code }) => code).join('\n')).join('\n');
  assert.doesNotMatch(code, /runBlockingTest|Thread\.sleep|delay\(\s*\d+\s*\)/);
});

test('runnable fixtures cover each stream and concurrency decision', () => {
  const blocks = preview.concepts.filter(({ id }) => conceptIds.includes(id))
    .flatMap(({ lesson }) => lesson.codeBlocks);
  const fixtureIds = new Set(blocks.map(({ verificationAttributes }) => verificationAttributes.id));

  for (const id of [
    'streams-cold-collection',
    'streams-state-flow',
    'streams-shared-flow',
    'streams-backpressure',
    'streams-channel-workers',
    'streams-mutex-invariant',
    'streams-run-test'
  ]) assert.ok(fixtureIds.has(id), 'missing runnable fixture ' + id);

  assert.ok(blocks.every(({ verification }) => verification === 'run'));
});
