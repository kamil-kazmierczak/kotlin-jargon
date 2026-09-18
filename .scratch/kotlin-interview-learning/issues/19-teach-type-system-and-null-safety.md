# 19: Teach the Kotlin type system and null safety

**What to build:** Publish a complete type-system group that lets a Java developer reason accurately about Kotlin nullability, top and bottom types, smart casts, and uncertain Java boundaries instead of hiding them behind unsafe assertions.

**Blocked by:** 18: Teach Kotlin execution and core semantics

**Status:** ready-for-agent

- [ ] The group covers nullable types, smart casts, `Unit`, `Nothing`, `Any`, platform types, safe calls, Elvis handling, explicit checks, and justified uses or avoidance of `!!`.
- [ ] The existing Platform types tracer lesson is integrated into the group without duplicating identity or content.
- [ ] Kotlin 2.4 changes affecting Java nullability, flexible types, sealed Java hierarchies, and annotation behavior are labeled where they affect a claim.
- [ ] Prerequisite and related edges distinguish language-type knowledge from Java-interoperability association.
- [ ] Verified examples cover safe and unsafe nullable behavior, smart-cast limits, Java platform boundaries, runtime failure, and safer boundary normalization.
- [ ] Each substantial concept includes decision guidance and a reasoning-focused interview question with a reviewed rubric.
- [ ] The group-ending scenario requires the learner to make a nullable or platform-typed boundary safe without masking uncertainty.
- [ ] A human reviewer approves pedagogy, sources, interview realism, and version wording before concepts become verified.
- [ ] The complete group is navigable, searchable, assessable, progress-aware, and green under the release command.
