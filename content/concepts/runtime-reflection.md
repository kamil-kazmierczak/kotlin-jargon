---
id: runtime-reflection
title: Runtime reflection at dynamic boundaries
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
reviewReference: commit:3d9b168bf1b92909c911083b92def0083b878afa
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [jvm-execution, java-callable-surface]
relatedIds: [annotation-processing-boundaries, generic-runtime-types]
aliases: [KClass, kotlin-reflect, Java reflection, memberProperties]
---

## Overview

Reflection inspects declarations at runtime. It earns its cost when a plugin, framework, or schema is discovered dynamically; a direct call is clearer when the target is already known.

## Why it matters to Java developers

Kotlin's `KClass` and Java's `Class` expose related but different views. Framework integration often needs to choose the view the framework actually consumes.

## Mental model

Decide which boundary is dynamic. Validate a discovered member once and then use a typed adapter. Reflection cannot recover source information that was not retained in a runtime-readable form.

## Semantics

`Foo::class` produces a `KClass`; `.java` obtains the JVM `Class`. Rich Kotlin member inspection on JVM is a documented `kotlin-reflect` library facility, so the pinned example includes `org.jetbrains.kotlin:kotlin-reflect:2.4.20` and runs on the pinned JDK 25. Java reflection sees JVM methods and fields. Neither API guarantees a stable iteration order for members; sort names when output order matters. Reflection can fail because a member is absent, inaccessible, or has an unexpected signature. Those are runtime validation failures, not specification guarantees about a particular compiler's generated member order.

## Example

The fixture sorts names before printing, so it does not depend on incidental reflection iteration order.

```kotlin run id=advanced-reflection file=Reflection.kt main=ReflectionKt expected=id,name
import kotlin.reflect.full.memberProperties

data class Plugin(val id: Int, val name: String)

fun main() {
    val names = Plugin::class.memberProperties.map { it.name }.sorted()
    println(names.joinToString(",")) // id,name
}
```

## Java comparison

`Plugin::class.java.declaredFields` inspects JVM fields, while `memberProperties` describes Kotlin properties through Kotlin reflection. Generated fields and accessors need not map one-to-one to a Kotlin source declaration.

## Common mistakes

Using reflection in every request for a statically known function, assuming Kotlin property metadata equals a Java field, or testing an arbitrary enumeration order.

## Decision guidance

Use direct calls and typed interfaces for known handlers. If plugin discovery must be dynamic, inspect and validate at startup, report missing members clearly, and measure runtime cost before adding caches. Choose Java or Kotlin reflection according to the consumer's contract.

## Knowledge check

Does `KClass.memberProperties` come from the base Kotlin standard library alone on JVM? No. Rich reflection uses `kotlin-reflect`.

## Connections

[Annotation boundaries](#annotation-processing-boundaries) determine whether metadata is visible to the scanner; [generic runtime types](#generic-runtime-types) limit what runtime inspection can recover; [JVM execution](#jvm-execution) explains generated artifacts.

## Interview question

A server loads plugin class names from configuration and calls a known handler after startup. Where should reflection occur, and what would you test?

## Essential points

- Identify the dynamic discovery boundary and validate its result.
- Distinguish `KClass` from Java `Class` and include `kotlin-reflect` for rich JVM reflection.
- Avoid ordering claims and generated-member assumptions without artifact inspection.

## Trade-offs

Reflection supports extensibility without compile-time references, at the price of runtime failures, dependency size, and slower inspection. Typed interfaces make the steady-state path easier to change safely.

## Common traps

Treating a reflected name or member order as a stable API, or expecting reflection to bypass retention and visibility rules.

## Follow-up probes

How would you report a missing plugin method? When is Java reflection the right view? Which metadata would you inspect during an upgrade?

## Sources

- [Kotlin documentation: Reflection](https://kotlinlang.org/docs/reflection.html)
- [Kotlin Metadata JVM library](https://kotlinlang.org/docs/metadata-jvm.html)
