---
id: initialization
title: Initialization order and safe construction
profile: substantial
category: execution-semantics
depth: deep-dive
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
prerequisiteIds: [constructors]
relatedIds: [equality, expressions-control-flow]
aliases: [init order, constructor dispatch, uninitialized state, lateinit]
---

## Overview

Superclass initialization precedes subclass initialization. Calling an open member during construction can dispatch into a subclass whose state is not ready, so non-null property declarations do not make that construction pattern safe.

## Why it matters to Java developers

The familiar Java virtual-call hazard survives Kotlin's final defaults whenever an extension point is opened. A shorter property declaration can make the unfinished state easier to overlook.

## Mental model

Draw the construction timeline: evaluate base arguments, initialize the base, initialize derived properties and init blocks in order, then finish secondary constructor bodies. Do not let this escape or dispatch into unfinished state.

## Semantics

The language specifies the ordering of construction work. Reading a property before its initialization is not a supported way to obtain a default: the specification describes the value as unspecified. A JVM trace can illustrate a failure, but it must not be promoted into a portable “Kotlin returns zero/null” rule.

Pass required values to the base constructor instead of asking an open getter for derived state. For deliberately deferred initialization, lateinit has a different, explicit contract: reading an uninitialized lateinit property throws UninitializedPropertyAccessException.

## Example

This repaired design traces a fully initialized base input and the derived work. No overridden getter participates in construction.

```kotlin run id=core-initialization file=Initialization.kt main=InitializationKt expected=base:4,property,init,secondary
val trace = mutableListOf<String>()
open class Base(val size: Int) {
    init { trace.add("base:$size") }
}
class Report(size: Int) : Base(size) {
    val title = "ready".also { trace.add("property") }
    init { trace.add("init") }
    constructor() : this(4) { trace.add("secondary") }
}
fun main() {
    Report()
    println(trace.joinToString(",")) // base:4,property,init,secondary
}
```

This separate example asserts the intended runtime failure of an explicitly deferred property, rather than asserting an unspecified early-read result.

```kotlin run id=core-lateinit-failure file=LateinitFailure.kt main=LateinitFailureKt expected=uninitialized
class DeferredReport { lateinit var title: String }
fun main() {
    try {
        println(DeferredReport().title)
        error("Expected an initialization failure")
    } catch (failure: UninitializedPropertyAccessException) {
        println("uninitialized") // uninitialized
    }
}
```

### Group scenario: cache policy

Use this complete example for the group-ending scenario. Predict the trace, equality results, decision, and Java-visible API before reading its asserted output. The default empty note is a body property, so it is excluded from generated equality.

```kotlin run id=core-scenario file=Policy.kt main=PolicyClient expected=base,init,cleanup:reuse:true:false:ready
val policyTrace = mutableListOf<String>()
open class BasePolicy(val title: String) {
    init { policyTrace.add("base") }
}
class Policy : BasePolicy("ready") {
    init { policyTrace.add("init") }
}
data class RequestKey(val id: Int) {
    var note: String = ""
}
fun decide(left: RequestKey, right: RequestKey): String = try {
    if (left == right) "reuse" else "reload"
} finally {
    policyTrace.add("cleanup")
    "ignored"
}
fun sameValue(left: RequestKey, right: RequestKey): Boolean = left == right
fun sameInstance(left: RequestKey, right: RequestKey): Boolean = left === right
fun traceText(): String = policyTrace.joinToString(",")
```

```java run id=core-scenario file=PolicyClient.java main=PolicyClient expected=base,init,cleanup:reuse:true:false:ready
public final class PolicyClient {
    public static void main(String[] args) {
        Policy policy = new Policy();
        RequestKey left = new RequestKey(7);
        RequestKey right = new RequestKey(7);
        right.setNote("changed");
        String decision = PolicyKt.decide(left, right);
        System.out.println(PolicyKt.traceText() + ":" + decision + ":"
            + PolicyKt.sameValue(left, right) + ":"
            + PolicyKt.sameInstance(left, right) + ":" + policy.getTitle());
        // base,init,cleanup:reuse:true:false:ready
    }
}
```

## Java comparison

Opening a getter reintroduces the same dispatch risk as an overridable Java method in a constructor. Kotlin's non-null type is a contract for correctly initialized use, not permission to observe an unfinished object.

## Common mistakes

Fixing early dispatch by adding !!, publishing this from an init block, assuming lateinit assigns a value automatically, or claiming every early property read predictably returns the JVM field default.

## Decision guidance

Prefer complete constructor inputs and final construction-time behavior. Use a factory for multi-step setup. Reserve lateinit for lifecycles that genuinely guarantee assignment before access, and test that lifecycle's failure behavior.

## Knowledge check

Would moving the derived property above its init block fix a base constructor's call to an overridden getter? No: base initialization still occurs first. Passing the required value to Base removes that dependency.

## Connections

This deep-dive path step closes the group after [constructors](#constructors), [equality](#equality), and [control flow](#expressions-control-flow), which the final scenario combines.

## Interview question

A base init block reads an open property overridden by a derived non-null val, and production fails during construction. Diagnose the lifecycle error, explain what output you can legitimately promise, and redesign the dependency.

## Essential points

- Base initialization happens before derived state is ready; virtual dispatch can reach the derived getter.
- Do not promise an exact value for an unspecified early read or treat a non-null declaration as proof of safe construction.
- Supply the base's required input directly, avoid this escaping, and verify the repaired initialization trace.

## Trade-offs

Constructor injection requires explicit dependencies but supports immediate invariants. Deferred setup offers lifecycle flexibility while moving responsibility to callers and tests.

## Common traps

Offering !! as an initialization strategy, or presenting one compiler's observed zero/null as a language guarantee.

## Follow-up probes

How does lateinit failure differ from an early read of an ordinary property? What externally observable effects could remain after a constructor throws?

## Sources

- [Kotlin specification: Classifier initialization](https://kotlinlang.org/spec/declarations.html#classifier-initialization)
- [Kotlin documentation: Derived class initialization order](https://kotlinlang.org/docs/inheritance.html#derived-class-initialization-order)
- [Kotlin documentation: Late-initialized properties](https://kotlinlang.org/docs/properties.html#late-initialized-properties-and-variables)
