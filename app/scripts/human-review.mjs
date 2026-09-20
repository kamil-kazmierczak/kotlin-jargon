import { execFileSync } from 'node:child_process';

import { ContentValidationError, parseConceptSource } from './content-pipeline.mjs';

const REVIEW_METADATA_PATTERN = /^(publicationHistory|reviewerKind|reviewedBy|reviewedAt|reviewReference|reviewPedagogicalClarity|reviewAuthoritativeSupport|reviewInterviewRealism|reviewGuaranteeWording):/;

function reviewedContent(source) {
  return source
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !REVIEW_METADATA_PATTERN.test(line))
    .join('\n')
    .trim();
}

function git(repositoryDirectory, args) {
  return execFileSync('git', args, {
    cwd: repositoryDirectory,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

export function verifyHumanReviews({ manifest, conceptSources }, { repositoryDirectory }) {
  const issues = [];
  const reviewers = new Map((manifest.humanReviewers || []).map((reviewer) => [reviewer.id, reviewer]));

  for (const { filePath, source } of conceptSources) {
    const { metadata } = parseConceptSource(filePath, source);
    if (metadata.publicationStatus !== 'verified') continue;

    const reviewer = reviewers.get(metadata.reviewedBy);
    if (!reviewer) {
      issues.push(`${filePath}: reviewedBy must identify a trusted human reviewer from curriculum.json`);
      continue;
    }
    const commit = metadata.reviewReference?.match(/^commit:([0-9a-f]{7,40})$/)?.[1];
    if (!commit) {
      issues.push(`${filePath}: verified concepts require a commit reviewReference`);
      continue;
    }

    try {
      execFileSync('git', ['merge-base', '--is-ancestor', commit, 'HEAD'], {
        cwd: repositoryDirectory,
        stdio: 'ignore'
      });
      const authorEmail = git(repositoryDirectory, ['show', '-s', '--format=%ae', commit]);
      const authoredAt = git(repositoryDirectory, ['show', '-s', '--format=%as', commit]);
      const reviewedSource = git(repositoryDirectory, ['show', `${commit}:${filePath}`]);

      if (!(reviewer.gitEmails || []).includes(authorEmail)) {
        issues.push(`${filePath}: review commit ${commit} was not authored by trusted reviewer "${reviewer.id}"`);
      }
      if (metadata.reviewedAt !== authoredAt) {
        issues.push(`${filePath}: reviewedAt must match review commit ${commit} author date ${authoredAt}`);
      }
      if (reviewedContent(source) !== reviewedContent(reviewedSource)) {
        issues.push(`${filePath}: authored content differs from human-reviewed commit ${commit}`);
      }
    } catch (error) {
      issues.push(`${filePath}: review commit ${commit} must exist in local history, be an ancestor of HEAD, and contain the concept`);
    }
  }

  if (issues.length > 0) throw new ContentValidationError(issues);
}
