import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applicationStateReducer,
  captureApplicationState,
  createApplicationState,
  restoreApplicationState
} from '../src/state/applicationState.mjs';

test('the default state keeps the graph highlight while the concept panel is closed', () => {
  assert.deepEqual(createApplicationState(), {
    selection: {
      conceptId: 'nullable-types',
      panelOpen: false
    },
    graphView: {
      camera: null,
      filters: {
        query: '',
        categoryIds: [],
        depths: ['core']
      },
      studyPathOverlay: null,
      temporaryReveal: null
    },
    lessonContext: null
  });
});

test('selecting and closing concepts preserves the existing desktop navigation behavior', () => {
  const selected = applicationStateReducer(createApplicationState(), {
    type: 'concept-selected',
    conceptId: 'thunk'
  });

  assert.equal(selected.selection.conceptId, 'thunk');
  assert.equal(selected.selection.panelOpen, true);

  const closed = applicationStateReducer(selected, { type: 'concept-closed' });

  assert.equal(closed.selection.conceptId, 'thunk');
  assert.equal(closed.selection.panelOpen, false);
});

test('captured application state restores selection and the complete graph view contract', () => {
  const state = createApplicationState({
    selection: {
      conceptId: 'functor',
      panelOpen: true
    },
    graphView: {
      camera: { x: 120, y: -45, scale: 1.25 },
      filters: {
        query: 'func',
        categoryIds: ['core-functions'],
        depths: ['core', 'deep-dive']
      },
      studyPathOverlay: {
        pathId: 'foundations',
        activeStepId: 'pure-function'
      }
    }
  });

  const snapshot = captureApplicationState(state);
  const restored = restoreApplicationState(JSON.parse(JSON.stringify(snapshot)));

  assert.deepEqual(restored, state);
  assert.notEqual(snapshot.selection, state.selection);
  assert.notEqual(snapshot.graphView, state.graphView);
});

test('graph view updates do not expose geometry to or overwrite selection state', () => {
  const selected = applicationStateReducer(createApplicationState(), {
    type: 'concept-selected',
    conceptId: 'monad'
  });
  const updated = applicationStateReducer(selected, {
    type: 'graph-view-changed',
    graphView: {
      camera: { x: 3, y: 4, scale: 0.8 },
      filters: { query: 'mon', categoryIds: [], depths: ['core'] },
      studyPathOverlay: null
    }
  });

  assert.deepEqual(updated.selection, selected.selection);
  assert.deepEqual(updated.graphView.camera, { x: 3, y: 4, scale: 0.8 });
  assert.equal(updated.graphView.filters.query, 'mon');
});

test('a hidden search result temporarily reveals its neighborhood and restores the exact prior view', () => {
  const filtered = createApplicationState({ graphView: {
    filters: { categoryIds: ['type-system'], depths: ['core'], query: '' },
    studyPathOverlay: { pathId: 'foundations' }
  } });
  const revealed = applicationStateReducer(filtered, { type: 'search-revealed', conceptId: 'platform-types' });
  assert.equal(revealed.graphView.temporaryReveal.conceptId, 'platform-types');
  const returned = applicationStateReducer(revealed, { type: 'temporary-reveal-returned' });
  assert.deepEqual(returned.graphView.filters, filtered.graphView.filters);
  assert.deepEqual(returned.graphView.studyPathOverlay, filtered.graphView.studyPathOverlay);
});

test('studying a preview retains a trail and closing the lesson restores its graph entry', () => {
  const graphEntry = createApplicationState({
    selection: { conceptId: 'platform-types', panelOpen: false },
    graphView: {
      camera: { x: 80, y: -30, scale: 1.2 },
      filters: { query: '', categoryIds: ['type-system'], depths: ['core', 'deep-dive'] },
      studyPathOverlay: { pathId: 'foundations' },
      temporaryReveal: { conceptId: 'platform-types' }
    }
  });
  const opened = applicationStateReducer(graphEntry, { type: 'lesson-opened', conceptId: 'not-null-assertion' });
  const studyingPreview = applicationStateReducer(opened, { type: 'preview-study-selected', conceptId: 'nullable-types' });

  assert.deepEqual(studyingPreview.lessonContext.trail, [{ conceptId: 'not-null-assertion' }]);
  const returnedToOrigin = applicationStateReducer(studyingPreview, { type: 'lesson-trail-returned' });
  assert.equal(returnedToOrigin.selection.conceptId, 'not-null-assertion');

  const closed = applicationStateReducer(returnedToOrigin, { type: 'concept-closed' });
  assert.deepEqual(closed.selection, graphEntry.selection);
  assert.deepEqual(closed.graphView, graphEntry.graphView);
  assert.equal(closed.lessonContext, null);
});
