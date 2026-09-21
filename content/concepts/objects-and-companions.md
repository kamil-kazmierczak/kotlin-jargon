---
id: objects-and-companions
title: Objects, companions, and JVM API shape
profile: substantial
category: domain-modeling
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [initialization, visibility]
relatedIds: [closed-domain-models, jvm-execution]
aliases: [object declaration, singleton, companion object, JvmStatic, factory]
---

## Overview

An object declaration creates one named instance. A companion object associates one object with a class and can implement interfaces or host factories, but its members are not automatically Java static methods.

## Why it matters to Java developers

Kotlin call syntax can look static while the generated JVM API uses an object instance, `INSTANCE`, or `Companion`. Java-friendly static entry points require deliberate annotations or top-level API choices.

## Mental model

Treat every `object` as a value with initialization behavior. Treat a companion as a class-associated object, then design its Java bytecode surface separately instead of inferring it from Kotlin syntax.

## Semantics

A named object declaration is initialized thread-safely on first access. A companion object is initialized when its containing class is loaded or resolved. Companion members are instance members of that companion; `@JvmStatic` additionally generates a static JVM method on the containing class, while a named object's unannotated members are reached from Java through its singleton instance.

## Example

```kotlin run id=domain-companion-java-api file=Order.kt main=OrderClient expected=A-7:UTC
class Order private constructor(val id: String) {
    companion object {
        @JvmStatic fun create(id: String): Order = Order(id.trim())
    }
}

object DefaultClock {
    @JvmStatic fun zone(): String = "UTC"
}
```

```java run id=domain-companion-java-api file=OrderClient.java main=OrderClient expected=A-7:UTC
public final class OrderClient {
    public static void main(String[] args) {
        System.out.println(Order.create(" A-7 ").getId() + ":" + DefaultClock.zone());
    }
}
```

The annotations make the intended Java static surface explicit. Without them, Java would use `Order.Companion.create(...)` and `DefaultClock.INSTANCE.zone()`.

## Java comparison

A Java static member belongs to a class-level JVM namespace and is not an object implementing an interface. Kotlin companions and named objects are real instances; annotations can add familiar static bridges without changing that Kotlin model.

## Common mistakes

Calling companion members “statics” without checking bytecode-facing calls, storing mutable global state in an object merely for convenience, assuming a companion initializes lazily on its first member access, or adding `@JvmStatic` everywhere without an API requirement.

## Decision guidance

Use a named object for a genuine singleton value or stateless strategy. Use a companion for a factory or behavior conceptually associated with a class, especially when the companion itself implements a useful interface. Add `@JvmStatic` or `@JvmField` only where the supported Java API calls for that shape.

## Knowledge check

Does `Order.create` prove that `create` is a JVM static method? No. Kotlin resolves the class name to its companion. The static bridge exists here only because of `@JvmStatic`.

## Connections

[Initialization](#initialization) supplies the ordering model; [visibility](#visibility) supports the private constructor. [JVM execution](#jvm-execution) explains why Kotlin source convenience and Java-facing shape must be tested separately.

## Interview question

A Kotlin factory works as `Account.open()` but a Java consumer cannot call `Account.open()`. Explain the generated shape, offer compatible API choices, and discuss initialization and testability of a global object dependency.

## Essential points

- An ordinary companion function is an instance member of `Account.Companion`.
- `@JvmStatic` adds a Java static bridge; a top-level function or explicit factory object are alternatives.
- Object initialization and global mutable state are separate design concerns from call-site brevity.

## Trade-offs

Static bridges improve Java ergonomics but enlarge the binary API. Singleton objects make identity and access simple but can hide process-wide state; injected interfaces make dependencies explicit.

## Common traps

Confusing Kotlin resolution with JVM static generation, using an object as a service locator, or promising a particular initialization point without distinguishing named and companion objects.

## Follow-up probes

How does `@JvmField` differ from `@JvmStatic`? Can a companion implement a factory interface? What call does Java use for an unannotated named object method?

## Sources

- [Kotlin documentation: Object declarations and expressions](https://kotlinlang.org/docs/object-declarations.html)
- [Kotlin documentation: Calling Kotlin from Java](https://kotlinlang.org/docs/java-to-kotlin-interop.html)
