---
id: java-sam-properties
title: Java SAMs and property syntax
profile: substantial
category: java-interoperability
depth: core
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
prerequisiteIds: [java-nullability-contracts, lambdas-higher-order-functions, declarations-properties]
relatedIds: [extensions-receivers, functions]
aliases: [SAM conversion, JavaBean properties, Java getters in Kotlin]
---

## Overview

Kotlin can pass a [lambda](#lambdas-higher-order-functions) where a Java functional interface is expected and can read qualifying JavaBean getters with [property syntax](#declarations-properties). These are call-site conveniences over Java methods; they do not make the underlying API a Kotlin function type or field.

## Why it matters to Java developers

Java frameworks often publish callbacks and getter-based models. Kotlin code can consume them neatly, but API reviews and tests must still reason about the actual Java method signatures and callback behavior.

## Mental model

Translate `directory.name` back to `directory.getName()` and a callback lambda back to an implementation of the Java interface's single abstract method. Then reason about invocation count, thread, errors, and nullability from the Java contract.

## Semantics

SAM conversion applies to Java interfaces with one abstract method, not arbitrary abstract classes. An explicit interface constructor, such as `NameTransform { ... }`, can disambiguate overloads. Kotlin's property syntax for a Java `getName()` calls the getter; a `setName(...)` can supply mutable-looking syntax. A Kotlin `val` normally appears to Java as a getter, not a public field. Java synthetic property access and field access have different reflection and processor implications.

## Example

This mixed fixture compiles Java first and runs the Kotlin caller. The callback runs once and the property access invokes `getName()`.

```java run id=interop-sam-property file=JavaDirectory.java order=java-first main=SamPropertyKt expected=ADA
public final class JavaDirectory {
    public interface NameTransform { String apply(String value); }
    private final String name = "Ada";
    public String getName() { return name; }
    public String map(NameTransform transform) { return transform.apply(getName()); }
}
```

```kotlin run id=interop-sam-property file=SamProperty.kt order=java-first main=SamPropertyKt expected=ADA
fun main() {
    val directory = JavaDirectory()
    check(directory.name == "Ada") // calls getName()
    println(directory.map(JavaDirectory.NameTransform { it.uppercase() })) // ADA
}
```

## Java comparison

Java writes `directory.getName()` and `directory.map(value -> value.toUpperCase())`. Kotlin's property and lambda syntax shortens the call but does not change the Java API owner or its execution contract.

## Common mistakes

Assuming `directory.name` reads a field; using a lambda when overload resolution needs an explicit SAM type; treating a Java SAM as a Kotlin function type in reflection; or ignoring the callback's exception and thread contract.

## Decision guidance

Keep Java callback interfaces when Java clients and frameworks need a named contract. Use a Kotlin `fun interface` for a Kotlin-owned callback intended for Java. Choose a Kotlin function type when Java invocation ergonomics are not a requirement. Test an actual client in each language.

## Knowledge check

If `getName()` increments a counter, does reading `directory.name` increment it? Yes. The Kotlin property syntax calls the Java getter.

## Connections

[Lambdas and higher-order functions](#lambdas-higher-order-functions) explains callback semantics; [declarations and properties](#declarations-properties) covers Kotlin's accessor model. [Callable JVM surface](#java-callable-surface) designs the other direction.

## Interview question

A Java library offers overloaded methods accepting two SAM interfaces, plus `getName()`. Show safe Kotlin consumption and explain the runtime work hidden by the concise syntax.

## Essential points

- Java SAM conversion adapts a lambda to a Java interface, not an abstract class.
- JavaBean property syntax calls Java accessors.
- Kotlin property declarations normally expose Java accessors, not public fields.

## Trade-offs

Concise Kotlin calls aid readability, while explicit SAM construction clarifies overload selection. A named interface adds API stability and documentation at the cost of more declarations.

## Common traps

Claiming a getter is cached, or assuming a Kotlin `val` is a Java field because Kotlin callers use dot syntax.

## Follow-up probes

How would a blocking getter change the design? What if two callbacks have the same lambda shape? Which method does a Java reflection scanner see?

## Sources

- [Kotlin documentation: Calling Java from Kotlin](https://kotlinlang.org/docs/java-interop.html#sam-conversions)
- [Kotlin documentation: Calling Kotlin from Java](https://kotlinlang.org/docs/java-to-kotlin-interop.html)
