# 25: Teach coroutine foundations

**What to build:** Publish a complete coroutine-foundations group that teaches ownership, suspension, context, cancellation, and failure as structured runtime behavior rather than a collection of asynchronous helper calls.

**Blocked by:** 24: Consolidate Java interoperability

**Status:** ready-for-agent

- [ ] The group covers suspension, coroutine builders, structured concurrency, scopes, jobs, contexts, dispatchers, cancellation, and exception propagation.
- [ ] Lessons distinguish suspending from blocking and explain ownership and lifetime before presenting convenience APIs.
- [ ] Java comparisons use threads, executors, and futures selectively to expose differences rather than claim direct equivalence.
- [ ] Examples compile and run with kotlinx.coroutines 1.11.0 and avoid deprecated dispatcher-key, old test-API, and direct-Job builder idioms.
- [ ] Deterministic verification exercises cancellation, parent/child relationships, context or dispatcher behavior, and exception propagation without timing-fragile assertions.
- [ ] Deep Dives hold implementation-sensitive scheduler or continuation detail without hiding the core structured-concurrency argument.
- [ ] Focused questions and the group scenario require tracing ownership, dispatcher use, cancellation, and exceptions through a coroutine tree.
- [ ] A human reviewer approves pedagogy, official sources, interview realism, and implementation-detail wording before concepts become verified.
- [ ] The complete group is navigable, searchable, assessable, progress-aware, and green under the release command.
