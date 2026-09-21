---
id: constructors
title: Constructors and invariants
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
prerequisiteIds: [classes-inheritance]
relatedIds: [initialization, declarations-properties]
aliases: [primary constructor, secondary constructor, init, constructor parameter]
---

## Overview

A primary constructor defines construction inputs. Property initializers and init blocks establish instance state; secondary constructors delegate before running their own bodies.

## Why it matters to Java developers

Kotlin spreads work normally found in a Java constructor body across declarations and init blocks. Reading only the constructor signature misses the actual invariant checks and their order.

## Mental model

Trace one construction chain. With a primary constructor, every secondary constructor reaches it directly or indirectly; common initialization runs before the selected secondary constructor's body.

## Semantics

The primary constructor's parameters are available to property initializers and init blocks. Only parameters marked val or var become declared properties. Initializers and init blocks execute in source order. A secondary constructor's delegation precedes its body, so a secondary body cannot rescue a primary invariant that has already failed.

## Example

```kotlin run id=core-constructors file=Constructors.kt main=ConstructorsKt expected=property,init,secondary:8
val constructionTrace = mutableListOf<String>()
class Limit(raw: Int) {
    val size = raw.also { constructionTrace.add("property") }
    init {
        constructionTrace.add("init")
        require(size > 0)
    }
    constructor(text: String) : this(text.toInt()) {
        constructionTrace.add("secondary")
    }
}
fun main() {
    val limit = Limit("8")
    println("${constructionTrace.joinToString(",")}:${limit.size}") // property,init,secondary:8
}
```

`also` returns its receiver after executing the tracing lambda. This keeps the size initializer visible without changing its value. `raw` is a construction input; callers read `size`.

## Java comparison

Delegation serves the same broad purpose as this-constructor chaining in Java. Kotlin's interleaving of property initializers and init blocks makes declaration order part of the construction reasoning.

## Common mistakes

Treating init as a later lifecycle callback, duplicating shared validation in every secondary constructor, or expecting a plain constructor parameter to provide a public getter.

## Decision guidance

Enforce invariants in the shared construction path. Use a named factory when parsing or validation needs a richer failure policy than a throwing constructor. Keep construction free of externally visible partial state.

## Knowledge check

For Limit("0"), does secondary appear in the trace? No: require fails during shared initialization before that body runs. For Limit("bad"), conversion fails before delegation reaches the primary constructor.

## Connections

This core path step follows [classes](#classes-inheritance) and prepares the deeper ordering hazards in [initialization](#initialization).

## Interview question

A secondary constructor tries to repair invalid state after delegating, but the object fails to construct first. Explain the trace and choose where normalization and invariant validation belong.

## Essential points

- Predict property, init, secondary for valid input.
- Delegation and shared initialization precede the secondary body.
- Normalize arguments before delegation or in a factory; validate the invariant on the shared path.

## Trade-offs

Constructor checks prevent invalid instances. Factories can describe parsing failures explicitly but add an API entry point and a result-handling policy.

## Common traps

Calling the secondary body an alternative to primary initialization, or assuming declaration order is cosmetic.

## Follow-up probes

What changes if raw is declared val? Which side effects have already happened when require fails?

## Sources

- [Kotlin documentation: Classes and constructors](https://kotlinlang.org/docs/classes.html)
- [Kotlin specification: Classifier initialization](https://kotlinlang.org/spec/declarations.html#classifier-initialization)
