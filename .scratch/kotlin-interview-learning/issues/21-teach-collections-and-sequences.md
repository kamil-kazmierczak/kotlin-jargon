# 21: Teach collections and sequences

**What to build:** Publish a complete collections group that lets a backend developer reason about read-only versus mutable APIs, eager versus lazy work, transformations, grouping, and performance rather than selecting operations by surface syntax alone.

**Blocked by:** 20: Teach Kotlin domain modeling

**Status:** ready-for-agent

- [ ] The group covers read-only and mutable collection interfaces, common transformations, copying and aliasing, grouping, sequences, eager/lazy execution, and performance trade-offs.
- [ ] Lessons clearly distinguish read-only views from deep immutability and sequence laziness from automatic performance improvement.
- [ ] Java comparisons use familiar collection and stream behavior where it prevents incorrect transfer of assumptions.
- [ ] Verified examples exercise evaluation order, mutation visibility, terminal operations, allocation or traversal claims that can be tested deterministically, and common mistakes.
- [ ] Concepts carry justified depth and graph relationships rather than expanding into a node for every library function.
- [ ] Focused interview questions require predicting behavior or selecting a collection/sequence design under stated constraints.
- [ ] The group-ending scenario requires choosing mutable or read-only and eager or lazy operations based on semantics and cost.
- [ ] A human reviewer approves pedagogy, sources, interview realism, and performance wording before concepts become verified.
- [ ] The complete group is navigable, searchable, assessable, progress-aware, and green under the release command.
