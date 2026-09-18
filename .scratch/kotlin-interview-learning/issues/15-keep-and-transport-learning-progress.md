# 15: Keep and transport learning progress

**What to build:** Keep learner-owned assessments privately in the browser, surface them subtly on the graph, and let the learner filter, back up, restore, or reset progress without introducing accounts or distorting concept relationships.

**Blocked by:** 12: Navigate the typed Kotlin concept graph; 14: Practise and assess Platform types

**Status:** ready-for-agent

- [ ] Concept assessment state and latest assessment date persist across browser reloads.
- [ ] Graph nodes display subtle, distinguishable markers for Not assessed, Needs review, Can explain, and Interview-ready.
- [ ] A progress filter can focus on assessment states without hiding prerequisites, altering edge meaning, or changing the curated study path.
- [ ] Progress export produces documented, versioned JSON containing only supported durable learner state.
- [ ] A valid import replaces current progress only after full validation.
- [ ] Malformed, unsupported-version, unknown-concept, and invalid-state imports are rejected without changing existing progress.
- [ ] The learner can deliberately reset all progress through a confirmation step.
- [ ] Scratch answers, reveal state, detailed rubric checklists, assessment history, theme preference, and graph camera are not included as progress evidence.
- [ ] No account, network synchronization, score, percentage, streak, badge, point system, confetti, or certification language is introduced.
- [ ] Desktop acceptance tests cover persistence, state filtering, export, valid import, failed import without data loss, and reset.
