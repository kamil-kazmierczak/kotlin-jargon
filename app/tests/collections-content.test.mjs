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

const expectedConceptIds = [
  'collection-interfaces',
  'collection-transformations',
  'grouping-aggregation',
  'sequences'
];

test('the collections group uses semantic decision nodes and awaits human verification', () => {
  const group = preview.studyPaths.find(({ id }) => id === 'kotlin-collections-sequences');

  assert.equal(group.name, 'Kotlin collections and sequences');
  assert.deepEqual(group.conceptIds, expectedConceptIds);
  assert.equal(group.scenario.stages.length, 4);
  assert.match(group.scenario.title, /pipeline/i);

  const concepts = new Map(preview.concepts.map((concept) => [concept.id, concept]));
  for (const id of expectedConceptIds) {
    const concept = concepts.get(id);
    assert.equal(concept.profile, 'substantial');
    assert.equal(concept.publication.status, 'review-ready');
    assert.equal(concept.curriculum.categoryId, 'collections');
    assert.ok(concept.lesson.decisionGuidance);
    assert.ok(concept.lesson.knowledgeCheck);
    assert.ok(concept.interview.question);
  }
});

test('lessons distinguish capabilities, ownership, evaluation, and cost', () => {
  const authoredText = expectedConceptIds
    .map((id) => sources.conceptSources.find(({ source }) => source.includes(`id: ${id}\n`)).source)
    .join('\n');

  for (const claim of [
    'read-only',
    'deep immutability',
    'alias',
    'terminal operation',
    'eager',
    'lazy',
    'groupBy',
    'groupingBy',
    'intermediate collection',
    'not automatically faster'
  ]) assert.match(authoredText, new RegExp(claim, 'i'));

  assert.deepEqual(
    preview.concepts.find(({ id }) => id === 'collection-interfaces').relationships.prerequisites,
    ['immutability']
  );
  assert.ok(preview.concepts.find(({ id }) => id === 'sequences').relationships.prerequisites.includes('collection-transformations'));
});

test('verified examples cover aliasing, traversal, grouping, laziness, and the complete design', () => {
  const blocks = preview.concepts
    .filter(({ id }) => expectedConceptIds.includes(id))
    .flatMap(({ lesson }) => lesson.codeBlocks);
  const ids = new Set(blocks.map(({ verificationAttributes }) => verificationAttributes.id).filter(Boolean));

  for (const id of [
    'collections-read-only-alias',
    'collections-transform-traversal',
    'collections-grouping',
    'collections-sequence-order',
    'collections-terminal-reuse',
    'collections-report-pipeline'
  ]) assert.ok(ids.has(id), `missing verified example ${id}`);

  assert.ok(blocks.filter(({ verification }) => verification === 'run').every(({ verificationAttributes }) => verificationAttributes.expected));
});
