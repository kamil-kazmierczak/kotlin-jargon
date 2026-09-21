---
id: expressions-control-flow
title: Expressions and control flow
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
prerequisiteIds: [declarations-properties]
relatedIds: [functions, equality]
aliases: [if expression, when, try expression, finally, return]
---

## Overview

Kotlin's `if`, `when`, and `try` can produce values. Trace the selected branch, its last expression, and any abrupt exit separately from cleanup effects.

## Why it matters to Java developers

Concise expression bodies can hide evaluation order during a port. Familiar Java cleanup rules still matter, but assigning an entire conditional or try expression changes where the result is chosen.

## Mental model

First trace effects in execution order; then determine which expression supplies the result. A normally completing `finally` runs cleanup without replacing a pending result.

## Semantics

An `if` used as a value needs both branches. A value-producing `when` must be exhaustive; only its first matching branch executes, with no fall-through. A subjectless `when` checks conditions in order.

A `try` result comes from the successful try block or selected catch block. `finally` always participates in exit processing; its ordinary last expression is not the try result. A throw or return in `finally` can replace a pending outcome, which makes such code hard to reason about.

## Example

```kotlin run id=core-control-flow file=ControlFlow.kt main=ControlFlowKt expected=choose,cleanup:allow
fun main() {
    val trace = mutableListOf<String>()
    val decision = try {
        trace.add("choose")
        when {
            2 > 1 -> "allow"
            else -> "deny"
        }
    } finally {
        trace.add("cleanup")
        "ignored"
    }
    println("${trace.joinToString(",")}:$decision") // choose,cleanup:allow
}
```

The result is selected before cleanup; the string in finally does not become the result.

## Java comparison

Kotlin needs no ternary operator because `if` can supply a value. A Kotlin `when` is not a Java switch with implicit fall-through. The danger of an abrupt exit from finally remains familiar from Java.

## Common mistakes

Returning a Boolean comparison from one branch and logging with `println` from another, accidentally producing an unhelpful common result type; treating cleanup's last expression as the result; ordering a broad when condition before a narrower one.

## Decision guidance

Prefer expression form when branches compute one coherent value. Use explicit result types at API boundaries and ordinary statements when a branch mainly performs effects. Keep cleanup free of returns that conceal the original result or failure.

## Knowledge check

If cleanup throws, does the program print allow? No: the try expression does not complete normally, so execution never reaches println.

## Connections

This core path step supplies the result reasoning used by [functions](#functions) and the group scenario. [Equality](#equality) determines what a value-comparison condition means.

## Interview question

Predict the output, then explain how it changes if the finally block throws. Would moving the decision into a return statement make cleanup optional?

## Essential points

- Trace choose before cleanup and keep allow as the normal result.
- A throwing finally prevents the subsequent print and can mask an earlier failure.
- Returning from try still runs finally; it does not skip cleanup.

## Trade-offs

Expression form localizes the result, while nested effectful branches increase reasoning cost. Resource-management helpers can make ownership clearer than repeated hand-written cleanup.

## Common traps

Predicting ignored as the result, or assuming return bypasses finally.

## Follow-up probes

How would an explicit String result type catch a branch accidentally ending with println? What makes a when over a Boolean exhaustive?

## Sources

- [Kotlin documentation: Conditions and loops](https://kotlinlang.org/docs/control-flow.html)
- [Kotlin documentation: Exceptions](https://kotlinlang.org/docs/exceptions.html)
- [Kotlin specification: Expressions](https://kotlinlang.org/spec/expressions.html)
