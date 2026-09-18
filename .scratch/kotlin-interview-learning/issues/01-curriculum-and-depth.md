# Define the Kotlin curriculum and evidence of understanding

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Assignee: Codex
Parent: [Plan a Kotlin interview learning app for an experienced Java developer](../map.md)
Blocked by: none

## Question

Which concept groups belong in the initial Kotlin curriculum, how should they be sequenced for someone with six years of Java and six months of Kotlin experience, and what should the learner be able to explain or reason through to demonstrate deep understanding of each group?

Cover the agreed language, standard-library, Java-interoperability, and coroutine scope. Establish coverage boundaries, prerequisite knowledge, and a useful first portion of the curriculum. Clarify content language and the role of senior-interview scenarios with the learner. Preserve the approved concept structure without writing the full lessons or question bank in this ticket.

## Answer

The initial curriculum is an English-language Kotlin/JVM curriculum for an experienced Java developer. It assumes working knowledge of Java, JVM execution, Java generics, exceptions, collections, threads, futures, and ordinary Gradle usage. Kotlin lessons may give compact Java refreshers where a comparison is needed, but Java is not taught as a parallel curriculum.

### Curriculum and sequence

The main study path is:

1. **Kotlin execution and core semantics**: JVM compilation, declarations, expressions, functions, classes, constructors, visibility, equality, and initialization.
2. **Type system and null safety**: nullable types, smart casts, `Unit`, `Nothing`, `Any`, platform types, and safe handling patterns.
3. **Domain modeling**: data classes, sealed hierarchies, enums, objects, companion objects, value classes, delegation, and immutability.
4. **Collections and sequences**: read-only and mutable collections, transformations, eager and lazy work, sequences, grouping, and performance.
5. **Functions and Kotlin idioms**: lambdas, higher-order and extension functions, scope functions, receivers, inline functions, and reified types.
6. **Generics and abstraction**: declaration-site variance, use-site projections, star projections, type erasure, and API design.
7. **Java interoperability consolidation**: platform types, annotations, SAM conversion, properties, checked exceptions, wildcards, static exposure, default arguments, and Kotlin/Java API boundaries.
8. **Coroutine foundations**: suspension, builders, structured concurrency, scopes, jobs, contexts, dispatchers, cancellation, and exceptions.
9. **Concurrent and asynchronous streams**: `Flow`, `StateFlow`, `SharedFlow`, channels, backpressure, shared state, synchronization, and testing.
10. **Advanced and version-sensitive Kotlin**: contracts, reflection, annotations, DSL construction, and newer language features selected for the Kotlin version adopted later.

Java comparisons and interoperability warnings appear throughout the path. The dedicated interoperability group consolidates them into reasoning about API-boundary design.

Elementary syntax remains available as concise, searchable foundation nodes. It stays off the main path unless another concept depends on it. The first authored portion should be a coherent Java-developer foundation covering execution and semantic differences, null safety and platform types, domain modeling, collections and mutability, and a small Java-interoperability scenario connecting them. This slice should validate the content and graph model before coroutine material is authored.

### Depth and evidence

A substantial concept counts as understood when the learner can explain its purpose and semantics, predict behavior from a short example, compare it with the nearest Java mechanism, decide when to use or avoid it, diagnose a common mistake, and reason through a senior-level interview scenario. Small library conveniences can receive lighter treatment.

Each curriculum group ends with a scenario that tests combined reasoning:

- core semantics: predict initialization, equality, control-flow, and generated JVM behavior;
- type system: make a nullable or platform-typed boundary safe without hiding uncertainty behind `!!`;
- domain modeling: choose among data classes, sealed types, enums, value classes, objects, and ordinary classes;
- functions and idioms: design a readable higher-order or extension API and explain inlining and receiver behavior;
- collections and sequences: choose mutable or read-only and eager or lazy operations based on semantics and cost;
- generics: design a type-safe variant API and explain projections and erased types;
- Java interoperability: expose a predictable Kotlin API to Java and safely consume a Java API from Kotlin;
- coroutine foundations: trace ownership, dispatcher use, cancellation, and exception propagation through a coroutine tree;
- asynchronous streams and concurrency: select among flows, channels, and synchronization mechanisms for a backend problem;
- advanced material: explain when a specialized feature earns its complexity and identify its version constraints.

Every concept includes one focused interview question. Group-ending scenarios exercise several concepts together.

### Coverage rules and terminology

Curriculum material has three levels:

- **Core**: expected knowledge for a senior Kotlin backend candidate and emphasized by the study path.
- **Deep dive**: material needed for accurate reasoning about runtime behavior, performance, or API design.
- **Reference**: useful but uncommon or version-sensitive material kept searchable without burdening the main path.

A topic earns its own graph node when it has distinct semantics, presents a meaningful design choice, has a runtime or performance consequence, differs significantly from Java, or causes a recurring interview misconception. Convenience functions without those properties are grouped into lessons or reference tables rather than expanded into an encyclopedic standard-library graph.

The JVM and tooling details needed to explain Kotlin behavior are in scope, including generated API shape, nullability annotations, routine Gradle context, and coroutine runtime behavior. Android, Kotlin Multiplatform, frameworks, and general JVM fundamentals already familiar from Java remain outside this curriculum.
