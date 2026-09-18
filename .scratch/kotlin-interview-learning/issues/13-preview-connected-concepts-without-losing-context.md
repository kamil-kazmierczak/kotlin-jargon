# 13: Preview connected concepts without losing context

**What to build:** Let a learner inspect a prerequisite or related concept from inside a Focused Lesson, deliberately choose whether to study it, and return to the exact lesson or graph context they came from.

**Blocked by:** 11: Study Platform types in a Focused Lesson; 12: Navigate the typed Kotlin concept graph

**Status:** ready-for-agent

- [ ] Following a prerequisite or related-concept link from a Focused Lesson opens a narrower Concept Preview above the still-visible lesson.
- [ ] The preview explains the linked concept and names whether the relationship is prerequisite or related.
- [ ] Previewing never silently replaces the current lesson.
- [ ] The learner can explicitly return to the current lesson without losing its reading position.
- [ ] Choosing to study the previewed concept replaces the lesson and retains a short session-local trail back to the origin.
- [ ] Closing a Focused Lesson restores the exact selected graph node, camera position, filters, and study-path overlay captured on entry.
- [ ] Search-result temporary reveal state also survives a lesson round trip and can still return to its earlier graph view.
- [ ] Browser history, stable concept URLs, Escape behavior, and visible navigation controls agree rather than creating contradictory destinations.
- [ ] Desktop acceptance tests exercise preview, return, study-previewed-concept, trail-back, and exact graph restoration behavior.
