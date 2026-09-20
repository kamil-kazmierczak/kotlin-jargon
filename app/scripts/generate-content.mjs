import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildContentModel, readContentSources } from './content-pipeline.mjs';
import { renderGeneratedArtifacts } from './generated-artifacts.mjs';
import { verifyHumanReviews } from './human-review.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const appDirectory = path.resolve(scriptDirectory, '..');
const repositoryDirectory = path.resolve(appDirectory, '..');
const contentDirectory = path.join(repositoryDirectory, 'content');

const publicationMode = process.argv.includes('--preview') ? 'preview' : 'production';
const outputDirectory = publicationMode === 'preview'
  ? path.join(appDirectory, '.preview')
  : appDirectory;
const sources = readContentSources({
  manifestPath: path.join(contentDirectory, 'curriculum.json'),
  conceptsDirectory: path.join(contentDirectory, 'concepts')
});
if (publicationMode === 'production') verifyHumanReviews(sources, { repositoryDirectory });
const data = buildContentModel(sources, { publicationMode });

for (const [relativePath, contents] of renderGeneratedArtifacts(data)) {
  const target = path.join(outputDirectory, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents, 'utf8');
}

console.log(`Generated ${data.concepts.length} Kotlin concepts in ${publicationMode} mode from canonical content.`);
