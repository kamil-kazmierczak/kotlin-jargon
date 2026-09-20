export const DEFAULT_CONCEPT_ID = 'nullable-types';

function cloneSerializable(value) {
  if (value == null) return null;
  return JSON.parse(JSON.stringify(value));
}

function restoreCamera(camera) {
  if (!camera) return null;

  const { x, y, scale } = camera;
  if (![x, y, scale].every(Number.isFinite) || scale <= 0) return null;

  return { x, y, scale };
}

function restoreFilters(filters = {}) {
  return {
    query: typeof filters.query === 'string' ? filters.query : '',
    categoryIds: Array.isArray(filters.categoryIds)
      ? filters.categoryIds.filter((categoryId) => typeof categoryId === 'string')
      : [],
    depths: Array.isArray(filters.depths)
      ? filters.depths.filter((depth) => ['core', 'deep-dive', 'reference'].includes(depth))
      : ['core']
  };
}

function captureLessonEntry(state) {
  return {
    selection: cloneSerializable(state.selection),
    graphView: cloneSerializable(state.graphView)
  };
}

export function createApplicationState(initialState = {}) {
  const selection = initialState.selection || {};
  const graphView = initialState.graphView || {};

  return {
    selection: {
      conceptId: typeof selection.conceptId === 'string'
        ? selection.conceptId
        : DEFAULT_CONCEPT_ID,
      panelOpen: selection.panelOpen === true
    },
    graphView: {
      camera: restoreCamera(graphView.camera),
      filters: restoreFilters(graphView.filters),
      studyPathOverlay: cloneSerializable(graphView.studyPathOverlay),
      temporaryReveal: cloneSerializable(graphView.temporaryReveal)
    },
    lessonContext: null
  };
}

export function captureApplicationState(state) {
  return createApplicationState(state);
}

export function restoreApplicationState(snapshot) {
  return createApplicationState(snapshot);
}

export function applicationStateReducer(state, event) {
  switch (event.type) {
    case 'concept-selected':
      if (typeof event.conceptId !== 'string') return state;
      return {
        ...state,
        selection: {
          conceptId: event.conceptId,
          panelOpen: true
        },
        graphView: state.graphView
      };
    case 'lesson-opened':
      if (typeof event.conceptId !== 'string') return state;
      if (state.lessonContext && state.selection.conceptId === event.conceptId && state.selection.panelOpen) return state;
      return {
        ...state,
        selection: { conceptId: event.conceptId, panelOpen: true },
        lessonContext: {
          entry: captureLessonEntry(state),
          trail: []
        }
      };
    case 'preview-study-selected':
      if (typeof event.conceptId !== 'string' || !state.lessonContext) return state;
      return {
        ...state,
        selection: { conceptId: event.conceptId, panelOpen: true },
        lessonContext: {
          ...state.lessonContext,
          trail: [...state.lessonContext.trail, { conceptId: state.selection.conceptId }]
        }
      };
    case 'lesson-trail-returned': {
      const trail = state.lessonContext?.trail || [];
      const previous = trail.at(-1);
      if (!previous) return state;
      return {
        ...state,
        selection: { conceptId: previous.conceptId, panelOpen: true },
        lessonContext: { ...state.lessonContext, trail: trail.slice(0, -1) }
      };
    }
    case 'concept-closed':
      if (state.lessonContext) {
        return {
          ...state.lessonContext.entry,
          lessonContext: null
        };
      }
      return {
        ...state,
        selection: {
          ...state.selection,
          panelOpen: false
        }
      };
    case 'filter-query-changed':
      return {
        ...state,
        graphView: {
          ...state.graphView,
          filters: {
            ...state.graphView.filters,
            query: typeof event.query === 'string' ? event.query : ''
          }
        }
      };
    case 'filter-toggled': {
      const key = event.filter === 'depth' ? 'depths' : 'categoryIds';
      if (typeof event.value !== 'string') return state;
      const values = state.graphView.filters[key];
      return {
        ...state,
        graphView: {
          ...state.graphView,
          filters: { ...state.graphView.filters, [key]: values.includes(event.value)
            ? values.filter((value) => value !== event.value) : [...values, event.value] },
          temporaryReveal: null
        }
      };
    }
    case 'study-path-toggled':
      return { ...state, graphView: { ...state.graphView, studyPathOverlay:
        state.graphView.studyPathOverlay?.pathId === event.pathId ? null : { pathId: event.pathId }, temporaryReveal: null } };
    case 'search-revealed':
      if (typeof event.conceptId !== 'string') return state;
      return { ...state, graphView: { ...state.graphView, temporaryReveal: {
        conceptId: event.conceptId, previousFilters: cloneSerializable(state.graphView.filters),
        previousStudyPathOverlay: cloneSerializable(state.graphView.studyPathOverlay)
      }, filters: { ...state.graphView.filters, query: '' } } };
    case 'temporary-reveal-returned': {
      const reveal = state.graphView.temporaryReveal;
      if (!reveal) return state;
      return { ...state, graphView: { ...state.graphView, filters: restoreFilters(reveal.previousFilters),
        studyPathOverlay: cloneSerializable(reveal.previousStudyPathOverlay), temporaryReveal: null } };
    }
    case 'camera-changed':
      return {
        ...state,
        graphView: {
          ...state.graphView,
          camera: restoreCamera(event.camera)
        }
      };
    case 'graph-view-changed':
      return {
        ...state,
        graphView: createApplicationState({ graphView: event.graphView }).graphView
      };
    case 'application-state-restored':
      return restoreApplicationState(event.snapshot);
    default:
      return state;
  }
}
