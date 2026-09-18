# 08: Stabilize the desktop application seam

**What to build:** Preserve the current graph, search, stable-link, and desktop concept-panel behavior behind a dependable application-state boundary, remove the obsolete mobile-only experience, and provide one command that builds the production app and exercises its externally visible behavior. This is the prefactoring step that lets later Kotlin content and lesson states evolve without continuing to concentrate all navigation behavior in the application shell and canvas.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] One documented top-level verification command builds the production application and runs its desktop browser acceptance suite.
- [ ] A clean root visit, direct concept URL, graph selection, concept closing, and search selection retain their current desktop behavior.
- [ ] Browser acceptance tests use learner-visible roles, names, and behavior instead of component structure or CSS implementation details.
- [ ] Selection and graph-view state have an explicit application-facing contract capable of capturing and restoring selected concept, camera, filters, and study-path overlay as those fields are introduced.
- [ ] Graph rendering does not own lesson or progress state, and the application shell does not need graph-geometry internals to coordinate navigation.
- [ ] The mobile bottom-sheet behavior and its acceptance test are removed; no replacement mobile layout is introduced.
- [ ] The application remains statically buildable and deployable after the prefactor.
- [ ] The unified verification command is green before Kotlin-specific behavior is added.
