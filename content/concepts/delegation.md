---
id: delegation
title: Delegation as explicit composition
profile: substantial
category: domain-modeling
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [classes-inheritance, functions]
relatedIds: [objects-and-companions, immutability]
aliases: [implementation delegation, class delegation, property delegation, by keyword, decorator]
---

## Overview

Kotlin delegation makes composition concise: class delegation forwards an interface implementation to another object, while property delegation redirects accessor behavior to a delegate protocol. They share `by` syntax but solve different design problems.

## Why it matters to Java developers

Java composition usually requires handwritten forwarding or framework generation. Kotlin can generate the forwarding surface while still making the held delegate and selected overrides explicit.

## Mental model

The containing object owns its public contract; the delegate supplies selected mechanics. Generated forwarding does not turn the delegate into a superclass and does not make the wrapper observe the delegate's internal self-calls.

## Semantics

`class Wrapper(source: Source) : Source by source` generates implementations for interface members not overridden by `Wrapper`. An explicit override wins for calls through the wrapper. Calls that the delegate makes on itself still use the delegate's own implementation. Property delegation instead maps reads and writes to suitable `getValue` and `setValue` operator functions; standard delegates such as `lazy` add their own initialization and concurrency contracts.

## Example

```kotlin run id=domain-delegation file=Delegation.kt main=DelegationKt expected=250:USD:1
interface PriceSource {
    fun cents(): Int
    fun currency(): String = "USD"
}

class AuditedPrice(private val source: PriceSource) : PriceSource by source {
    var reads: Int = 0
        private set

    override fun cents(): Int {
        reads += 1
        return source.cents()
    }
}

fun main() {
    val audited = AuditedPrice(object : PriceSource {
        override fun cents(): Int = 250
    })
    println("${audited.cents()}:${audited.currency()}:${audited.reads}")
}
```

The wrapper intercepts `cents` but receives generated forwarding for `currency`.

## Java comparison

This is the decorator/composition pattern with compiler-generated forwarding, not inheritance or a Java dynamic proxy. Java callers see ordinary implemented interface methods on `AuditedPrice`; the Kotlin `by` expression is not part of the Java API.

## Common mistakes

Assuming every call is interceptable, exposing the mutable delegate and bypassing wrapper invariants, confusing implementation delegation with property delegation, or delegating an interface that is too broad to remain stable.

## Decision guidance

Use implementation delegation when a wrapper preserves an interface contract and changes a few behaviors. Handwrite forwarding when each operation needs policy or when API evolution must be reviewed member by member. Use property delegates for reusable accessor semantics only after checking lifecycle, synchronization, and reflection costs.

## Knowledge check

If the underlying source calls its own `cents()` internally, does `AuditedPrice.cents()` necessarily intercept it? No. Delegation forwards calls made to the wrapper; it does not rewrite self-dispatch inside the delegate.

## Connections

This is a composition alternative to [classes and inheritance](#classes-inheritance). [Objects and companions](#objects-and-companions) can provide stateless delegate values, while [immutability](#immutability) determines whether sharing a delegate introduces observable mutation.

## Interview question

You need metrics around a third-party repository interface. Compare inheritance, handwritten composition, Kotlin implementation delegation, and a dynamic proxy. Which calls can your wrapper reliably observe?

## Essential points

- Delegation is generated interface forwarding to a held object.
- Explicit wrapper overrides intercept calls made through the wrapper.
- Internal delegate self-calls and leaked delegate references can bypass wrapper policy.

## Trade-offs

Delegation reduces boilerplate and favors composition, but generated forwarding can obscure the exact surface during interface growth. Manual forwarding is noisier and provides an intentional review point for every member.

## Common traps

Treating the delegate as a superclass, claiming interception of internal calls, or using `lazy` without choosing a suitable thread-safety mode.

## Follow-up probes

What happens when the interface gains a default method? When should the delegate remain private? How does a property delegate's protocol differ from interface forwarding?

## Sources

- [Kotlin documentation: Delegation](https://kotlinlang.org/docs/delegation.html)
- [Kotlin documentation: Delegated properties](https://kotlinlang.org/docs/delegated-properties.html)
