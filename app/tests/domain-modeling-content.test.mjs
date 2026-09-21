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
  'data-classes',
  'closed-domain-models',
  'objects-and-companions',
  'value-classes',
  'delegation',
  'immutability'
];

test('the domain-modeling group uses semantic decision boundaries and follows the type-system group', () => {
  const group = preview.studyPaths.find(({ id }) => id === 'kotlin-domain-modeling');

  assert.equal(group.name, 'Kotlin domain modeling');
  assert.deepEqual(group.conceptIds, expectedConceptIds);
  assert.equal(group.scenario.stages.length, 4);
  assert.match(group.scenario.title, /order/i);

  const concepts = new Map(preview.concepts.map((concept) => [concept.id, concept]));
  for (const id of expectedConceptIds) {
    const concept = concepts.get(id);
    assert.equal(concept.profile, 'substantial');
    assert.equal(concept.publication.status, 'verified');
    assert.equal(concept.curriculum.categoryId, 'domain-modeling');
    assert.ok(concept.lesson.decisionGuidance);
    assert.ok(concept.lesson.knowledgeCheck);
    assert.ok(concept.interview.question);
  }

  assert.ok(concepts.get('data-classes').relationships.prerequisites.includes('equality'));
  assert.ok(concepts.get('closed-domain-models').relationships.prerequisites.includes('nothing'));
  assert.ok(concepts.get('immutability').relationships.prerequisites.includes('data-classes'));
});

test('lessons cover the requested choices without inventing one node per syntax form', () => {
  const authoredText = expectedConceptIds
    .map((id) => sources.conceptSources.find(({ source }) => source.includes(`id: ${id}\n`)).source)
    .join('\n');

  for (const claim of [
    'data class',
    'sealed',
    'enum',
    'companion object',
    'value class',
    'implementation delegation',
    'read-only',
    'shallow copy',
    'boxing',
    'exhaustive'
  ]) assert.match(authoredText, new RegExp(claim, 'i'));

  assert.equal(expectedConceptIds.length, 6);
  assert.equal(preview.concepts.filter(({ id }) => expectedConceptIds.includes(id)).length, 6);
});

test('representative examples verify generated behavior, invalid assumptions, and Java-facing APIs', () => {
  const blocks = preview.concepts
    .filter(({ id }) => expectedConceptIds.includes(id))
    .flatMap(({ lesson }) => lesson.codeBlocks);
  const ids = new Set(blocks.map(({ verificationAttributes }) => verificationAttributes.id).filter(Boolean));

  for (const id of [
    'domain-data-copy',
    'domain-exhaustive-order',
    'domain-invalid-enum-state',
    'domain-companion-java-api',
    'domain-value-boxing',
    'domain-delegation',
    'domain-read-only-alias',
    'domain-order-model'
  ]) assert.ok(ids.has(id), `missing verified example ${id}`);

  const javaBoundary = blocks.filter(({ verificationAttributes }) => verificationAttributes.id === 'domain-companion-java-api');
  assert.deepEqual(new Set(javaBoundary.map(({ language }) => language)), new Set(['java', 'kotlin']));
  assert.ok(javaBoundary.every(({ verification }) => verification === 'run'));

  const completeModel = blocks.filter(({ verificationAttributes }) => verificationAttributes.id === 'domain-order-model');
  assert.deepEqual(new Set(completeModel.map(({ language }) => language)), new Set(['java', 'kotlin']));
  assert.ok(completeModel.every(({ verification }) => verification === 'run'));

  const invalidAssumption = blocks.find(({ verificationAttributes }) => verificationAttributes.id === 'domain-invalid-enum-state');
  assert.equal(invalidAssumption.verification, 'compile-fails');
});
