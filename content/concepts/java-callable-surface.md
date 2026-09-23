---
id: java-callable-surface
title: Kotlin callable API for Java
profile: substantial
category: java-interoperability
depth: deep-dive
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [java-sam-properties, objects-and-companions, functions]
relatedIds: [jvm-execution, visibility, constructors]
aliases: [JvmStatic, JvmOverloads, Throws, Java-facing Kotlin API]
---

## Overview

A pleasant Kotlin declaration can expose a surprising Java signature. Static access, default arguments, properties, and checked exceptions need explicit design when Java code is a supported client.

## Why it matters to Java developers

Java compiles against JVM names, overloads, accessors, and declared `throws` clauses. Kotlin metadata can preserve richer source concepts for Kotlin tools, but a Java compiler does not call those concepts directly.

## Mental model

Write the intended Java call first, then choose Kotlin declarations and JVM annotations that produce it. Treat each generated public method as part of the library contract.

## Semantics

Top-level functions live in a generated file facade such as `PolicyKt`; `@file:JvmName` chooses another facade name. A companion method is called through `Companion` unless `@JvmStatic` also emits an enclosing-class static method. Java has no Kotlin named/default arguments; `@JvmOverloads` emits overloads by dropping trailing defaulted parameters. Kotlin does not enforce checked exceptions, and a Kotlin function's Java signature needs `@Throws(IOException::class)` for Java to catch a checked `IOException` directly. Public Kotlin non-null parameters get runtime checks when Java violates them. Interface default method shape and compatibility bridges depend on compiler settings, so a published library should inspect its own compiled artifact.

## Example

The Kotlin API gives Java a static call with one or two arguments and a checked exception clause. The Java client compiles and executes against that exact surface.

```kotlin run id=interop-java-facade file=OrderPolicy.kt main=JavaPolicyClient expected=ready:7
import java.io.IOException

class OrderPolicy {
    companion object {
        @JvmStatic
        @JvmOverloads
        @Throws(IOException::class)
        fun label(id: Int, prefix: String = "ready"): String {
            if (id < 0) throw IOException("invalid id")
            return "$prefix:$id"
        }
    }
}
```

```java run id=interop-java-facade file=JavaPolicyClient.java main=JavaPolicyClient expected=ready:7
import java.io.IOException;

public final class JavaPolicyClient {
    public static void main(String[] args) {
        try {
            System.out.println(OrderPolicy.label(7)); // ready:7
        } catch (IOException error) {
            throw new AssertionError(error);
        }
    }
}
```

## Java comparison

Without `@JvmStatic`, Java calls `OrderPolicy.Companion.label(...)`. Without `@JvmOverloads`, Java supplies both parameters. Without `@Throws`, a direct Java `catch (IOException)` around this call may be rejected as unreachable. None of these annotations changes Kotlin's own default-argument or exception semantics.

## Common mistakes

Assuming a companion method is automatically static on the enclosing class; promising Java named arguments; adding overloads without considering future collisions; or catching a checked exception in Java when the Kotlin signature does not declare it.

## Decision guidance

Expose only overloads Java actually needs, keep facade and JVM names stable, and compile a Java consumer in CI. For checked failures, decide whether `@Throws` or a result type is the stable Java contract. Inspect the generated signature after toolchain upgrades.

## Knowledge check

Can Java call `label(7)` if the Kotlin declaration has a default `prefix` but no `@JvmOverloads`? No. Kotlin's default machinery does not create that ordinary Java overload by itself.

## Connections

[Objects and companions](#objects-and-companions) explains ownership, [JVM execution](#jvm-execution) explains file facades, and [visibility](#visibility) frames binary exposure. [Generic signatures](#java-generic-signatures) adds wildcard compatibility.

## Interview question

You are publishing a Kotlin utility used by a Java service. The service needs `OrderPolicy.label(7)` and must catch `IOException`. Produce the API and explain the compatibility risks of a future parameter change.

## Essential points

- Java sees generated JVM methods, not Kotlin default-argument syntax.
- `@JvmStatic`, `@JvmOverloads`, and `@Throws` solve distinct Java call-site needs.
- Generated public signatures deserve compiled consumer tests.

## Trade-offs

Overloads and static bridges improve Java ergonomics but increase the binary surface. A throws clause helps checked Java callers while making the failure part of their compile-time contract.

## Common traps

Equating the companion object with a Java static holder, or assuming Kotlin's lack of checked exceptions removes Java compiler rules.

## Follow-up probes

How would you preserve an old overload while adding an option? When is `@file:JvmName` appropriate? What changes if Java reflection scans methods by name?

## Sources

- [Kotlin documentation: Calling Kotlin from Java](https://kotlinlang.org/docs/java-to-kotlin-interop.html)
- [Kotlin documentation: Exceptions](https://kotlinlang.org/docs/exceptions.html)
