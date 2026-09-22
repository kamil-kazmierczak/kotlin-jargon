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
  'lambdas-higher-order-functions',
  'extensions-receivers',
  'scope-functions',
  'inline-reified-functions'
];

test('the functions and idioms group uses semantic decision nodes and awaits human verification', () => {
  const group = preview.studyPaths.find(({ id }) => id === 'kotlin-functions-idioms');

  assert.equal(group.name, 'Kotlin functions and idioms');
  assert.deepEqual(group.conceptIds, expectedConceptIds);
  assert.equal(group.scenario.stages.length, 4);
  assert.match(group.scenario.title, /readable higher-order API/i);

  const concepts = new Map(preview.concepts.map((concept) => [concept.id, concept]));
  for (const id of expectedConceptIds) {
    const concept = concepts.get(id);
    assert.equal(concept.profile, 'substantial');
    assert.equal(concept.publication.status, 'review-ready');
    assert.equal(concept.curriculum.categoryId, 'functions-idioms');
    assert.ok(concept.lesson.decisionGuidance);
    assert.ok(concept.lesson.knowledgeCheck);
    assert.ok(concept.interview.question);
  }
});

test('lessons distinguish receiver, result, dispatch, control-flow, and runtime claims', () => {
  const authoredText = expectedConceptIds
    .map((id) => sources.conceptSources.find(({ source }) => source.includes(`id: ${id}\n`)).source)
    .join('\n');

  for (const claim of [
    'higher-order function',
    'functional interface',
    'statically resolved',
    'does not modify',
    'receiver',
    'return value',
    'non-local return',
    'reified',
    'bytecode',
    'not automatically faster',
    'readability'
  ]) assert.match(authoredText, new RegExp(claim, 'i'));

  assert.deepEqual(
    preview.concepts.find(({ id }) => id === 'lambdas-higher-order-functions').relationships.prerequisites,
    ['functions', 'collection-transformations']
  );
  assert.ok(preview.concepts.find(({ id }) => id === 'inline-reified-functions').relationships.prerequisites.includes('lambdas-higher-order-functions'));
});

test('checked examples cover lambda behavior, receiver resolution, scope results, inline control flow, reified access, and the complete design', () => {
  const blocks = preview.concepts
    .filter(({ id }) => expectedConceptIds.includes(id))
    .flatMap(({ lesson }) => lesson.codeBlocks);
  const ids = new Set(blocks.map(({ verificationAttributes }) => verificationAttributes.id).filter(Boolean));

  for (const id of [
    'functions-lambda-behavior',
    'functions-extension-resolution',
    'functions-receiver-resolution',
    'functions-scope-results',
    'functions-inline-control-flow',
    'functions-reified-access',
    'functions-readable-api'
  ]) assert.ok(ids.has(id), `missing checked example ${id}`);

  assert.ok(blocks.filter(({ verification }) => verification === 'run').every(({ verificationAttributes }) => verificationAttributes.expected));
});
