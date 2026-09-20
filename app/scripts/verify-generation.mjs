import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildContentModel, ContentValidationError, readContentSources } from './content-pipeline.mjs';
import { renderGeneratedArtifacts } from './generated-artifacts.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = path.resolve(scriptDirectory, '../..');
const contentDirectory = path.join(repositoryDirectory, 'content');
const sources = readContentSources({
  manifestPath: path.join(contentDirectory, 'curriculum.json'),
  conceptsDirectory: path.join(contentDirectory, 'concepts')
});

const forward = renderGeneratedArtifacts(buildContentModel(sources));
const reverse = renderGeneratedArtifacts(buildContentModel({
  ...sources,
  conceptSources: sources.conceptSources.toReversed()
}));

for (const [artifactPath, contents] of forward) {
  if (reverse.get(artifactPath) !== contents) {
    throw new ContentValidationError(`${artifactPath}: generation is not byte-stable when source discovery order changes`);
  }
}

console.log(`Verified ${forward.size} byte-stable generated representations.`);
