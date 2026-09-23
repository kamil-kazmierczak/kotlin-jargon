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
const published = buildContentModel(sources, { publicationMode: 'production' });
const ids = ['platform-types', 'java-nullability-contracts', 'java-sam-properties',
  'java-callable-surface', 'java-generic-signatures', 'java-annotation-boundaries'];

test('verified interop group connects the existing platform lesson to Java API design', () => {
  const group = preview.studyPaths.find(({ id }) => id === 'kotlin-java-interoperability');
  assert.deepEqual(group.conceptIds, ids);
  assert.equal(group.scenario.stages.length, 5);
  assert.match(group.scenario.title, /Java API/i);
  const concepts = new Map(preview.concepts.map((concept) => [concept.id, concept]));
  assert.equal(concepts.get('platform-types').publication.status, 'verified');
  for (const id of ids.slice(1)) {
    const concept = concepts.get(id);
    assert.equal(concept.curriculum.categoryId, 'java-interoperability');
    assert.equal(concept.publication.status, 'verified');
    assert.equal(concept.profile, 'substantial');
    assert.ok(concept.lesson.knowledgeCheck);
    assert.ok(concept.interview.question);
  }
  const publicGroup = published.studyPaths.find(({ id }) => id === group.id);
  assert.deepEqual(publicGroup.conceptIds, ids);
  assert.equal(publicGroup.scenario.stages.length, 5);
});

test('interop examples exercise both compile orders and runnable Java and Kotlin clients', () => {
  const blocks = preview.concepts.filter(({ id }) => ids.slice(1).includes(id))
    .flatMap(({ lesson }) => lesson.codeBlocks);
  assert.ok(blocks.some(({ language, verification, verificationAttributes }) =>
    language === 'java' && verification === 'run' && verificationAttributes.order === 'java-first'));
  assert.ok(blocks.some(({ language, verification, verificationAttributes }) =>
    language === 'kotlin' && verification === 'run' && verificationAttributes.order === 'java-first'));
  assert.ok(blocks.some(({ language, verification, verificationAttributes }) =>
    language === 'java' && verification === 'run' && verificationAttributes.order !== 'java-first'));
  assert.ok(blocks.some(({ language, verification, verificationAttributes }) =>
    language === 'kotlin' && verification === 'run' && verificationAttributes.order !== 'java-first'));
});
