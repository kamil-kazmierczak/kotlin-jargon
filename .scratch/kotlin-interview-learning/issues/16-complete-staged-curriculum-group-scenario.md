# 16: Complete a staged curriculum-group scenario

**What to build:** Let a learner work through a representative multi-concept backend scenario one decision at a time, reveal focused feedback, review a final debrief, and independently record whether they are ready at the curriculum-group level.

**Blocked by:** 15: Keep and transport learning progress

**Status:** ready-for-agent

- [ ] A representative Java-developer foundation group has a staged scenario that combines several of its concepts.
- [ ] Each stage asks for a prediction, diagnosis, or design choice before its feedback can be revealed.
- [ ] Revealing one stage introduces or prepares the next constraint without exposing all later feedback at once.
- [ ] The final debrief connects decisions across concepts, explains trade-offs, and presents a group-level reasoning rubric.
- [ ] The learner can explicitly set the group to Needs review or Scenario-ready; untouched groups remain Not attempted.
- [ ] Group readiness is independent of concept assessments and is never computed as an average or completion percentage.
- [ ] A compact group summary shows concept-state distribution beside the independent scenario state.
- [ ] Group state and its latest assessment date persist, export, import, and reset through the versioned progress model.
- [ ] Scenario scratch work and per-stage reveal state remain ephemeral.
- [ ] Desktop acceptance tests cover staged disclosure, final debrief, independent group assessment, persistence, and summary behavior.
