import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildContentModel, readContentSources } from '../scripts/content-pipeline.mjs';
import { renderGeneratedArtifacts } from '../scripts/generated-artifacts.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const sources = readContentSources({ manifestPath: `${root}content/curriculum.json`, conceptsDirectory: `${root}content/concepts` });
const model = buildContentModel(sources);

test('the production release publishes all ten curriculum groups and every authored concept', () => {
  assert.deepEqual(Object.keys(model.categories).sort(), [
    'execution-semantics', 'type-system', 'domain-modeling', 'collections', 'functions-idioms',
    'generics-abstraction', 'java-interoperability', 'coroutines', 'streams-concurrency', 'advanced-kotlin'
  ].sort());
  assert.equal(model.concepts.length, sources.conceptSources.length, 'No authored lesson silently disappears behind publication filtering');
  assert.equal(model.studyPaths.length, 10);
  for (const group of model.studyPaths) {
    assert.ok(group.conceptIds.length > 0 && group.scenario, `${group.id} has lessons and its complete scenario`);
  }
  for (const concept of model.concepts) {
    assert.equal(concept.publication.status, 'verified');
    assert.equal(concept.provenance.baselineId, sources.manifest.baseline.id);
    assert.ok(concept.provenance.humanReview && concept.provenance.sources.length);
    assert.ok(model.graph.nodes.some(({ id }) => id === concept.id));
  }
});

test('all generated representations match canonical content and remain untracked', () => {
  const generated = renderGeneratedArtifacts(model);
  const reversed = renderGeneratedArtifacts(buildContentModel({ ...sources, conceptSources: sources.conceptSources.toReversed() }));
  const tracked = new Set(execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).trim().split('\n'));
  for (const [name, contents] of generated) {
    assert.equal(reversed.get(name), contents, name);
    assert.equal(tracked.has(`app/${name}`), false, `${name} must not become another canonical source`);
    assert.doesNotMatch(contents, /FP Jargon|Functional Programming Jargon|hemanth\.github\.io/);
  }
});

test('public identity and release dependencies contain no legacy catalogue or celebration package', () => {
  for (const name of ['readme.md', 'contributing.md', 'app/index.html', 'app/public/robots.txt', 'package.json', 'app/package.json']) {
    assert.doesNotMatch(fs.readFileSync(`${root}${name}`, 'utf8'), /Functional Programming Jargon|FP Jargon|hemanth\.github\.io|canvas-confetti/);
  }
  assert.equal(JSON.parse(fs.readFileSync(`${root}app/package.json`)).dependencies['canvas-confetti'], undefined);
});
