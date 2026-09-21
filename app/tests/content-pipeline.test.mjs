import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ContentValidationError,
  buildContentModel,
  parseConceptSource
} from '../scripts/content-pipeline.mjs';
import { renderGeneratedArtifacts } from '../scripts/generated-artifacts.mjs';

const manifest = {
  schemaVersion: 2,
  baseline: {
    id: 'kotlin-jvm-2026-09',
    kotlinCompiler: '2.4.20',
    languageVersion: '2.4',
    apiVersion: '2.4',
    jdk: 'Eclipse Temurin 25.0.1+8-LTS',
    jvmTarget: '21',
    gradle: '9.7.0',
    coroutines: '1.11.0',
    previousId: null,
    adoptedAt: '2026-09-19',
    upgradeRationale: 'Establish the first reproducible teaching baseline.',
    sourceUrl: 'https://kotlinlang.org/docs/releases.html'
  },
  officialSourceHosts: ['kotlinlang.org'],
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
publicationHistory: [draft, review-ready, verified]
publishedAt: 2026-09-19
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-19
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-19
reviewReference: commit:5031ac8
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
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

function draftConcept({ id = 'safe-calls', title = 'Safe calls' } = {}) {
  return compactConcept
    .replaceAll('nullable-types', id)
    .replace('title: Nullable types', `title: ${title}`)
    .replace('publicationStatus: verified', 'publicationStatus: draft')
    .replace('publicationHistory: [draft, review-ready, verified]', 'publicationHistory: [draft]')
    .replace('publishedAt: 2026-09-19\n', '')
    .replace('verifiedAt: 2026-09-19\n', '')
    .replace(/reviewerKind: human\nreviewedBy: kamil-kazmierczak\nreviewedAt: 2026-09-19\nreviewReference: commit:5031ac8\nreviewPedagogicalClarity: true\nreviewAuthoritativeSupport: true\nreviewInterviewRealism: true\nreviewGuaranteeWording: true\n/, '');
}

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

test('rejects invalid publication values and transition histories', () => {
  for (const [replacement, expected] of [
    ['publicationStatus: published', 'unknown publication status "published"'],
    ['publicationHistory: [draft, verified]', 'invalid publication transition "draft" to "verified"'],
    ['publicationHistory: [draft, review-ready]', 'publication history must end at status "verified"'],
    ['publicationHistory: [verified]', 'publication history must start at status "draft"']
  ]) {
    const source = replacement.startsWith('publicationStatus')
      ? compactConcept.replace('publicationStatus: verified', replacement)
      : compactConcept.replace('publicationHistory: [draft, review-ready, verified]', replacement);

    assert.throws(
      () => buildContentModel({ manifest, conceptSources: [{ filePath: 'invalid.md', source }] }),
      (error) => error instanceof ContentValidationError && error.message.includes(expected)
    );
  }
});

test('requires official correctness provenance and human publication confirmation for verified concepts', () => {
  const cases = [
    [compactConcept.replace('https://kotlinlang.org/docs/null-safety.html', 'https://example.com/null-safety'), 'official correctness source'],
    [compactConcept.replace('reviewerKind: human', 'reviewerKind: ai'), 'reviewerKind must be "human"'],
    [compactConcept.replace('reviewPedagogicalClarity: true', 'reviewPedagogicalClarity: false'), 'reviewPedagogicalClarity must be true']
  ];

  for (const [source, expected] of cases) {
    assert.throws(
      () => buildContentModel({ manifest, conceptSources: [{ filePath: 'unverified.md', source }] }),
      (error) => error instanceof ContentValidationError && error.message.includes(expected)
    );
  }
});

test('production excludes drafts from concepts, graph relationships, and study paths while preview remains explicit', () => {
  const draft = draftConcept();
  const verified = compactConcept.replace('relatedIds: []', 'relatedIds: [safe-calls]');
  const mixedManifest = {
    ...manifest,
    studyPaths: [{ ...manifest.studyPaths[0], conceptIds: ['nullable-types', 'safe-calls'] }]
  };
  const input = {
    manifest: mixedManifest,
    conceptSources: [
      { filePath: 'nullable-types.md', source: verified },
      { filePath: 'safe-calls.md', source: draft }
    ]
  };

  const production = buildContentModel(input);
  assert.deepEqual(production.concepts.map(({ id }) => id), ['nullable-types']);
  assert.deepEqual(production.concepts[0].relationships.related, []);
  assert.deepEqual(production.studyPaths[0].conceptIds, ['nullable-types']);
  assert.deepEqual(production.graph.nodes.map(({ id }) => id), ['nullable-types']);
  assert.deepEqual(production.graph.links, []);

  const preview = buildContentModel(input, { publicationMode: 'preview' });
  assert.deepEqual(preview.concepts.map(({ id }) => id), ['nullable-types', 'safe-calls']);
  assert.equal(preview.meta.publicationMode, 'preview');
});

test('rejects verified concepts omitted from every study path', () => {
  const noPathManifest = {
    ...manifest,
    studyPaths: [{ ...manifest.studyPaths[0], conceptIds: [] }]
  };

  assert.throws(
    () => buildContentModel({
      manifest: noPathManifest,
      conceptSources: [{ filePath: 'nullable-types.md', source: compactConcept }]
    }),
    (error) => error instanceof ContentValidationError && error.message.includes('verified concept "nullable-types" is missing from every study path')
  );
});

test('allows an explicitly justified reference concept outside the study path', () => {
  const source = compactConcept.replace('depth: core', 'depth: reference\npathExclusionReason: Searchable syntax reminder for experienced Java developers.');
  const input = {
    manifest: { ...manifest, studyPaths: [{ ...manifest.studyPaths[0], conceptIds: [] }] },
    conceptSources: [{ filePath: 'nullable-types.md', source }]
  };
  assert.deepEqual(buildContentModel(input).concepts[0].curriculum.studyPaths, []);
  assert.throws(() => buildContentModel({ ...input, conceptSources: [{ filePath: 'nullable-types.md', source: source.replace('Searchable syntax reminder for experienced Java developers.', '" "') }] }), /missing from every study path/);
});

test('validates substantial lessons and preserves their sections in generated representations', () => {
  const extraSections = '\n## Mental model\n\nTrack the contract.\n\n## Common mistakes\n\nDo not guess.\n\n## Decision guidance\n\nChoose an explicit policy.\n\n## Knowledge check\n\nPredict then explain.\n';
  const source = compactConcept.replace('profile: compact', 'profile: substantial') + extraSections + interviewPractice;
  const build = (source) => buildContentModel({ manifest, conceptSources: [{ filePath: 'nullable-types.md', source }] });
  const model = build(source);
  assert.equal(model.concepts[0].lesson.mentalModel, 'Track the contract.');
  assert.equal(model.concepts[0].lesson.knowledgeCheck, 'Predict then explain.');
  const artifacts = renderGeneratedArtifacts(model);
  assert.match(artifacts.get('public/llms-full.txt'), /Track the contract/);
  assert.match(artifacts.get('public/data/search-index.json'), /Choose an explicit policy/);
  assert.throws(() => build(source.replace('## Mental model\n\nTrack the contract.', '')), /missing required substantial section "Mental model"/);
  assert.throws(() => build(source.replace(interviewPractice, '')), /missing required substantial section "Interview question"/);
});

test('keeps unpublished groups and incomplete group scenarios out of production', () => {
  const input = {
    manifest: { ...manifest, studyPaths: [
      { ...manifest.studyPaths[0], conceptIds: ['nullable-types', 'safe-calls'], scenario: stagedScenario },
      { id: 'pending-group', name: 'Pending group', conceptIds: ['safe-calls'], scenario: stagedScenario }
    ] },
    conceptSources: [{ filePath: 'nullable-types.md', source: compactConcept }, { filePath: 'safe-calls.md', source: draftConcept() }]
  };
  const production = buildContentModel(input);
  assert.equal(production.studyPaths.length, 1);
  assert.equal(production.studyPaths[0].scenario, undefined);
  const preview = buildContentModel(input, { publicationMode: 'preview' });
  assert.deepEqual(preview.studyPaths[1].scenario, stagedScenario);
});

test('rejects production lesson links that resolve only in preview mode', () => {
  const draft = draftConcept();
  const verified = compactConcept.replace(
    'This concept is the foundation for safe Java boundaries.',
    'Continue with [safe calls](#safe-calls).'
  );
  const mixedManifest = {
    ...manifest,
    studyPaths: [{ ...manifest.studyPaths[0], conceptIds: ['nullable-types', 'safe-calls'] }]
  };

  assert.throws(
    () => buildContentModel({
      manifest: mixedManifest,
      conceptSources: [
        { filePath: 'nullable-types.md', source: verified },
        { filePath: 'safe-calls.md', source: draft }
      ]
    }),
    (error) => error instanceof ContentValidationError && error.message.includes('verified concept links to unverified concept "safe-calls"')
  );
});

test('rejects malformed internal concept anchors instead of ignoring them', () => {
  for (const target of ['Missing_concept', '']) {
    const malformedLink = compactConcept.replace(
      'This concept is the foundation for safe Java boundaries.',
      `Continue with [missing concept](#${target}).`
    );

    assert.throws(
      () => buildContentModel({
        manifest,
        conceptSources: [{ filePath: 'nullable-types.md', source: malformedLink }]
      }),
      (error) => error instanceof ContentValidationError && error.message.includes(`internal link target "#${target}"`)
    );
  }
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

test('renders byte-stable application, graph, search, and LLM representations', () => {
  const model = buildContentModel({
    manifest,
    conceptSources: [{ filePath: 'nullable-types.md', source: compactConcept }]
  });
  const first = renderGeneratedArtifacts(model);
  const second = renderGeneratedArtifacts(structuredClone(model));

  assert.deepEqual([...first.keys()], [
    'src/data/content.json',
    'public/data/content.json',
    'public/data/graph.json',
    'public/data/search-index.json',
    'public/llms-full.txt',
    'public/llms.txt'
  ]);
  assert.deepEqual([...first], [...second]);
  assert.deepEqual(JSON.parse(first.get('public/data/search-index.json')).map(({ id }) => id), ['nullable-types']);
});
