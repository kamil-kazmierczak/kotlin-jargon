import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ContentValidationError, readContentSources } from '../scripts/content-pipeline.mjs';
import { verifyHumanReviews } from '../scripts/human-review.mjs';

const repositoryDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sources = readContentSources({
  manifestPath: path.join(repositoryDirectory, 'content/curriculum.json'),
  conceptsDirectory: path.join(repositoryDirectory, 'content/concepts')
});

test('accepts attestations recorded in a prior trusted-reviewer commit', () => {
  assert.doesNotThrow(() => verifyHumanReviews(sources, { repositoryDirectory }));
});

test('rejects an older human-authored content commit that contains no review confirmation', () => {
  const forged = structuredClone(sources);
  forged.conceptSources = forged.conceptSources.map((concept) => concept.filePath.endsWith('nullable-types.md')
    ? { ...concept, source: concept.source.replace('reviewReference: commit:6589043', 'reviewReference: commit:5031ac8') }
    : concept);

  assert.throws(
    () => verifyHumanReviews(forged, { repositoryDirectory }),
    (error) => error instanceof ContentValidationError && error.message.includes('must contain the verified state and every human review confirmation')
  );
});

test('rejects authored content changed after the human review commit', () => {
  const changed = structuredClone(sources);
  changed.conceptSources = changed.conceptSources.map((concept) => concept.filePath.endsWith('nullable-types.md')
    ? { ...concept, source: concept.source.replace('A nullable type makes', 'An edited nullable type makes') }
    : concept);

  assert.throws(
    () => verifyHumanReviews(changed, { repositoryDirectory }),
    (error) => error instanceof ContentValidationError && error.message.includes('differs from human-reviewed commit')
  );
});
