---
id: context-parameters
title: Context parameters and explicit dependencies
profile: substantial
category: advanced-kotlin
depth: deep-dive
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
baseline: kotlin-jvm-2026-09
publishedAt: 2026-09-24
verifiedAt: 2026-09-24
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-24
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [functions, extensions-receivers]
relatedIds: [type-safe-dsls, coroutine-context-dispatchers]
aliases: [context parameters, implicit dependency, Kotlin 2.4 context arguments]
---

## Overview

Context parameters let a Kotlin declaration require a value supplied by the surrounding call context. They can shorten a cluster of related calls, but hide a dependency from the ordinary argument list.

## Why it matters to Java developers

This is more like a lexically supplied dependency than thread-local context. It should not be confused with `CoroutineContext`, which carries coroutine elements such as a Job or dispatcher.

## Mental model

The function still needs a real value. Ask where the nearest suitable value is made available and whether an explicit parameter would be easier to understand.

## Semantics

Named context parameters are stable in Kotlin 2.4.0 and work on the pinned 2.4.20 baseline without an opt-in. A declaration uses `context(name: Type)` and can reference that name in its body. Call-site context is supplied through a scope such as `with(value)`. Context arguments written explicitly at a call site are a separate experimental Kotlin 2.4 feature requiring the `-Xexplicit-context-arguments` compiler option; this lesson's runnable example does not enable it. Kotlin 2.3 consumers cannot compile this 2.4 source syntax as the same stable baseline, so review source and binary boundaries during migration. Do not infer a stable JVM method shape from the source syntax without inspecting compiled output.

## Example

The logger is supplied in the lexical scope of the call.

```kotlin run id=advanced-context file=Context.kt main=ContextKt expected=order:7
interface AuditSink { fun record(message: String) }

context(sink: AuditSink)
fun auditOrder(id: Int) { sink.record("order:$id") }

fun main() {
    val sink = object : AuditSink {
        override fun record(message: String) { println(message) }
    }
    with(sink) { auditOrder(7) } // order:7
}
```

## Java comparison

A Java API usually passes `AuditSink` explicitly or stores it in an object. Expose an explicit Java-facing adapter when Java callers need a stable, readable signature.

## Common mistakes

Calling context parameters thread-local state, conflating them with coroutine context, or presenting experimental explicit context arguments as part of the stable 2.4 feature.

## Decision guidance

Prefer a normal parameter for a single call or a small API. Use a context parameter where many related functions share a dependency and the scope remains obvious. Keep Java-facing APIs explicit and check mixed-version compilation.

## Knowledge check

Is `auditOrder(sink = sink, 7)` the stable call form on this baseline? No. Explicit context arguments are experimental; the example supplies context with `with(sink)`.

## Connections

[Extensions and receivers](#extensions-receivers) explain scoped lookup; [coroutine context](#coroutine-context-dispatchers) is a different mechanism with different lifetime and Job semantics; [DSLs](#type-safe-dsls) also trade explicit arguments for scope.

## Interview question

A team proposes context parameters for request metadata across ten functions. When is that justified, how is the value supplied, and what changes for Java or Kotlin 2.3 consumers?

## Essential points

- Kotlin 2.4 makes context parameters stable, while explicit context arguments remain experimental.
- Explain lexical provision and the hidden dependency trade-off.
- Separate context parameters from CoroutineContext and Java API shape.

## Trade-offs

Repeated dependencies become concise, but callers must inspect scope to discover them. Explicit arguments are noisier and often easier to audit at service boundaries.

## Common traps

Assuming a 2.4 source feature is accepted by 2.3, or relying on a compiler-generated JVM signature as a timeless API contract.

## Follow-up probes

What happens if two equally suitable values are in scope? Why might an explicit constructor dependency be clearer? How would you test a Java-facing adapter?

## Sources

- [Kotlin documentation: Context parameters](https://kotlinlang.org/docs/context-parameters.html)
- [Kotlin 2.4 release notes](https://kotlinlang.org/docs/whatsnew24.html)
