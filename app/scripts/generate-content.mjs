import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildContentModel, readContentSources } from './content-pipeline.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const appDirectory = path.resolve(scriptDirectory, '..');
const repositoryDirectory = path.resolve(appDirectory, '..');
const contentDirectory = path.join(repositoryDirectory, 'content');

const data = buildContentModel(readContentSources({
  manifestPath: path.join(contentDirectory, 'curriculum.json'),
  conceptsDirectory: path.join(contentDirectory, 'concepts')
}));

const json = `${JSON.stringify(data, null, 2)}\n`;
const dataTargets = [
  path.join(appDirectory, 'src/data/content.json'),
  path.join(appDirectory, 'public/data/content.json')
];

for (const target of dataTargets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, json, 'utf8');
}

const baseUrl = 'https://kamil-kazmierczak.github.io/kotlin-jargon';
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

fs.writeFileSync(path.join(appDirectory, 'public/llms-full.txt'), `# Kotlin Concepts — Full Reference

> Generated from the canonical concept Markdown and curriculum manifest.

${fullText}`, 'utf8');

const index = data.concepts.map((concept) =>
  `- [${concept.title}](${baseUrl}/#${concept.id}): ${concept.lesson.overview.replace(/\s+/g, ' ')}`
).join('\n');

fs.writeFileSync(path.join(appDirectory, 'public/llms.txt'), `# Kotlin Concepts

> Kotlin/JVM concepts for experienced Java developers.

## Concepts

${index}

## Data

- [Generated content data](${baseUrl}/data/content.json)
- [Full text reference](${baseUrl}/llms-full.txt)
`, 'utf8');

console.log(`Generated ${data.concepts.length} verified Kotlin concept from canonical content.`);
