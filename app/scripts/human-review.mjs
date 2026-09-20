import { execFileSync } from 'node:child_process';

import { ContentValidationError, parseConceptSource } from './content-pipeline.mjs';

const REVIEW_REFERENCE_PATTERN = /^reviewReference:/;

function reviewedContent(source) {
  return source
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !REVIEW_REFERENCE_PATTERN.test(line))
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
      const reviewedSource = git(repositoryDirectory, ['show', `${commit}:${filePath}`]);
      const reviewedMetadata = parseConceptSource(filePath, reviewedSource).metadata;

      if (!(reviewer.gitEmails || []).includes(authorEmail)) {
        issues.push(`${filePath}: review commit ${commit} was not authored by trusted reviewer "${reviewer.id}"`);
      }
      if (reviewedMetadata.publicationStatus !== 'verified' ||
          reviewedMetadata.reviewerKind !== 'human' ||
          reviewedMetadata.reviewedBy !== metadata.reviewedBy ||
          reviewedMetadata.reviewPedagogicalClarity !== true ||
          reviewedMetadata.reviewAuthoritativeSupport !== true ||
          reviewedMetadata.reviewInterviewRealism !== true ||
          reviewedMetadata.reviewGuaranteeWording !== true) {
        issues.push(`${filePath}: review commit ${commit} must contain the verified state and every human review confirmation`);
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
