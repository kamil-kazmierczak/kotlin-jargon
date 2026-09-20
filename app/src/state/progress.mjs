export const PROGRESS_FORMAT_VERSION = 1;
export const ASSESSMENT_DEFINITIONS = [
  { status: 'not-assessed', label: 'Not assessed', color: '#94a3b8', symbol: '○', durable: false },
  { status: 'needs-review', label: 'Needs review', color: '#f59e0b', symbol: '!', durable: true },
  { status: 'can-explain', label: 'Can explain', color: '#10b981', symbol: '✓', durable: true },
  { status: 'interview-ready', label: 'Interview-ready', color: '#8b5cf6', symbol: '◆', durable: true }
];
export const DURABLE_ASSESSMENT_STATUSES = ASSESSMENT_DEFINITIONS
  .filter(({ durable }) => durable)
  .map(({ status }) => status);

const isPlainObject = (value) => (
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype
);

export const isIsoDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const validateAssessment = (conceptId, assessment) => {
  if (!isPlainObject(assessment)) throw new Error(`Invalid assessment for ${conceptId}.`);
  const keys = Object.keys(assessment).sort();
  if (keys.length !== 2 || keys[0] !== 'assessedAt' || keys[1] !== 'status') {
    throw new Error(`Unsupported assessment data for ${conceptId}.`);
  }
  if (!DURABLE_ASSESSMENT_STATUSES.includes(assessment.status)) {
    throw new Error(`Invalid assessment state for ${conceptId}.`);
  }
  if (!isIsoDate(assessment.assessedAt)) throw new Error(`Invalid assessment date for ${conceptId}.`);
};

export const createProgressExport = (state) => ({
  version: PROGRESS_FORMAT_VERSION,
  assessments: Object.fromEntries(Object.entries(state.assessments || {}).map(([conceptId, assessment]) => [
    conceptId,
    { status: assessment.status, assessedAt: assessment.assessedAt }
  ]))
});

const parseJson = (source) => {
  try {
    return typeof source === 'string' ? JSON.parse(source) : source;
  } catch {
    throw new Error('Progress file is not valid JSON.');
  }
};

const validateProgress = (progress, knownConceptIds) => {
  if (!isPlainObject(progress)) throw new Error('Progress file must contain an object.');
  const rootKeys = Object.keys(progress).sort();
  if (rootKeys.length !== 2 || rootKeys[0] !== 'assessments' || rootKeys[1] !== 'version') {
    throw new Error('Progress file contains unsupported data.');
  }
  if (progress.version !== PROGRESS_FORMAT_VERSION) {
    throw new Error(`Unsupported progress version: ${String(progress.version)}.`);
  }
  if (!isPlainObject(progress.assessments)) throw new Error('Progress assessments must be an object.');

  const knownConcepts = new Set(knownConceptIds);
  for (const [conceptId, assessment] of Object.entries(progress.assessments)) {
    if (!knownConcepts.has(conceptId)) throw new Error(`Unknown concept: ${conceptId}.`);
    validateAssessment(conceptId, assessment);
  }

  return structuredClone(progress.assessments);
};

export const parseProgressImport = (source, knownConceptIds) => (
  validateProgress(parseJson(source), knownConceptIds)
);

export const parseStoredProgress = (source, knownConceptIds) => {
  const stored = parseJson(source);
  const isLegacyAssessmentEnvelope = isPlainObject(stored) &&
    Object.keys(stored).length === 1 &&
    Object.hasOwn(stored, 'assessments');
  return validateProgress(isLegacyAssessmentEnvelope
    ? { version: PROGRESS_FORMAT_VERSION, assessments: stored.assessments }
    : stored, knownConceptIds);
};
