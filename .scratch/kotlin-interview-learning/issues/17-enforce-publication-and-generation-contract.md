# 17: Enforce the publication and generation contract

**What to build:** Make the authored curriculum auditable and reproducible: only human-approved verified concepts reach production, structural and provenance errors fail one command, and every generated representation can be recreated deterministically from canonical sources.

**Blocked by:** 09: Publish the first structured Kotlin concept; 10: Verify Kotlin/JVM teaching examples

**Status:** ready-for-agent

- [ ] Concept publication states are draft, review-ready, and verified, with invalid transitions or values rejected.
- [ ] Only verified concepts enter production graph, search, study-path, lesson, and export data; drafts can be exposed only through an explicitly separate preview mode.
- [ ] Verification requires official correctness sources, teaching baseline, last-verification date, valid profile sections, and working internal links.
- [ ] Human publication review records confirmation of pedagogical clarity, authoritative support, interview realism, and guarantee-versus-implementation wording before a concept becomes verified.
- [ ] AI-authored material cannot mark itself verified without that human confirmation.
- [ ] Structural validation rejects duplicate or unknown IDs, invalid categories, dangling relationships, prerequisite cycles, missing path entries, broken links, missing provenance, and invalid lesson profiles.
- [ ] Repeated generation from identical sources produces byte-stable application data, graph data, search indexes, and LLM-oriented exports.
- [ ] Generated representations are not accepted as independently edited canonical inputs.
- [ ] The top-level verification command runs structural validation, example verification, deterministic generation, application build, and desktop smoke tests locally and in CI.
- [ ] Baseline-upgrade metadata and checks make dependency advancement deliberate rather than an incidental resolution change.
