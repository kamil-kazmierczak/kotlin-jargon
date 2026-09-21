---
id: basic-syntax
title: Basic Kotlin syntax
profile: compact
category: execution-semantics
depth: reference
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
pathExclusionReason: Searchable spelling reminder; experienced Java developers can consult it without adding a mandatory syntax lesson.
prerequisiteIds: []
relatedIds: [declarations-properties, expressions-control-flow, functions]
aliases: [syntax, string template, semicolon, type annotation, for loop, range, fun main]
---

## Overview

A compact spelling guide: fun declares a function, types follow names after a colon, val declares a read-only binding, and var allows reassignment. Semicolons are normally omitted.

## Why it matters to Java developers

This reference keeps syntax lookup available without repeating introductory programming on the main path.

## Semantics

String templates interpolate a name with $name or an expression with ${expression}. A for loop visits the elements supplied by its range or iterable; 1..3 includes both ends. Use explicit types when inference would hide the contract.

## Example

```kotlin run id=core-syntax file=Syntax.kt main=SyntaxKt expected=total=6
fun main() {
    val label: String = "total"
    var total = 0
    for (number in 1..3) total += number
    println("$label=$total") // total=6
}
```

## Connections

Kept off the curated path as a searchable reference. Continue with [declarations](#declarations-properties), [expressions](#expressions-control-flow), or [functions](#functions) when the question concerns behavior rather than spelling.

## Interview question

Predict the output, then explain whether changing total to val is valid in this loop.

## Essential points

The inclusive range contributes 1 + 2 + 3, producing total=6. Repeated reassignment of an Int val is invalid; choose var or a different computation.

## Trade-offs

An explicit accumulator exposes the steps; a library sum can be clearer once that operation is familiar.

## Common traps

Reading .. as an exclusive upper bound or treating an inferred type as dynamically changeable.

## Follow-up probes

How does ${total + 1} differ from $total in a template? Why does val not generally imply that a referenced object is immutable?

## Sources

- [Kotlin documentation: Basic syntax](https://kotlinlang.org/docs/basic-syntax.html)
