import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildContentModel, readContentSources } from '../scripts/content-pipeline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sources = readContentSources({
  manifestPath: path.join(root, 'content/curriculum.json'),
  conceptsDirectory: path.join(root, 'content/concepts')
});
const preview = buildContentModel(sources, { publicationMode: 'preview' });
const production = buildContentModel(sources, { publicationMode: 'production' });
const ids = ['coroutine-suspension', 'coroutine-ownership', 'coroutine-builders',
  'coroutine-context-dispatchers', 'coroutine-cancellation', 'coroutine-failures'];

test('coroutine foundations form a complete verified study path', () => {
  const path = preview.studyPaths.find(({ id }) => id === 'kotlin-coroutine-foundations');
  assert.deepEqual(path.conceptIds, ids);
  assert.equal(path.scenario.stages.length, 5);
  for (const id of ids) {
    const concept = preview.concepts.find((item) => item.id === id);
    assert.equal(concept.publication.status, 'verified');
    assert.equal(concept.curriculum.categoryId, 'coroutines');
    assert.equal(concept.profile, 'substantial');
    assert.ok(concept.lesson.knowledgeCheck);
    assert.ok(concept.interview.question);
  }
  assert.equal(production.studyPaths.some(({ id }) => id === path.id), true);
});

test('runnable examples exercise ownership, context, cancellation, and failure', () => {
  const blocks = preview.concepts.filter(({ id }) => ids.includes(id))
    .flatMap(({ lesson }) => lesson.codeBlocks);
  const fixtureIds = new Set(blocks.map(({ verificationAttributes }) => verificationAttributes.id));
  for (const id of ['coroutines-suspension', 'coroutines-builders', 'coroutines-ownership',
    'coroutines-context', 'coroutines-cancellation', 'coroutines-failures']) {
    assert.ok(fixtureIds.has(id), `missing fixture ${id}`);
  }
  assert.ok(blocks.every(({ verification }) => verification === 'run'));
});
