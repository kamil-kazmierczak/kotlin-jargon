const endpointId = (endpoint) => typeof endpoint === 'object' ? endpoint.id : endpoint;

export const getGraphVisibleIds = (nodes, links, assessments, filters, temporaryReveal) => {
  if (temporaryReveal?.conceptId) {
    const conceptId = temporaryReveal.conceptId;
    const visibleIds = new Set([conceptId]);
    for (const link of links) {
      const sourceId = endpointId(link.source);
      const targetId = endpointId(link.target);
      if (sourceId === conceptId) visibleIds.add(targetId);
      if (targetId === conceptId) visibleIds.add(sourceId);
    }
    return visibleIds;
  }

  const filteredNodes = nodes.filter((node) => (
    (filters.categoryIds.length === 0 || filters.categoryIds.includes(node.category)) &&
    filters.depths.includes(node.depth)
  ));
  return getProgressVisibleIds(filteredNodes, links, assessments, filters.assessmentStatuses || []);
};

// selectedNodeId represents a concept with open details; activeId may instead be a hovered node.
export const getLinkEmphasis = (link, { visibleIds, selectedNodeId, activeId, searchMatchedIds }) => {
  const sourceId = endpointId(link.source);
  const targetId = endpointId(link.target);
  if (!visibleIds.has(sourceId) || !visibleIds.has(targetId)) return 'hidden';
  if (link.type === 'related' && sourceId !== selectedNodeId && targetId !== selectedNodeId) return 'hidden';
  if (searchMatchedIds && (!searchMatchedIds.has(sourceId) || !searchMatchedIds.has(targetId))) return 'dimmed';
  if (!activeId) return 'default';
  return sourceId === activeId || targetId === activeId ? 'highlighted' : 'dimmed';
};

export const getProgressVisibleIds = (nodes, links, assessments, selectedStatuses) => {
  if (selectedStatuses.length === 0) return new Set(nodes.map(({ id }) => id));

  const visibleIds = new Set(nodes.filter(({ id }) => {
    const status = assessments[id]?.status || 'not-assessed';
    return selectedStatuses.includes(status);
  }).map(({ id }) => id));

  let addedPrerequisite = true;
  while (addedPrerequisite) {
    addedPrerequisite = false;
    for (const link of links) {
      if (link.type !== 'prerequisite') continue;
      const sourceId = endpointId(link.source);
      const targetId = endpointId(link.target);
      if (visibleIds.has(targetId) && !visibleIds.has(sourceId)) {
        visibleIds.add(sourceId);
        addedPrerequisite = true;
      }
    }
  }

  return visibleIds;
};
