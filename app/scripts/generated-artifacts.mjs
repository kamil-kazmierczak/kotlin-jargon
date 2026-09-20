export function renderGeneratedArtifacts(data) {
  const baseUrl = 'https://kamil-kazmierczak.github.io/kotlin-jargon';
  const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
  const searchIndex = data.concepts.map((concept) => ({
    id: concept.id,
    title: concept.title,
    aliases: concept.aliases,
    categoryId: concept.curriculum.categoryId,
    text: [
      concept.lesson.overview,
      concept.lesson.javaDeveloperRelevance,
      concept.lesson.semantics,
      concept.lesson.connections
    ].join('\n')
  }));
  const fullText = data.concepts.map((concept) => `## ${concept.title}

- Permanent ID: ${concept.id}
- Category: ${data.categories[concept.curriculum.categoryId].name}
- Depth: ${concept.curriculum.depth}
- Verified: ${concept.provenance.verifiedAt}

### Overview

${concept.lesson.overview}

### For Java developers

${concept.lesson.javaDeveloperRelevance}

### Semantics

${concept.lesson.semantics}

### Example

${concept.lesson.example}

### Sources

${concept.provenance.sources.map((source) => `- [${source.title}](${source.url})`).join('\n')}
`).join('\n---\n\n');
  const index = data.concepts.map((concept) =>
    `- [${concept.title}](${baseUrl}/#${concept.id}): ${concept.lesson.overview.replace(/\s+/g, ' ')}`
  ).join('\n');

  return new Map([
    ['src/data/content.json', json(data)],
    ['public/data/content.json', json(data)],
    ['public/data/graph.json', json(data.graph)],
    ['public/data/search-index.json', json(searchIndex)],
    ['public/llms-full.txt', `# Kotlin Concepts — Full Reference

> Generated from the canonical concept Markdown and curriculum manifest.

${fullText}`],
    ['public/llms.txt', `# Kotlin Concepts

> Kotlin/JVM concepts for experienced Java developers.

## Concepts

${index}

## Data

- [Generated content data](${baseUrl}/data/content.json)
- [Generated graph data](${baseUrl}/data/graph.json)
- [Generated search index](${baseUrl}/data/search-index.json)
- [Full text reference](${baseUrl}/llms-full.txt)
`]
  ]);
}
