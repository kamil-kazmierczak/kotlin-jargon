import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readContentSources } from './content-pipeline.mjs';
import { verifyHumanReviews } from './human-review.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = path.resolve(scriptDirectory, '../..');
const contentDirectory = path.join(repositoryDirectory, 'content');
const sources = readContentSources({
  manifestPath: path.join(contentDirectory, 'curriculum.json'),
  conceptsDirectory: path.join(contentDirectory, 'concepts')
});

verifyHumanReviews(sources, { repositoryDirectory });
console.log('Verified human review attestations against repository history.');
