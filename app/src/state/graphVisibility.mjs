const endpointId = (endpoint) => typeof endpoint === 'object' ? endpoint.id : endpoint;

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
