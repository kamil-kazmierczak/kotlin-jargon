import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ContentValidationError,
  buildContentModel,
  parseConceptSource
} from '../scripts/content-pipeline.mjs';

const manifest = {
  schemaVersion: 1,
  baseline: {
    id: 'kotlin-jvm-2026-09',
    kotlinCompiler: '2.4.20',
    languageVersion: '2.4',
    apiVersion: '2.4',
    jdk: 'Eclipse Temurin 25.0.1+8-LTS',
    jvmTarget: '21',
    gradle: '9.7.0',
    coroutines: '1.11.0'
  },
  categories: [
    {
      id: 'type-system',
      name: 'Type system',
      description: 'Kotlin types and null safety.',
      color: '#7c3aed',
      symbol: '?'
    }
  ],
  studyPaths: [
    {
      id: 'java-developer-foundations',
      name: 'Java developer foundations',
      conceptIds: ['nullable-types']
    }
  ]
};

const compactConcept = `---
id: nullable-types
title: Nullable types
profile: compact
category: type-system
depth: core
publicationStatus: verified
publishedAt: 2026-09-19
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-19
prerequisiteIds: []
relatedIds: []
aliases: [null safety, nullable]
---

## Overview

A nullable type makes the possibility of no value explicit.

## Why it matters to Java developers

Kotlin moves many null checks into the type system.

## Semantics

\`String\` and \`String?\` are different types.

## Example

\`\`\`kotlin fragment
val nickname: String? = null
\`\`\`

## Connections

This concept is the foundation for safe Java boundaries.

## Sources

- [Kotlin null safety](https://kotlinlang.org/docs/null-safety.html)
`;

const interviewPractice = `
## Interview question

How would you handle an unannotated Java return type in Kotlin?

## Essential points

- Kotlin treats it as a platform type.

## Trade-offs

- A nullable type is safer but needs explicit handling.

## Common traps

- Treating \`String!\` as Kotlin syntax.

## Follow-up probes

- What changes when the Java API adds nullability annotations?
`;

const stagedScenario = {
  title: 'Review a Java boundary',
  context: 'A Kotlin service consumes an unannotated Java API.',
  stages: [
    { id: 'predict', kind: 'Prediction', prompt: 'What happens?', feedback: 'It is a platform type.', nextConstraint: 'Null is valid.' },
    { id: 'design', kind: 'Design choice', prompt: 'What policy?', feedback: 'Model null explicitly.', nextConstraint: 'Explain the trade-off.' }
  ],
  debrief: {
    connections: 'Boundary uncertainty becomes an explicit nullable type.',
    tradeOffs: 'Safety requires deliberate handling.',
    rubric: ['Names the platform type.', 'Explains the nullable policy.']
  }
};

test('parses structured Markdown into metadata and named lesson sections', () => {
  const concept = parseConceptSource('nullable-types.md', compactConcept);

  assert.equal(concept.metadata.id, 'nullable-types');
  assert.deepEqual(concept.metadata.aliases, ['null safety', 'nullable']);
  assert.match(concept.sections.overview, /possibility of no value/);
  assert.match(concept.sections.javaDeveloperRelevance, /type system/);
  assert.deepEqual(concept.sources, [{
    title: 'Kotlin null safety',
    url: 'https://kotlinlang.org/docs/null-safety.html'
  }]);
  assert.equal(concept.codeBlocks[0].verification, 'fragment');
});

test('preserves a validated staged scenario on its curriculum group', () => {
  const scenarioManifest = structuredClone(manifest);
  scenarioManifest.studyPaths[0].scenario = stagedScenario;

  const model = buildContentModel({
    manifest: scenarioManifest,
    conceptSources: [{ filePath: 'nullable-types.md', source: compactConcept }]
  });

  assert.deepEqual(model.studyPaths[0].scenario, stagedScenario);
});

test('rejects a scenario that could expose a stage without focused feedback', () => {
  const scenarioManifest = structuredClone(manifest);
  scenarioManifest.studyPaths[0].scenario = structuredClone(stagedScenario);
  delete scenarioManifest.studyPaths[0].scenario.stages[1].feedback;

  assert.throws(
    () => buildContentModel({
      manifest: scenarioManifest,
      conceptSources: [{ filePath: 'nullable-types.md', source: compactConcept }]
    }),
    (error) => error instanceof ContentValidationError && error.message.includes('stage 2.feedback is required')
  );
});

test('preserves explicit example verification metadata and rejects unclassified code', () => {
  const verified = parseConceptSource('verified.md', compactConcept.replace(
    '```kotlin fragment',
    '```kotlin run id=hello file=Hello.kt main=HelloKt expected=hello'
  ));
  assert.deepEqual(verified.codeBlocks[0].verificationAttributes, {
    id: 'hello', file: 'Hello.kt', main: 'HelloKt', expected: 'hello'
  });

  assert.throws(
    () => buildContentModel({
      manifest,
      conceptSources: [{ filePath: 'unclassified.md', source: compactConcept.replace('```kotlin fragment', '```kotlin') }]
    }),
    (error) => error instanceof ContentValidationError && error.message.includes('verification modes')
  );
});

test('rejects malformed front matter with a clear file-specific failure', () => {
  assert.throws(
    () => parseConceptSource('broken.md', '---\nid nullable-types\n---\n'),
    (error) => error instanceof ContentValidationError &&
      error.message.includes('broken.md') &&
      error.message.includes('front matter line 1')
  );
});

test('rejects unterminated scalar values and invalid publication dates', () => {
  assert.throws(
    () => parseConceptSource('quoted.md', compactConcept.replace('title: Nullable types', 'title: "Nullable types')),
    (error) => error instanceof ContentValidationError &&
      error.message.includes('quoted.md') &&
      error.message.includes('unterminated value')
  );

  assert.throws(
    () => buildContentModel({
      manifest,
      conceptSources: [{
        filePath: 'dated.md',
        source: compactConcept.replace('verifiedAt: 2026-09-19', 'verifiedAt: someday')
      }]
    }),
    (error) => error instanceof ContentValidationError &&
      error.message.includes('verifiedAt must be an ISO date')
  );
});

test('rejects compact concepts missing required sections', () => {
  const withoutSemantics = compactConcept.replace(/## Semantics[\s\S]*?(?=## Example)/, '');

  assert.throws(
    () => buildContentModel({
      manifest,
      conceptSources: [{ filePath: 'nullable-types.md', source: withoutSemantics }]
    }),
    (error) => error instanceof ContentValidationError &&
      error.message.includes('missing required compact section "Semantics"')
  );
});

test('rejects concepts assigned to unknown manifest categories', () => {
  const unknownCategory = compactConcept.replace('category: type-system', 'category: mystery');

  assert.throws(
    () => buildContentModel({
      manifest,
      conceptSources: [{ filePath: 'nullable-types.md', source: unknownCategory }]
    }),
    (error) => error instanceof ContentValidationError &&
      error.message.includes('unknown category "mystery"')
  );
});

test('rejects duplicate permanent concept IDs', () => {
  assert.throws(
    () => buildContentModel({
      manifest,
      conceptSources: [
        { filePath: 'one.md', source: compactConcept },
        { filePath: 'two.md', source: compactConcept }
      ]
    }),
    (error) => error instanceof ContentValidationError &&
      error.message.includes('duplicate concept ID "nullable-types"')
  );
});

test('generates distinct identity, curriculum, lesson, relationship, and provenance fields', () => {
  const data = buildContentModel({
    manifest,
    conceptSources: [{ filePath: 'nullable-types.md', source: compactConcept }]
  });
  const concept = data.concepts[0];

  assert.equal(data.meta.title, 'Kotlin Concepts');
  assert.equal(concept.id, 'nullable-types');
  assert.deepEqual(concept.curriculum, {
    categoryId: 'type-system',
    depth: 'core',
    studyPaths: [{ id: 'java-developer-foundations', position: 1 }]
  });
  assert.deepEqual(concept.relationships, {
    prerequisites: [],
    related: []
  });
  assert.match(concept.lesson.overview, /possibility of no value/);
  assert.equal(concept.provenance.baselineId, 'kotlin-jvm-2026-09');
  assert.equal(concept.provenance.verifiedAt, '2026-09-19');
  assert.deepEqual(data.graph.links, []);
  assert.equal(data.graph.nodes[0].depth, 'core');
});

test('generates an authored interview rubric without flattening it into a model answer', () => {
  const data = buildContentModel({
    manifest,
    conceptSources: [{ filePath: 'nullable-types.md', source: `${compactConcept}\n${interviewPractice}` }]
  });

  assert.deepEqual(data.concepts[0].interview, {
    question: 'How would you handle an unannotated Java return type in Kotlin?',
    essentialPoints: '- Kotlin treats it as a platform type.',
    tradeOffs: '- A nullable type is safer but needs explicit handling.',
    commonTraps: '- Treating `String!` as Kotlin syntax.',
    followUpProbes: '- What changes when the Java API adds nullability annotations?'
  });
});

test('generation is deterministic regardless of source discovery order', () => {
  const secondConcept = compactConcept
    .replaceAll('nullable-types', 'safe-calls')
    .replace('title: Nullable types', 'title: Safe calls');
  const twoConceptManifest = {
    ...manifest,
    studyPaths: [{
      ...manifest.studyPaths[0],
      conceptIds: ['nullable-types', 'safe-calls']
    }]
  };
  const sources = [
    { filePath: 'nullable-types.md', source: compactConcept },
    { filePath: 'safe-calls.md', source: secondConcept }
  ];

  assert.equal(
    JSON.stringify(buildContentModel({ manifest: twoConceptManifest, conceptSources: sources })),
    JSON.stringify(buildContentModel({ manifest: twoConceptManifest, conceptSources: sources.toReversed() }))
  );
});
