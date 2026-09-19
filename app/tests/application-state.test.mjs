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
    lessonOpen: false,
    graphView: {
      camera: null,
      filters: {
        query: '',
        categoryIds: []
      },
      studyPathOverlay: null
    }
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
    lessonOpen: false,
    graphView: {
      camera: { x: 120, y: -45, scale: 1.25 },
      filters: {
        query: 'func',
        categoryIds: ['core-functions']
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
      filters: { query: 'mon', categoryIds: [] },
      studyPathOverlay: null
    }
  });

  assert.deepEqual(updated.selection, selected.selection);
  assert.deepEqual(updated.graphView.camera, { x: 3, y: 4, scale: 0.8 });
  assert.equal(updated.graphView.filters.query, 'mon');
});

test('focused lessons preserve graph context and return to the selected graph node', () => {
  const selected = applicationStateReducer(createApplicationState(), {
    type: 'concept-selected',
    conceptId: 'platform-types'
  });
  const studying = applicationStateReducer(selected, { type: 'lesson-opened' });

  assert.equal(studying.selection.conceptId, 'platform-types');
  assert.equal(studying.selection.panelOpen, false);
  assert.equal(studying.lessonOpen, true);

  const returned = applicationStateReducer(studying, { type: 'lesson-closed' });
  assert.equal(returned.selection.panelOpen, false);
  assert.equal(returned.lessonOpen, false);
});
