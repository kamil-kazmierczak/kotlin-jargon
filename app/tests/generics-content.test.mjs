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
  'generic-constraints',
  'declaration-site-variance',
  'type-projections',
  'generic-runtime-types'
];

test('the generics group uses API-design decisions and remains human-review gated', () => {
  const group = preview.studyPaths.find(({ id }) => id === 'kotlin-generics-abstraction');

  assert.equal(group.name, 'Kotlin generics and abstraction');
  assert.deepEqual(group.conceptIds, expectedConceptIds);
  assert.equal(group.scenario.stages.length, 4);
  assert.match(group.scenario.title, /type-safe variant API/i);

  const concepts = new Map(preview.concepts.map((concept) => [concept.id, concept]));
  for (const id of expectedConceptIds) {
    const concept = concepts.get(id);
    assert.equal(concept.profile, 'substantial');
    assert.equal(concept.publication.status, 'review-ready');
    assert.equal(concept.curriculum.categoryId, 'generics-abstraction');
    assert.ok(concept.lesson.decisionGuidance);
    assert.ok(concept.lesson.knowledgeCheck);
    assert.ok(concept.interview.question);
  }
});

test('lessons separate substitutability, projected capabilities, and runtime availability', () => {
  const authoredText = expectedConceptIds
    .map((id) => sources.conceptSources.find(({ source }) => source.includes(`id: ${id}\n`)).source)
    .join('\n');

  for (const claim of [
    'invariant',
    'upper bound',
    'declaration-site variance',
    'producer',
    'consumer',
    'use-site projection',
    'star projection',
    'compile-time',
    'type erasure',
    'unchecked cast',
    'reified',
    'Java wildcard'
  ]) assert.match(authoredText, new RegExp(claim, 'i'));

  assert.deepEqual(
    preview.concepts.find(({ id }) => id === 'generic-constraints').relationships.prerequisites,
    ['functions', 'collection-interfaces', 'any']
  );
  assert.ok(preview.concepts.find(({ id }) => id === 'generic-runtime-types').relationships.related.includes('platform-types'));
});

test('checked examples cover constraints, producers and consumers, projections, stars, erasure, and a complete variant design', () => {
  const blocks = preview.concepts
    .filter(({ id }) => expectedConceptIds.includes(id))
    .flatMap(({ lesson }) => lesson.codeBlocks);
  const ids = new Set(blocks.map(({ verificationAttributes }) => verificationAttributes.id).filter(Boolean));

  for (const id of [
    'generics-bounded-selection',
    'generics-variant-producer-consumer',
    'generics-projected-copy',
    'generics-projection-restrictions',
    'generics-star-projection',
    'generics-erased-check',
    'generics-reified-alternative',
    'generics-variant-api'
  ]) assert.ok(ids.has(id), `missing checked example ${id}`);

  assert.ok(blocks.filter(({ verification }) => verification === 'run').every(({ verificationAttributes }) => verificationAttributes.expected));
  assert.ok(blocks.some(({ verification }) => verification === 'compile-fails'));
});
