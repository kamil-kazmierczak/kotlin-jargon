---
id: functions
title: Function declarations and defaults
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
reviewReference: commit:99383c5
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [expressions-control-flow]
relatedIds: [jvm-execution, constructors]
aliases: [fun, named arguments, default arguments, expression body, Unit]
---

## Overview

Kotlin functions can live at top level and declare default arguments. Defaults are evaluated when a call omits the argument; named arguments express intent at Kotlin call sites.

## Why it matters to Java developers

Kotlin defaults do not automatically create the overload set a Java caller expects. A one-line expression body can also infer a different return type from a block body.

## Mental model

Keep the function contract separate from call-site conveniences. Determine the parameters actually passed and the return type, then inspect what is exposed across a Java boundary.

## Semantics

An expression body's type can be inferred from its expression. An ordinary block-bodied function without an explicit return type returns Unit; returning a useful value requires an explicit type and return. Named arguments refer to parameter names, so renaming a public parameter can affect Kotlin source callers.

Default expressions run when needed for each invocation, not once at declaration. Java normally sees the full parameter list; use deliberate overloads or `@JvmOverloads` when Java ergonomics justify them.

## Example

```kotlin run id=core-defaults file=Defaults.kt main=DefaultsKt expected=1:9:2
var sequence = 0
fun nextSequence(): Int = ++sequence
fun ticket(number: Int = nextSequence()): Int = number
fun main() {
    println("${ticket()}:${ticket(number = 9)}:${ticket()}") // 1:9:2
}
```

The explicit argument avoids the default's side effect. The earlier Java boundary example shows how a top-level function is called through a generated facade.

## Java comparison

Java overloads select declared methods; a Kotlin default is a source-level omitted-argument feature. Do not expose compiler helper methods as a supported Java API.

## Common mistakes

Treating defaults as cached values, assuming every default adds a Java overload, or changing an expression body to a block and silently losing its returned value.

## Decision guidance

Use defaults for ordinary policy choices, and keep surprising side effects out of them. Specify public return types to make contracts easy to review. Test Java usage when Java is a supported consumer.

## Knowledge check

Does calling ticket(number = 9) increment sequence? No. Would `fun answer() { 42 }` return Int? No; its block body returns Unit.

## Connections

This path step links [expressions](#expressions-control-flow) with [JVM execution](#jvm-execution). [Constructors](#constructors) also accept defaults. Higher-order functions and extension dispatch belong to the later functions-and-idioms group.

## Interview question

An API uses a default argument to generate an ID. Kotlin clients see fresh IDs but a Java client cannot call the method without arguments. Explain both behaviors and design a clear shared API.

## Essential points

- Defaults execute per omitted argument; the example produces 1:9:2.
- Java normally requires the full signature.
- Propose an explicit factory/overload or consciously generated overloads, then test the Java caller.

## Trade-offs

Defaults reduce Kotlin boilerplate. Explicit factories can make ID allocation visible and preserve an intentional Java API at the cost of more declarations.

## Common traps

Relying on a synthetic default helper as public API, or confusing omitted arguments with nullable arguments.

## Follow-up probes

What happens if the default reads changing configuration? Why is changing a public parameter's name observable to Kotlin callers?

## Sources

- [Kotlin documentation: Functions](https://kotlinlang.org/docs/functions.html)
- [Kotlin documentation: Calling Kotlin from Java](https://kotlinlang.org/docs/java-to-kotlin-interop.html)
