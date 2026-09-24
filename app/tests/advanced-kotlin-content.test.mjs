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
const pathIds = [
  'custom-contracts', 'runtime-reflection', 'annotation-processing-boundaries',
  'type-safe-dsls', 'context-parameters'
];
const referenceIds = ['explicit-backing-fields'];

test('advanced group is connected and assessable in preview pending human review', () => {
  const group = preview.studyPaths.find(({ id }) => id === 'kotlin-advanced-boundaries');
  assert.deepEqual(group.conceptIds, pathIds);
  assert.equal(group.scenario.stages.length, 5);
  assert.ok(group.scenario.debrief.rubric.length >= 5);
  assert.equal(production.studyPaths.some(({ id }) => id === group.id), false);

  const concepts = new Map(preview.concepts.map((concept) => [concept.id, concept]));
  for (const id of [...pathIds, ...referenceIds]) {
    const concept = concepts.get(id);
    assert.equal(concept.publication.status, 'review-ready');
    assert.equal(concept.profile, 'substantial');
    assert.equal(concept.curriculum.categoryId, 'advanced-kotlin');
    assert.notEqual(concept.curriculum.depth, 'core');
    assert.ok(concept.lesson.knowledgeCheck);
    assert.ok(concept.interview.question);
    assert.ok(concept.lesson.codeBlocks.some(({ verification }) => verification === 'run'));
    assert.ok(concept.provenance.sources.some(({ url }) => new URL(url).hostname === 'kotlinlang.org'));
    assert.equal(production.concepts.some((published) => published.id === id), false);
  }
  assert.deepEqual(concepts.get(referenceIds[0]).curriculum.studyPaths, []);
  assert.ok(pathIds.every((id) => concepts.get(id).curriculum.studyPaths.length === 1));
});

test('experimental and versioned claims remain explicit in authored lessons', () => {
  const authored = sources.conceptSources
    .filter(({ source }) => [...pathIds, ...referenceIds].some((id) => source.includes(`id: ${id}\n`)))
    .map(({ source }) => source).join('\n');
  for (const term of ['ExperimentalContracts', 'kotlin-reflect', '@DslMarker',
    'Kotlin 2.4', 'explicit context arguments', 'JDK', 'specification', 'compiler']) {
    assert.match(authored, new RegExp(term, 'i'));
  }
});
