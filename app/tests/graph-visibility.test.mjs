import test from 'node:test';
import assert from 'node:assert/strict';
import { getGraphVisibleIds, getLinkEmphasis } from '../src/state/graphVisibility.mjs';

const nodes = [
  { id: 'foundation', category: 'types', depth: 'core' },
  { id: 'boundary', category: 'interop', depth: 'core' },
  { id: 'detail', category: 'interop', depth: 'deep-dive' },
  { id: 'unrelated', category: 'types', depth: 'core' }
];
const links = [
  { source: 'foundation', target: 'boundary', type: 'prerequisite' },
  { source: 'boundary', target: 'detail', type: 'related' }
];
const filters = { categoryIds: [], depths: ['core'], assessmentStatuses: [] };
const visibleIds = new Set(nodes.map(({ id }) => id));

test('category and depth filters define the visible concepts', () => {
  assert.deepEqual([...getGraphVisibleIds(nodes, links, {}, filters)], ['foundation', 'boundary', 'unrelated']);
  assert.deepEqual([...getGraphVisibleIds(nodes, links, {}, { ...filters, categoryIds: ['interop'] })], ['boundary']);
  assert.equal(getGraphVisibleIds(nodes, links, {}, { ...filters, depths: [] }).size, 0);
});

test('assessment filtering retains prerequisite context but excludes unrelated concepts', () => {
  const assessments = { boundary: { status: 'needs-review' } };
  const ids = getGraphVisibleIds(nodes, links, assessments, { ...filters, assessmentStatuses: ['needs-review'] });
  assert.deepEqual([...ids].sort(), ['boundary', 'foundation']);
});

test('temporary reveal uses the direct neighborhood and returning restores filters', () => {
  const restricted = { ...filters, categoryIds: ['types'] };
  const before = getGraphVisibleIds(nodes, links, {}, restricted);
  // The canvas uses object endpoints; the accessible controls use IDs.
  const objectLinks = links.map((link) => ({ ...link,
    source: nodes.find(({ id }) => id === link.source),
    target: nodes.find(({ id }) => id === link.target)
  }));
  for (const relationships of [links, objectLinks]) {
    const revealed = getGraphVisibleIds(nodes, relationships, {}, restricted, { conceptId: 'detail' });
    assert.deepEqual([...revealed].sort(), ['boundary', 'detail']);
    assert.deepEqual(getGraphVisibleIds(nodes, relationships, {}, restricted), before);
  }
});

test('related relationships require open details, not just a hovered concept', () => {
  const related = links[1];
  assert.equal(getLinkEmphasis(related, { visibleIds }), 'hidden');
  assert.equal(getLinkEmphasis(related, { visibleIds, activeId: 'boundary' }), 'hidden');
  assert.equal(getLinkEmphasis(related, { visibleIds, selectedNodeId: 'foundation' }), 'hidden');
  assert.equal(getLinkEmphasis(related, { visibleIds, selectedNodeId: 'boundary', activeId: 'boundary' }), 'highlighted');
});

test('hidden endpoints take precedence over selection, hover and search', () => {
  for (const link of links) {
    for (const hidden of [link.source, link.target]) {
      const state = {
        visibleIds: new Set([...visibleIds].filter((id) => id !== hidden)),
        selectedNodeId: link.source,
        activeId: link.source,
        searchMatchedIds: visibleIds
      };
      assert.equal(getLinkEmphasis(link, state), 'hidden');
    }
  }
});

test('search dimming applies even to a connection in the active neighborhood', () => {
  const prerequisite = links[0];
  assert.equal(getLinkEmphasis(prerequisite, { visibleIds }), 'default');
  assert.equal(getLinkEmphasis(prerequisite, { visibleIds, activeId: 'detail' }), 'dimmed');
  assert.equal(getLinkEmphasis(prerequisite, { visibleIds, activeId: 'foundation' }), 'highlighted');
  assert.equal(getLinkEmphasis(prerequisite, {
    visibleIds, activeId: 'foundation', searchMatchedIds: new Set(['foundation'])
  }), 'dimmed');
  assert.equal(getLinkEmphasis(prerequisite, {
    visibleIds, activeId: 'foundation', searchMatchedIds: new Set(['foundation', 'boundary'])
  }), 'highlighted');
});
