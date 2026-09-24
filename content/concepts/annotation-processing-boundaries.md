---
id: annotation-processing-boundaries
title: Annotation design for framework consumers
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
prerequisiteIds: [java-annotation-boundaries, runtime-reflection]
relatedIds: [java-nullability-contracts, type-safe-dsls]
aliases: [annotation retention, annotation target, runtime scanner, metadata processor]
---

## Overview

An annotation is useful only when it is placed where its consumer looks and retained for the phase when that consumer runs. Framework behavior is a consumer contract, not a property of the source spelling alone.

## Why it matters to Java developers

Java frameworks commonly scan methods, fields, or parameters. A Kotlin property can generate several JVM elements, so annotation placement must be deliberate.

## Mental model

Name the scanner first, then choose target and retention. Inspect the compiled JVM element with a Java consumer test.

## Semantics

`@Target` limits valid Kotlin declarations; `@Retention(RUNTIME)` makes an annotation available to runtime reflection. `SOURCE` and `BINARY` serve different processing stages. Use `@get:` or `@field:` when a property annotation must appear on a particular JVM element. Kotlin 2.4 stabilizes changed default use-site targeting and `@all:` propagation, so an unqualified annotation's placement deserves migration review. Kotlin 2.4 also writes annotations to Kotlin metadata by default on JVM; metadata readers and Java reflection consume different representations. The language specification describes targets and retention, while the framework's documented scanner determines what it will use.

## Example

The Java consumer verifies the exact method the hypothetical framework scans.

```kotlin run id=advanced-annotation file=Route.kt main=RouteClient expected=orders
@Target(AnnotationTarget.PROPERTY_GETTER)
@Retention(AnnotationRetention.RUNTIME)
annotation class RouteName(val value: String)

class Route(@get:RouteName("orders") val path: String)
```

```java run id=advanced-annotation file=RouteClient.java main=RouteClient expected=orders
public final class RouteClient {
    public static void main(String[] args) throws Exception {
        RouteName name = Route.class.getMethod("getPath").getAnnotation(RouteName.class);
        System.out.println(name.value()); // orders
    }
}
```

## Java comparison

An annotation written on a Java method is already on the method. A Kotlin constructor property may create a parameter, field, getter, and Kotlin metadata entry; Java reflection does not interpret the source-level property as one element.

## Common mistakes

Relying on an unqualified target after a compiler upgrade, using binary retention for a runtime scanner, or adding a marker that no framework actually reads.

## Decision guidance

Prefer explicit use-site targets at Java-facing boundaries. Match retention to the actual consumer, and verify compiled placement. Use metadata processing only if the tool explicitly supports Kotlin metadata and its version.

## Knowledge check

Will a getter scanner find an annotation placed only with `@field:`? No. It scans a different JVM element.

## Connections

[Java annotation boundaries](#java-annotation-boundaries) cover Kotlin 2.4 target rules in depth; [reflection](#runtime-reflection) explains runtime inspection; [Java nullability contracts](#java-nullability-contracts) show why annotation semantics depend on consumers.

## Interview question

A Java framework stops seeing a Kotlin property annotation after an upgrade. What evidence distinguishes target placement, retention, and framework interpretation?

## Essential points

- Identify the exact scanner element and processing phase.
- Use explicit use-site targets and appropriate retention.
- Separate Kotlin metadata from JVM reflection and compiler behavior from framework contracts.

## Trade-offs

Annotations keep call sites terse, but hide behavior in processors and can bind source to a framework. An explicit registration function is easier to trace when the number of registrations is small.

## Common traps

Assuming `RUNTIME` implies every scanner can see an annotation, or treating the Kotlin 2.4 default target mapping as a timeless guarantee.

## Follow-up probes

When would `BINARY` retention suffice? How would `@param:` differ from `@get:`? What does a metadata-only processor see?

## Sources

- [Kotlin documentation: Annotations](https://kotlinlang.org/docs/annotations.html)
- [Kotlin 2.4 release notes](https://kotlinlang.org/docs/whatsnew24.html)
- [Kotlin language specification: Annotations](https://kotlinlang.org/spec/annotations.html)
