---
id: jvm-execution
title: Kotlin JVM execution
profile: substantial
category: execution-semantics
depth: core
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
publishedAt: 2026-09-21
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-21
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-21
reviewReference: commit:a0e7569ad7d902e1ecaae7f6cfa3aa6cf5e6181e
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: []
relatedIds: [functions, visibility]
aliases: [bytecode, file facade, JVM target, top-level function]
---

## Overview

Kotlin/JVM compiles Kotlin source into JVM class files. Java callers use the generated class and method API, which does not always resemble the Kotlin spelling.

## Why it matters to Java developers

You already know the JVM. The new work is tracing a Kotlin declaration to the API your Java code, reflection tools, and deployed runtime actually see.

## Mental model

Separate three questions: what the language permits, which JVM API the compiler emits, and which runtime libraries execution needs. A source-level convenience can disappear into ordinary methods and calls.

## Semantics

The language/API version controls accepted Kotlin features and library APIs; the JVM target controls emitted bytecode compatibility. Neither setting alone proves that every referenced JDK API exists on the deployment runtime. This curriculum compiles with JDK 25 and targets JVM 21; deployments on 21 still need API compatibility checks.

A top-level function in `Totals.kt` normally becomes a static method on `TotalsKt`. A class remains a class, and a public ordinary property exposes accessors. Kotlin's standard library is a runtime dependency when generated code uses it; compiling a Java caller successfully is not a packaging check.

## Example

The Java caller below exercises the generated facade and property getter together. Both sources belong to one verified example.

```kotlin run id=core-jvm-api file=Totals.kt main=TotalsClient expected=7
class Total(val amount: Int)
fun add(left: Int, right: Int): Total = Total(left + right)
```

```java run id=core-jvm-api file=TotalsClient.java main=TotalsClient expected=7
public final class TotalsClient {
    public static void main(String[] args) {
        System.out.println(TotalsKt.add(3, 4).getAmount()); // 7
    }
}
```

This asserts callable JVM behavior, not an exact instruction listing. Renaming the file changes the default facade name; `@file:JvmName` can make that name deliberate.

## Java comparison

A top-level Kotlin function needs no handwritten utility class, but Java still calls a class method. A Kotlin property is not automatically a Java public field.

## Common mistakes

Treating the compiler JDK, bytecode target, and minimum supported runtime as interchangeable; shipping class files without required runtime dependencies; accidentally breaking Java callers by renaming a file facade.

## Decision guidance

For a Java-facing library, test actual Java compilation and runtime invocation. Stabilize facade names when they form a public API. Keep exact synthetic method names out of source-level contracts unless explicitly testing a compiler-specific artifact.

## Knowledge check

Would a successful compilation targeting JVM 21 prove that a call to a JDK 25-only API runs on JDK 21? Explain the missing check. Answer: no; class-file compatibility does not supply absent library APIs.

## Connections

This opens the curated path because generated behavior recurs in [properties](#declarations-properties), [functions](#functions), and [visibility](#visibility). No Kotlin prerequisites are assumed.

## Interview question

A Java client breaks after `Totals.kt` is renamed, although the Kotlin function signature did not change. Diagnose the break and propose a compatibility plan that also accounts for runtime dependencies.

## Essential points

- Identify the Java-visible file facade and its static method.
- Explain why source-level Kotlin compatibility does not establish JVM binary compatibility.
- Preserve the old entry point or retain its name with a file annotation, then compile and run a Java consumer.

## Trade-offs

An explicit facade stabilizes Java usage but becomes another API commitment. A compatibility forwarding method adds maintenance but supports already compiled clients.

## Common traps

Assuming Java calls the bare Kotlin function name, or that the bytecode target packages the Kotlin standard library.

## Follow-up probes

How would you distinguish a missing facade from a missing runtime library in a failure report? Which deployment checks remain after compilation?

## Sources

- [Kotlin documentation: Calling Kotlin from Java](https://kotlinlang.org/docs/java-to-kotlin-interop.html)
- [Kotlin documentation: Compiler options](https://kotlinlang.org/docs/compiler-reference.html)
- [Kotlin documentation: Gradle compiler options](https://kotlinlang.org/docs/gradle-compiler-options.html)
