import fs from 'node:fs';
import path from 'node:path';

const COMPACT_SECTIONS = [
  'Overview',
  'Semantics',
  'Example',
  'Connections',
  'Sources'
];
const DEPTHS = new Set(['core', 'deep-dive', 'reference']);
const PUBLICATION_STATUSES = new Set(['draft', 'review-ready', 'verified']);
const PUBLICATION_TRANSITIONS = new Map([
  ['draft', 'review-ready'],
  ['review-ready', 'verified']
]);
const REVIEW_CONFIRMATIONS = [
  'reviewPedagogicalClarity',
  'reviewAuthoritativeSupport',
  'reviewInterviewRealism',
  'reviewGuaranteeWording'
];
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VERIFICATION_MODES = new Set(['compile', 'run', 'compile-fails', 'fragment', 'pseudocode']);

const SECTION_KEYS = {
  'Overview': 'overview',
  'Why it matters to Java developers': 'javaDeveloperRelevance',
  'Semantics': 'semantics',
  'Example': 'example',
  'Connections': 'connections',
  'Sources': 'sources',
  'Interview question': 'interviewQuestion',
  'Essential points': 'essentialPoints',
  'Trade-offs': 'tradeOffs',
  'Common traps': 'commonTraps',
  'Follow-up probes': 'followUpProbes'
};

const INTERVIEW_SECTION_KEYS = [
  'interviewQuestion',
  'essentialPoints',
  'tradeOffs',
  'commonTraps',
  'followUpProbes'
];

export class ContentValidationError extends Error {
  constructor(issues) {
    const issueList = Array.isArray(issues) ? issues : [issues];
    super(`Content validation failed:\n- ${issueList.join('\n- ')}`);
    this.name = 'ContentValidationError';
    this.issues = issueList;
  }
}

function parseFlowArray(value, filePath, lineNumber) {
  const inner = value.slice(1, -1).trim();
  if (!inner) return [];

  return inner.split(',').map((item) => item.trim()).map((item) => {
    if (!item) {
      throw new ContentValidationError(`${filePath}: front matter line ${lineNumber} contains an empty array item`);
    }
    return parseScalar(item, filePath, lineNumber);
  });
}

function parseScalar(value, filePath, lineNumber) {
  const hasUnmatchedDoubleQuote = value.startsWith('"') !== value.endsWith('"');
  const hasUnmatchedSingleQuote = value.startsWith("'") !== value.endsWith("'");
  const hasUnmatchedArrayBracket = value.startsWith('[') !== value.endsWith(']');
  if (hasUnmatchedDoubleQuote || hasUnmatchedSingleQuote || hasUnmatchedArrayBracket) {
    throw new ContentValidationError(`${filePath}: malformed front matter line ${lineNumber}; unterminated value`);
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    return parseFlowArray(value, filePath, lineNumber);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function parseFrontMatter(filePath, source) {
  const normalized = source.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    throw new ContentValidationError(`${filePath}: structured Markdown must start with front matter delimited by ---`);
  }

  const closingIndex = normalized.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    throw new ContentValidationError(`${filePath}: front matter is missing its closing --- delimiter`);
  }

  const metadata = {};
  const frontMatter = normalized.slice(4, closingIndex);
  frontMatter.split('\n').forEach((line, index) => {
    if (!line.trim()) return;
    const separator = line.indexOf(':');
    if (separator <= 0) {
      throw new ContentValidationError(`${filePath}: malformed front matter line ${index + 1}; expected "key: value"`);
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!key || !value) {
      throw new ContentValidationError(`${filePath}: malformed front matter line ${index + 1}; key and value are required`);
    }
    if (Object.hasOwn(metadata, key)) {
      throw new ContentValidationError(`${filePath}: duplicate front matter key "${key}"`);
    }
    metadata[key] = parseScalar(value, filePath, index + 1);
  });

  return {
    metadata,
    body: normalized.slice(closingIndex + 5).trim()
  };
}

function parseSections(filePath, body) {
  const matches = [...body.matchAll(/^## (.+)$/gm)];
  const sections = {};
  const headings = new Set();

  matches.forEach((match, index) => {
    const heading = match[1].trim();
    if (headings.has(heading)) {
      throw new ContentValidationError(`${filePath}: duplicate section "${heading}"`);
    }
    headings.add(heading);
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? body.length;
    sections[heading] = body.slice(start, end).trim();
  });

  return sections;
}

function extractSources(filePath, sourceSection) {
  const sources = [];
  for (const line of sourceSection.split('\n')) {
    if (!line.trim()) continue;
    const match = line.match(/^\s*-\s+\[([^\]]+)]\((https:\/\/[^)]+)\)\s*$/);
    if (!match) {
      throw new ContentValidationError(`${filePath}: Sources entries must be HTTPS Markdown links`);
    }
    sources.push({ title: match[1], url: match[2] });
  }
  return sources;
}

function extractCodeBlocks(markdown) {
  return [...markdown.matchAll(/```([^\n]*)\n([\s\S]*?)```/g)].map((match) => {
    const [language = '', verification = '', ...attributes] = match[1].trim().split(/\s+/);
    return {
      language,
      verification: verification || 'unclassified',
      verificationAttributes: Object.fromEntries(attributes.map((attribute) => {
        const [key, ...value] = attribute.split('=');
        return [key, value.join('=')];
      })),
      code: match[2].trim()
    };
  });
}

export function parseConceptSource(filePath, source) {
  const { metadata, body } = parseFrontMatter(filePath, source);
  const namedSections = parseSections(filePath, body);
  const sections = {};

  for (const [heading, content] of Object.entries(namedSections)) {
    sections[SECTION_KEYS[heading] || heading] = content;
  }

  return {
    filePath,
    metadata,
    sections,
    sectionHeadings: new Set(Object.keys(namedSections)),
    sources: namedSections.Sources ? extractSources(filePath, namedSections.Sources) : [],
    codeBlocks: extractCodeBlocks(body)
  };
}

function validateManifest(manifest, issues) {
  if (manifest?.schemaVersion !== 2) issues.push('curriculum.json: schemaVersion must be 2');
  if (!manifest?.baseline?.id) issues.push('curriculum.json: baseline.id is required');
  for (const field of ['adoptedAt', 'upgradeRationale', 'sourceUrl']) {
    if (!manifest?.baseline?.[field]) issues.push(`curriculum.json: baseline.${field} is required`);
  }
  if (!Object.hasOwn(manifest?.baseline || {}, 'previousId')) {
    issues.push('curriculum.json: baseline.previousId is required (use null for the first baseline)');
  }
  if (!Array.isArray(manifest?.officialSourceHosts) || manifest.officialSourceHosts.length === 0) {
    issues.push('curriculum.json: officialSourceHosts requires at least one trusted documentation host');
  }
  if (!Array.isArray(manifest?.categories) || manifest.categories.length === 0) {
    issues.push('curriculum.json: at least one category is required');
  }
  if (!Array.isArray(manifest?.studyPaths) || manifest.studyPaths.length === 0) {
    issues.push('curriculum.json: at least one study path is required');
  }

  for (const [kind, entries] of [['category', manifest?.categories], ['study path', manifest?.studyPaths]]) {
    const seen = new Set();
    for (const entry of entries || []) {
      if (!entry?.id || !ID_PATTERN.test(entry.id)) {
        issues.push(`curriculum.json: ${kind} IDs must be lowercase kebab-case`);
      } else if (seen.has(entry.id)) {
        issues.push(`curriculum.json: duplicate ${kind} ID "${entry.id}"`);
      }
      seen.add(entry?.id);
    }
  }
}

function isIsoDate(value) {
  const parsedDate = typeof value === 'string' ? new Date(`${value}T00:00:00Z`) : null;
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value;
}

function validatePublication(concept, manifest, issues) {
  const { metadata, filePath, sources } = concept;
  const status = metadata.publicationStatus;
  const history = metadata.publicationHistory;

  if (!PUBLICATION_STATUSES.has(status)) {
    issues.push(`${filePath}: unknown publication status "${status}"`);
  }
  if (!Array.isArray(history) || history.length === 0) {
    issues.push(`${filePath}: publicationHistory must be a non-empty array`);
  } else {
    if (history[0] !== 'draft') {
      issues.push(`${filePath}: publication history must start at status "draft"`);
    }
    for (const historyStatus of history) {
      if (!PUBLICATION_STATUSES.has(historyStatus)) {
        issues.push(`${filePath}: publication history contains unknown status "${historyStatus}"`);
      }
    }
    for (let index = 1; index < history.length; index += 1) {
      if (PUBLICATION_TRANSITIONS.get(history[index - 1]) !== history[index]) {
        issues.push(`${filePath}: invalid publication transition "${history[index - 1]}" to "${history[index]}"`);
      }
    }
    if (history.at(-1) !== status) {
      issues.push(`${filePath}: publication history must end at status "${status}"`);
    }
  }

  if (status !== 'verified') return;

  for (const dateField of ['publishedAt', 'verifiedAt', 'reviewedAt']) {
    if (!isIsoDate(metadata[dateField])) {
      issues.push(`${filePath}: ${dateField} must be an ISO date in YYYY-MM-DD form`);
    }
  }
  if (metadata.reviewerKind !== 'human') {
    issues.push(`${filePath}: reviewerKind must be "human" before publication can be verified`);
  }
  if (typeof metadata.reviewedBy !== 'string' || !metadata.reviewedBy.trim()) {
    issues.push(`${filePath}: reviewedBy must identify the human publication reviewer`);
  }
  if (typeof metadata.reviewReference !== 'string' || !/^(commit|issue):\S+/.test(metadata.reviewReference)) {
    issues.push(`${filePath}: reviewReference must point to the confirming issue or commit`);
  }
  for (const confirmation of REVIEW_CONFIRMATIONS) {
    if (metadata[confirmation] !== true) {
      issues.push(`${filePath}: ${confirmation} must be true before publication can be verified`);
    }
  }
  const officialHosts = new Set(manifest.officialSourceHosts || []);
  const hasOfficialSource = sources.some(({ url }) => officialHosts.has(new URL(url).hostname));
  if (!hasOfficialSource) {
    issues.push(`${filePath}: verified concepts require an official correctness source from curriculum.json officialSourceHosts`);
  }
}

function validateConceptShape(concept, manifest, issues) {
  const { metadata, sectionHeadings, sources, filePath } = concept;
  const requiredFields = [
    'id', 'title', 'profile', 'category', 'depth', 'publicationStatus',
    'publicationHistory', 'baseline', 'prerequisiteIds', 'relatedIds'
  ];

  for (const field of requiredFields) {
    if (metadata[field] === undefined || metadata[field] === '') {
      issues.push(`${filePath}: missing required front matter field "${field}"`);
    }
  }

  if (metadata.id && !ID_PATTERN.test(metadata.id)) {
    issues.push(`${filePath}: concept ID "${metadata.id}" must be a lowercase kebab-case permanent ID`);
  }
  if (metadata.profile !== 'compact') {
    issues.push(`${filePath}: unsupported lesson profile "${metadata.profile}"`);
  }
  if (metadata.profile === 'compact') {
    for (const heading of COMPACT_SECTIONS) {
      if (!sectionHeadings.has(heading)) {
        issues.push(`${filePath}: missing required compact section "${heading}"`);
      }
    }
  }
  if (!sectionHeadings.has('Why it matters to Java developers')) {
    issues.push(`${filePath}: missing learner-context section "Why it matters to Java developers"`);
  }
  if (!DEPTHS.has(metadata.depth)) {
    issues.push(`${filePath}: unknown curriculum depth "${metadata.depth}"`);
  }
  if (!(manifest.categories || []).some((category) => category.id === metadata.category)) {
    issues.push(`${filePath}: unknown category "${metadata.category}"`);
  }
  if (metadata.baseline !== manifest.baseline.id) {
    issues.push(`${filePath}: unknown baseline "${metadata.baseline}"`);
  }
  if (!Array.isArray(metadata.prerequisiteIds) || !Array.isArray(metadata.relatedIds)) {
    issues.push(`${filePath}: prerequisiteIds and relatedIds must be arrays`);
  }
  for (const dateField of ['publishedAt', 'verifiedAt', 'reviewedAt']) {
    const date = metadata[dateField];
    if (date !== undefined && !isIsoDate(date)) {
      issues.push(`${filePath}: ${dateField} must be an ISO date in YYYY-MM-DD form`);
    }
  }
  if (sources.length === 0 && sectionHeadings.has('Sources')) {
    issues.push(`${filePath}: Sources must contain at least one authoritative HTTPS link`);
  }
  const interviewSectionCount = INTERVIEW_SECTION_KEYS.filter((key) => concept.sections[key]).length;
  if (interviewSectionCount > 0 && interviewSectionCount !== INTERVIEW_SECTION_KEYS.length) {
    issues.push(`${filePath}: interview practice must include question, essential points, trade-offs, common traps, and follow-up probes`);
  }
  for (const codeBlock of concept.codeBlocks) {
    if (['kotlin', 'java'].includes(codeBlock.language) && !VERIFICATION_MODES.has(codeBlock.verification)) {
      issues.push(`${filePath}: code block must declare one of ${[...VERIFICATION_MODES].join(', ')} verification modes`);
    }
  }
  validatePublication(concept, manifest, issues);
}

function validateGraph(concepts, manifest, issues) {
  const ids = new Set(concepts.map((concept) => concept.metadata.id));
  const statuses = new Map(concepts.map((concept) => [concept.metadata.id, concept.metadata.publicationStatus]));

  for (const concept of concepts) {
    const { metadata, filePath, sections } = concept;
    for (const relationshipId of [...(metadata.prerequisiteIds || []), ...(metadata.relatedIds || [])]) {
      if (!ids.has(relationshipId)) {
        issues.push(`${filePath}: relationship references unknown concept "${relationshipId}"`);
      }
      if (relationshipId === metadata.id) {
        issues.push(`${filePath}: concept cannot relate to itself`);
      }
    }

    for (const content of Object.values(sections)) {
      for (const match of content.matchAll(/\]\(#([^)]*)\)/g)) {
        const targetId = match[1];
        if (!ID_PATTERN.test(targetId)) {
          issues.push(`${filePath}: internal link target "#${targetId}" must use a lowercase kebab-case concept ID`);
        } else if (!ids.has(targetId)) {
          issues.push(`${filePath}: internal link references unknown concept "${targetId}"`);
        } else if (metadata.publicationStatus === 'verified' && statuses.get(targetId) !== 'verified') {
          issues.push(`${filePath}: verified concept links to unverified concept "${targetId}"`);
        }
      }
    }
  }

  for (const studyPath of manifest.studyPaths || []) {
    const seen = new Set();
    for (const conceptId of studyPath.conceptIds || []) {
      if (!ids.has(conceptId)) {
        issues.push(`curriculum.json: study path "${studyPath.id}" references unknown concept "${conceptId}"`);
      }
      if (seen.has(conceptId)) {
        issues.push(`curriculum.json: study path "${studyPath.id}" repeats concept "${conceptId}"`);
      }
      seen.add(conceptId);
    }

    if (studyPath.scenario !== undefined) {
      const { scenario } = studyPath;
      if (!scenario || typeof scenario !== 'object' || Array.isArray(scenario)) {
        issues.push(`curriculum.json: study path "${studyPath.id}" scenario must be an object`);
        continue;
      }
      for (const field of ['title', 'context']) {
        if (typeof scenario[field] !== 'string' || !scenario[field].trim()) {
          issues.push(`curriculum.json: study path "${studyPath.id}" scenario.${field} is required`);
        }
      }
      if (!Array.isArray(scenario.stages) || scenario.stages.length < 2) {
        issues.push(`curriculum.json: study path "${studyPath.id}" scenario requires at least two stages`);
      } else {
        const stageIds = new Set();
        scenario.stages.forEach((stage, index) => {
          for (const field of ['id', 'kind', 'prompt', 'feedback', 'nextConstraint']) {
            if (typeof stage?.[field] !== 'string' || !stage[field].trim()) {
              issues.push(`curriculum.json: study path "${studyPath.id}" scenario stage ${index + 1}.${field} is required`);
            }
          }
          if (stageIds.has(stage?.id)) {
            issues.push(`curriculum.json: study path "${studyPath.id}" scenario repeats stage "${stage.id}"`);
          }
          stageIds.add(stage?.id);
        });
      }
      for (const field of ['connections', 'tradeOffs']) {
        if (typeof scenario.debrief?.[field] !== 'string' || !scenario.debrief[field].trim()) {
          issues.push(`curriculum.json: study path "${studyPath.id}" scenario.debrief.${field} is required`);
        }
      }
      if (!Array.isArray(scenario.debrief?.rubric) || scenario.debrief.rubric.length === 0 ||
          scenario.debrief.rubric.some((item) => typeof item !== 'string' || !item.trim())) {
        issues.push(`curriculum.json: study path "${studyPath.id}" scenario.debrief.rubric requires text items`);
      }
    }
  }

  const pathConceptIds = new Set((manifest.studyPaths || []).flatMap(({ conceptIds = [] }) => conceptIds));
  for (const concept of concepts) {
    if (concept.metadata.publicationStatus === 'verified' && !pathConceptIds.has(concept.metadata.id)) {
      issues.push(`${concept.filePath}: verified concept "${concept.metadata.id}" is missing from every study path`);
    }
  }

  const prerequisites = new Map(concepts.map((concept) => [
    concept.metadata.id,
    concept.metadata.prerequisiteIds || []
  ]));
  const visiting = new Set();
  const visited = new Set();
  const visit = (id) => {
    if (visiting.has(id)) {
      issues.push(`prerequisite cycle detected at concept "${id}"`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const prerequisiteId of prerequisites.get(id) || []) visit(prerequisiteId);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of prerequisites.keys()) visit(id);
}

function normalizeCategories(categories) {
  return Object.fromEntries(categories
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((category) => [category.id, category]));
}

function studyPathMembership(conceptId, studyPaths) {
  return studyPaths.flatMap((studyPath) => {
    const index = studyPath.conceptIds.indexOf(conceptId);
    return index === -1 ? [] : [{ id: studyPath.id, position: index + 1 }];
  });
}

export function buildContentModel({ manifest, conceptSources }, { publicationMode = 'production' } = {}) {
  if (!['production', 'preview'].includes(publicationMode)) {
    throw new ContentValidationError(`unknown publication mode "${publicationMode}"`);
  }
  const issues = [];
  validateManifest(manifest, issues);

  const concepts = conceptSources
    .map(({ filePath, source }) => parseConceptSource(filePath, source))
    .sort((left, right) => left.metadata.id.localeCompare(right.metadata.id));

  const filesById = new Map();
  for (const concept of concepts) {
    const id = concept.metadata.id;
    if (filesById.has(id)) {
      issues.push(`${concept.filePath}: duplicate concept ID "${id}" (already used by ${filesById.get(id)})`);
    } else {
      filesById.set(id, concept.filePath);
    }
    validateConceptShape(concept, manifest, issues);
  }
  validateGraph(concepts, manifest, issues);

  if (issues.length > 0) throw new ContentValidationError(issues);

  const publishedConcepts = publicationMode === 'preview'
    ? concepts
    : concepts.filter(({ metadata }) => metadata.publicationStatus === 'verified');
  const publishedIds = new Set(publishedConcepts.map(({ metadata }) => metadata.id));
  const generatedStudyPaths = (manifest.studyPaths || []).map((studyPath) => ({
    ...studyPath,
    conceptIds: studyPath.conceptIds.filter((conceptId) => publishedIds.has(conceptId))
  }));
  const relatedEdges = new Map();
  const prerequisiteLinks = [];

  for (const concept of publishedConcepts) {
    for (const prerequisiteId of concept.metadata.prerequisiteIds) {
      if (publishedIds.has(prerequisiteId)) {
        prerequisiteLinks.push({ source: prerequisiteId, target: concept.metadata.id, type: 'prerequisite' });
      }
    }
    for (const relatedId of concept.metadata.relatedIds) {
      if (!publishedIds.has(relatedId)) continue;
      const [source, target] = [concept.metadata.id, relatedId].sort();
      relatedEdges.set(`${source}:${target}`, { source, target, type: 'related' });
    }
  }

  const generatedConcepts = publishedConcepts.map((concept) => ({
    id: concept.metadata.id,
    title: concept.metadata.title,
    aliases: concept.metadata.aliases || [],
    profile: concept.metadata.profile,
    publication: {
      status: concept.metadata.publicationStatus,
      publishedAt: concept.metadata.publishedAt
    },
    curriculum: {
      categoryId: concept.metadata.category,
      depth: concept.metadata.depth,
      studyPaths: studyPathMembership(concept.metadata.id, generatedStudyPaths)
    },
    relationships: {
      prerequisites: concept.metadata.prerequisiteIds.filter((id) => publishedIds.has(id)),
      related: concept.metadata.relatedIds.filter((id) => publishedIds.has(id))
    },
    lesson: {
      overview: concept.sections.overview,
      javaDeveloperRelevance: concept.sections.javaDeveloperRelevance,
      semantics: concept.sections.semantics,
      example: concept.sections.example,
      connections: concept.sections.connections,
      codeBlocks: concept.codeBlocks
    },
    ...(concept.sections.interviewQuestion
      ? {
          interview: {
            question: concept.sections.interviewQuestion,
            essentialPoints: concept.sections.essentialPoints,
            tradeOffs: concept.sections.tradeOffs,
            commonTraps: concept.sections.commonTraps,
            followUpProbes: concept.sections.followUpProbes
          }
        }
      : {}),
    provenance: {
      sourcePath: concept.filePath,
      baselineId: concept.metadata.baseline,
      verifiedAt: concept.metadata.verifiedAt,
      humanReview: concept.metadata.reviewerKind === 'human'
        ? {
            reviewedBy: concept.metadata.reviewedBy,
            reviewedAt: concept.metadata.reviewedAt,
            reference: concept.metadata.reviewReference,
            pedagogicalClarity: concept.metadata.reviewPedagogicalClarity,
            authoritativeSupport: concept.metadata.reviewAuthoritativeSupport,
            interviewRealism: concept.metadata.reviewInterviewRealism,
            guaranteeWording: concept.metadata.reviewGuaranteeWording
          }
        : null,
      sources: concept.sources
    }
  }));

  const links = [
    ...prerequisiteLinks,
    ...relatedEdges.values()
  ].sort((left, right) => `${left.source}:${left.target}:${left.type}`.localeCompare(`${right.source}:${right.target}:${right.type}`));

  return {
    meta: {
      title: 'Kotlin Concepts',
      subtitle: 'Kotlin/JVM concepts for experienced Java developers',
      totalConcepts: generatedConcepts.length,
      totalRelationships: links.length,
      publicationMode
    },
    baseline: manifest.baseline,
    categories: normalizeCategories(manifest.categories),
    studyPaths: generatedStudyPaths,
    concepts: generatedConcepts,
    graph: {
      nodes: generatedConcepts.map((concept) => ({
        id: concept.id,
        name: concept.title,
        category: concept.curriculum.categoryId,
        depth: concept.curriculum.depth,
        val: 4
      })),
      links
    }
  };
}

export function readContentSources({ manifestPath, conceptsDirectory }) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const conceptSources = fs.readdirSync(conceptsDirectory)
    .filter((fileName) => fileName.endsWith('.md'))
    .sort()
    .map((fileName) => ({
      filePath: path.posix.join('content/concepts', fileName),
      source: fs.readFileSync(path.join(conceptsDirectory, fileName), 'utf8')
    }));
  return { manifest, conceptSources };
}
