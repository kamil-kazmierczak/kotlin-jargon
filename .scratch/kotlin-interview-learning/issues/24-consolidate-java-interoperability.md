# 24: Consolidate Java interoperability

**What to build:** Publish a complete Java-interoperability group that consolidates cross-cutting boundary knowledge into deliberate Kotlin-to-Java and Java-to-Kotlin API design for senior backend work.

**Blocked by:** 23: Teach generics and abstraction

**Status:** ready-for-agent

- [ ] The group covers platform types, nullability annotations, SAM conversion, properties, checked exceptions, wildcards, static exposure, default arguments, and Kotlin/Java API boundaries.
- [ ] Existing Platform types content is referenced and extended rather than duplicated.
- [ ] Kotlin 2.4 nullability, Jakarta annotation, Java sealed-class, and annotation-target behavior is explicitly labeled where relevant.
- [ ] Mixed Java/Kotlin verification fixtures compile and, where deterministic, run both consumption directions.
- [ ] Lessons distinguish convenient Kotlin syntax from the API surface and metadata visible to Java, reflection, and annotation processors.
- [ ] Graph relationships consolidate interop concepts already encountered across earlier groups while preserving their primary categories.
- [ ] Focused questions and the group scenario require exposing a predictable Kotlin API to Java and safely consuming a Java API from Kotlin.
- [ ] A human reviewer approves pedagogy, primary sources, interview realism, and version wording before concepts become verified.
- [ ] The complete group is navigable, searchable, assessable, progress-aware, and green under the release command.
