# 26: Teach asynchronous streams and concurrency

**What to build:** Publish a complete streams-and-concurrency group that lets a backend developer choose among cold flows, hot state/event streams, channels, and synchronization mechanisms based on ownership, delivery, backpressure, and shared-state requirements.

**Blocked by:** 25: Teach coroutine foundations

**Status:** ready-for-agent

- [ ] The group covers Flow, StateFlow, SharedFlow, channels, backpressure, shared state, synchronization, and coroutine testing.
- [ ] Lessons clearly distinguish cold and hot behavior, state and event semantics, buffering, collection lifetime, and cancellation.
- [ ] Decision guidance explains when a flow, hot flow, channel, mutex, confinement strategy, or other synchronization approach fits a backend problem.
- [ ] Examples compile and run against the pinned coroutine baseline with deterministic virtual-time or synchronization techniques where needed.
- [ ] Tests avoid deprecated coroutine-test APIs and timing sleeps that make authored claims flaky.
- [ ] Graph prerequisites connect streams and concurrency to coroutine ownership plus relevant collections and type-system concepts.
- [ ] Focused questions and the group scenario require selecting mechanisms and defending delivery, backpressure, and shared-state trade-offs.
- [ ] A human reviewer approves pedagogy, official sources, interview realism, and concurrency claims before concepts become verified.
- [ ] The complete group is navigable, searchable, assessable, progress-aware, and green under the release command.
