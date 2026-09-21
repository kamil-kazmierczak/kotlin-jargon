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
  'nullable-types',
  'smart-casts',
  'any',
  'unit',
  'nothing',
  'platform-types',
  'not-null-assertion'
];

test('the complete type-system group is reviewable without duplicating existing concept identities', () => {
  const group = preview.studyPaths.find(({ id }) => id === 'java-developer-foundations');

  assert.equal(group.name, 'Kotlin type system and null safety');
  assert.deepEqual(group.conceptIds, expectedConceptIds);
  assert.equal(group.scenario.stages.length, 4);
  assert.match(group.scenario.title, /boundary/i);
  assert.equal(preview.concepts.filter(({ id }) => id === 'platform-types').length, 1);

  const concepts = new Map(preview.concepts.map((concept) => [concept.id, concept]));
  for (const id of ['smart-casts', 'any', 'unit', 'nothing']) {
    const concept = concepts.get(id);
    assert.equal(concept.profile, 'substantial');
    assert.equal(concept.publication.status, 'review-ready');
    assert.ok(concept.lesson.decisionGuidance);
    assert.ok(concept.lesson.knowledgeCheck);
    assert.ok(concept.interview.question);
    assert.ok(concept.interview.essentialPoints);
    assert.ok(concept.interview.tradeOffs);
    assert.ok(concept.interview.commonTraps);
    assert.ok(concept.interview.followUpProbes);
  }
});

test('relationships separate language prerequisites from Java-boundary associations', () => {
  const concepts = new Map(preview.concepts.map((concept) => [concept.id, concept]));

  assert.deepEqual(concepts.get('smart-casts').relationships.prerequisites, ['nullable-types']);
  assert.deepEqual(concepts.get('unit').relationships.prerequisites, ['functions']);
  assert.deepEqual(concepts.get('nothing').relationships.prerequisites, ['expressions-control-flow']);
  assert.equal(concepts.get('platform-types').curriculum.categoryId, 'java-interoperability');
  assert.ok(concepts.get('smart-casts').relationships.related.includes('platform-types'));
  assert.ok(concepts.get('not-null-assertion').relationships.related.includes('platform-types'));
});

test('Kotlin 2.4 changes and the required safe and unsafe behaviors are explicitly covered', () => {
  const authoredText = sources.conceptSources.map(({ source }) => source).join('\n');
  for (const claim of [
    'Kotlin 2.4',
    'flexible explicit nullable type arguments',
    'Jakarta nullability annotations',
    'non-abstract Java sealed class',
    'annotation use-site targets'
  ]) assert.match(authoredText, new RegExp(claim, 'i'));

  const blocks = preview.concepts.flatMap(({ lesson }) => lesson.codeBlocks);
  const ids = new Set(blocks.map(({ verificationAttributes }) => verificationAttributes.id).filter(Boolean));
  for (const id of [
    'smart-cast-stable',
    'smart-cast-mutable-property',
    'type-top-any',
    'type-unit-value',
    'type-nothing-flow',
    'nullable-unsafe-runtime',
    'type-system-boundary'
  ]) assert.ok(ids.has(id), `missing verified example ${id}`);

  const boundaryBlocks = blocks.filter(({ verificationAttributes }) => verificationAttributes.id === 'type-system-boundary');
  assert.deepEqual(new Set(boundaryBlocks.map(({ language }) => language)), new Set(['java', 'kotlin']));
  assert.ok(boundaryBlocks.every(({ verification }) => verification === 'run'));
});
