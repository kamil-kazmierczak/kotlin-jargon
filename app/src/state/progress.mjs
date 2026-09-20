export const PROGRESS_FORMAT_VERSION = 2;
export const ASSESSMENT_DEFINITIONS = [
  { status: 'not-assessed', label: 'Not assessed', color: '#94a3b8', symbol: '○', durable: false },
  { status: 'needs-review', label: 'Needs review', color: '#f59e0b', symbol: '!', durable: true },
  { status: 'can-explain', label: 'Can explain', color: '#10b981', symbol: '✓', durable: true },
  { status: 'interview-ready', label: 'Interview-ready', color: '#8b5cf6', symbol: '◆', durable: true }
];
export const DURABLE_ASSESSMENT_STATUSES = ASSESSMENT_DEFINITIONS
  .filter(({ durable }) => durable)
  .map(({ status }) => status);
export const GROUP_ASSESSMENT_DEFINITIONS = [
  { status: 'not-attempted', label: 'Not attempted', durable: false },
  { status: 'needs-review', label: 'Needs review', durable: true },
  { status: 'scenario-ready', label: 'Scenario-ready', durable: true }
];
export const DURABLE_GROUP_ASSESSMENT_STATUSES = GROUP_ASSESSMENT_DEFINITIONS
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

const validateGroupAssessment = (groupId, assessment) => {
  if (!isPlainObject(assessment)) throw new Error(`Invalid group assessment for ${groupId}.`);
  const keys = Object.keys(assessment).sort();
  if (keys.length !== 2 || keys[0] !== 'assessedAt' || keys[1] !== 'status') {
    throw new Error(`Unsupported group assessment data for ${groupId}.`);
  }
  if (!DURABLE_GROUP_ASSESSMENT_STATUSES.includes(assessment.status)) {
    throw new Error(`Invalid group assessment state for ${groupId}.`);
  }
  if (!isIsoDate(assessment.assessedAt)) throw new Error(`Invalid group assessment date for ${groupId}.`);
};

const copyAssessments = (assessments = {}) => Object.fromEntries(
  Object.entries(assessments).map(([id, assessment]) => [id, {
    status: assessment.status,
    assessedAt: assessment.assessedAt
  }])
);

export const createProgressExport = (state) => ({
  version: PROGRESS_FORMAT_VERSION,
  assessments: copyAssessments(state.assessments),
  groupAssessments: copyAssessments(state.groupAssessments)
});

const parseJson = (source) => {
  try {
    return typeof source === 'string' ? JSON.parse(source) : source;
  } catch {
    throw new Error('Progress file is not valid JSON.');
  }
};

const validateAssessmentMap = (items, knownIds, label, validateItem) => {
  if (!isPlainObject(items)) throw new Error(`Progress ${label} must be an object.`);
  const known = new Set(knownIds);
  for (const [id, assessment] of Object.entries(items)) {
    if (!known.has(id)) throw new Error(`Unknown ${label === 'assessments' ? 'concept' : 'group'}: ${id}.`);
    validateItem(id, assessment);
  }
  return copyAssessments(items);
};

const migrateVersionOne = (progress) => {
  const keys = Object.keys(progress).sort();
  if (keys.length !== 2 || keys[0] !== 'assessments' || keys[1] !== 'version') {
    throw new Error('Progress file contains unsupported data.');
  }
  return {
    version: PROGRESS_FORMAT_VERSION,
    assessments: progress.assessments,
    groupAssessments: {}
  };
};

const validateProgress = (source, knownConceptIds, knownGroupIds) => {
  const progress = source?.version === 1 ? migrateVersionOne(source) : source;
  if (!isPlainObject(progress)) throw new Error('Progress file must contain an object.');
  const rootKeys = Object.keys(progress).sort();
  if (rootKeys.length !== 3 || rootKeys[0] !== 'assessments' || rootKeys[1] !== 'groupAssessments' || rootKeys[2] !== 'version') {
    throw new Error('Progress file contains unsupported data.');
  }
  if (progress.version !== PROGRESS_FORMAT_VERSION) {
    throw new Error(`Unsupported progress version: ${String(progress.version)}.`);
  }
  return {
    assessments: validateAssessmentMap(progress.assessments, knownConceptIds, 'assessments', validateAssessment),
    groupAssessments: validateAssessmentMap(progress.groupAssessments, knownGroupIds, 'group assessments', validateGroupAssessment)
  };
};

export const parseProgressImport = (source, knownConceptIds, knownGroupIds = []) => (
  validateProgress(parseJson(source), knownConceptIds, knownGroupIds)
);

export const parseStoredProgress = (source, knownConceptIds, knownGroupIds = []) => {
  const stored = parseJson(source);
  const isLegacyAssessmentEnvelope = isPlainObject(stored) &&
    Object.keys(stored).length === 1 &&
    Object.hasOwn(stored, 'assessments');
  return validateProgress(isLegacyAssessmentEnvelope
    ? { version: 1, assessments: stored.assessments }
    : stored, knownConceptIds, knownGroupIds);
};
