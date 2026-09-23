---
id: java-annotation-boundaries
title: Annotation targets and Java sealed boundaries
profile: substantial
category: java-interoperability
depth: deep-dive
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
publishedAt: 2026-09-23
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-23
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-23
reviewReference: commit:ee28019
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [java-generic-signatures, closed-domain-models]
relatedIds: [java-nullability-contracts, declarations-properties, jvm-execution]
aliases: [annotation use-site target, Java sealed class, reflection metadata]
---

## Overview

Frameworks inspect Java fields, getters, parameters, and type-use annotations, not just Kotlin source [properties](#declarations-properties). [Java sealed hierarchies](#closed-domain-models) also enter Kotlin with the semantics of the actual Java declaration. Both boundaries require version-aware review of source and generated metadata.

## Why it matters to Java developers

A validation annotation on the wrong JVM element can silently miss the scanner. A Java sealed class can be non-abstract and directly instantiated; assuming only its permitted subclasses exist makes a Kotlin `when` incomplete.

## Mental model

For annotations, ask which Java element the framework scans, then place and inspect the annotation there. For Java sealed types, ask whether the sealed base itself can be a runtime value, then make the Kotlin branch structure cover that possibility.

## Semantics

Use `@get:`, `@field:`, or `@param:` to target a generated Java getter, backing field, or constructor parameter explicitly. A Kotlin `@property:` annotation is invisible to ordinary Java reflection. Under Kotlin 2.4, the newer default use-site target rules and `@all:` propagation are stable; an unqualified annotation can land on more than one applicable element. Do not infer a processor's view from the Kotlin source line: inspect the compiled artifact. Kotlin 2.4 also enforces exhaustive `when` more strictly for a non-abstract Java sealed class: include a base-class branch or `else` because the base can be instantiated. This differs from an abstract sealed base.

## Example

The Java client uses reflection to confirm a getter-targeted marker and verifies the field lacks it. That is the distinction a getter-scanning processor cares about.

```kotlin run id=interop-annotation-target file=AnnotatedOrder.kt main=AnnotationClient expected=true:false
@Target(AnnotationTarget.PROPERTY_GETTER, AnnotationTarget.FIELD)
@Retention(AnnotationRetention.RUNTIME)
annotation class Readable

class AnnotatedOrder(@get:Readable val id: String)
```

```java run id=interop-annotation-target file=AnnotationClient.java main=AnnotationClient expected=true:false
public final class AnnotationClient {
    public static void main(String[] args) throws Exception {
        boolean getter = AnnotatedOrder.class.getMethod("getId").isAnnotationPresent(Readable.class);
        boolean field = AnnotatedOrder.class.getDeclaredField("id").isAnnotationPresent(Readable.class);
        System.out.println(getter + ":" + field); // true:false
    }
}
```

A non-abstract Java sealed base is itself a valid case. The Kotlin `else` covers it and any future permitted branch that reaches this source boundary.

```java run id=interop-java-sealed file=JavaOutcome.java order=java-first main=SealedConsumerKt expected=base:done
public sealed class JavaOutcome permits Done {
    public String label() { return "base"; }
}

final class Done extends JavaOutcome {
    @Override public String label() { return "done"; }
}
```

```kotlin run id=interop-java-sealed file=SealedConsumer.kt order=java-first main=SealedConsumerKt expected=base:done
fun label(outcome: JavaOutcome): String = when (outcome) {
    is Done -> outcome.label()
    else -> outcome.label() // includes an instance of JavaOutcome itself
}

fun main() = println("${label(JavaOutcome())}:${label(Done())}") // base:done
```

## Java comparison

Java reflection inspects concrete runtime elements and retention; Kotlin metadata can carry additional property information that an ordinary Java scanner does not read. Java's sealed `permits` list constrains direct subclasses, not direct instantiation of a concrete base.

## Common mistakes

Putting a validation annotation on `@property:` when a framework scans fields; assuming an unqualified annotation always chooses the same target across compiler versions; or treating a concrete Java sealed base like an abstract Kotlin sealed hierarchy.

## Decision guidance

Choose explicit use-site targets for public framework boundaries. Use `@all:` only when propagation to its supported elements is truly intended, and check the Kotlin 2.4 target rules plus compiled placement. For Java sealed types, handle the base instance and compile the consuming Kotlin `when` against the exact Java API.

## Knowledge check

Will a Java call to `getDeclaredField("id").isAnnotationPresent(Readable.class)` find `@get:Readable`? No. The annotation is on the getter method.

## Connections

[Declarations and properties](#declarations-properties) explains generated accessors; [closed domain models](#closed-domain-models) explains sealed modeling; [Java nullability contracts](#java-nullability-contracts) adds type-use and version-sensitive annotations.

## Interview question

A framework stopped validating a Kotlin constructor property after an upgrade, and a Kotlin `when` over a Java sealed class now needs another branch. Diagnose both problems without assuming the source declarations tell the whole story.

## Essential points

- Java tools inspect JVM elements; use-site targets and retention determine visibility.
- Kotlin 2.4 stabilizes newer annotation target defaults and `@all:` behavior.
- A non-abstract Java sealed base can be instantiated, so `when` must cover it.

## Trade-offs

Explicit targets are verbose but make framework contracts clear. `@all:` reduces repetition when broad propagation is intentional. A fallback branch protects a Java sealed boundary but may need monitoring if new subclasses require distinct behavior.

## Common traps

Equating Kotlin property annotations with Java field annotations, or calling `else` unnecessary simply because a Java class is sealed.

## Follow-up probes

How would you inspect retention in a built JAR? When would `@param:` matter more than `@field:`? How does an abstract Java sealed base change the set of possible runtime values?

## Sources

- [Kotlin documentation: Annotations and use-site targets](https://kotlinlang.org/docs/annotations.html#annotation-use-site-targets)
- [Kotlin 2.4 compatibility guide](https://kotlinlang.org/docs/compatibility-guide-24.html)
- [Kotlin documentation: Sealed classes](https://kotlinlang.org/docs/sealed-classes.html)
