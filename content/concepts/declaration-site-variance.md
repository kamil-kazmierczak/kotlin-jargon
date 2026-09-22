---
id: declaration-site-variance
title: Declaration-site variance and substitutability
profile: substantial
category: generics-abstraction
depth: core
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
publishedAt: 2026-09-22
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-22
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-22
reviewReference: commit:240c832b6954c4253b47924c6ca15b6484678dfa
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [generic-constraints, lambdas-higher-order-functions]
relatedIds: [type-projections, collection-interfaces, platform-types]
aliases: [declaration-site variance, covariance, contravariance, producer out, consumer in]
---

## Overview

Declaration-site variance states once whether every use of a generic abstraction safely follows or reverses its element-type hierarchy. `out T` describes a producer and covariance; `in T` describes a consumer and contravariance. Variance is about compile-time substitutability, not mutation, inheritance of values, or runtime type availability.

## Why it matters to Java developers

Java usually expresses variance at each use with `? extends` and `? super`. Kotlin can put `out` or `in` on the declaration when the abstraction has one stable role, reducing repeated wildcards while having the compiler enforce that role in its members.

## Mental model

Ask which direction values cross the public boundary. If clients only receive `T`, a source of a narrower type can stand in for a source of a broader type. If clients only send `T`, a consumer of a broader type can stand in for a consumer of a narrower type. If both directions are real, keep the parameter invariant.

## Semantics

For `Producer<out T>`, `Producer<Invoice>` is a subtype of `Producer<Any>` when `Invoice` is a subtype of `Any`; public members cannot accept `T` in unsafe input positions. For `Consumer<in T>`, the subtype direction reverses and public members cannot expose `T` in unsafe output positions. Function types apply the same rule: parameter types are contravariant and result types covariant. These are static rules checked before execution.

## Example

```kotlin run id=generics-variant-producer-consumer file=VariantProducerConsumer.kt main=VariantProducerConsumerKt expected=event:paid
open class Event(val label: String) {
    override fun toString(): String = label
}
class PaymentEvent(label: String) : Event(label)

fun interface Producer<out T> { fun next(): T }
fun interface Consumer<in T> { fun accept(value: T) }

fun forward(source: Producer<Event>, destination: Consumer<PaymentEvent>) {
    val event = source.next()
    if (event is PaymentEvent) destination.accept(event)
}

fun main() {
    val payments: Producer<PaymentEvent> = Producer { PaymentEvent("paid") }
    val events: Producer<Event> = payments
    val anyConsumer: Consumer<Any> = Consumer { value -> println("event:$value") }
    val paymentConsumer: Consumer<PaymentEvent> = anyConsumer
    forward(events, paymentConsumer)
    // event:paid
}
```

The producer assignment follows the type hierarchy; the consumer assignment reverses it. The broad consumer uses only `Any.toString`, so it honors its promise to accept every value without a narrowing cast.

## Java comparison

Java callers commonly need `Producer<? extends Event>` for a producer and `Consumer<? super PaymentEvent>` for a consumer. Kotlin's declaration-site promise applies to every use, but generated Java wildcards depend on signature position and compiler interop rules. API authors should inspect the Java surface rather than mechanically assuming each `out` becomes a visible wildcard.

## Common mistakes

Declaring `out` merely because a class feels read-only while a public method still consumes `T`; reading `in` as inheritance direction instead of value flow; assuming covariance makes elements immutable; making a mutable box covariant; or mixing runtime checks into an explanation of static substitutability.

## Decision guidance

Use declaration-site variance when the abstraction has a durable producer-only or consumer-only role. Split read and write capabilities when that produces useful interfaces. Keep a parameter invariant when clients legitimately both provide and receive the same `T`. Verify Java-facing signatures later as their own interoperability contract.

## Knowledge check

Why can a `Consumer<Any>` handle a `PaymentEvent` while a `Consumer<PaymentEvent>` cannot safely stand in for `Consumer<Any>`? The broad consumer accepts every PaymentEvent, but the narrow consumer cannot accept an arbitrary Any that its broader-typed caller would be entitled to send.

## Connections

[Generic constraints](#generic-constraints) define permitted type arguments without changing their substitution direction. [Type projections](#type-projections) restrict one use of an invariant type. [Collection interfaces](#collection-interfaces) distinguish capability from immutability, and [platform types](#platform-types) mark a related Java boundary concern rather than a prerequisite.

## Interview question

Review `Repository<T>` with both `load(): T` and `save(T)`. Should it be covariant, contravariant, invariant, or split into interfaces? Defend the substitutions each caller needs and name the operations each variance choice forbids.

## Essential points

- `out` is covariance for producer positions; `in` is contravariance for consumer positions.
- Variance changes static subtype relationships, not runtime generic information.
- The compiler rejects members that would violate the declaration's promise.
- A producer or consumer capability says nothing by itself about object immutability.

## Trade-offs

Variant interfaces accept more safely substitutable implementations and document direction. They restrict future members, can multiply interface roles, and need deliberate Java surface review. Invariance is less flexible but honest for stateful read/write abstractions.

## Common traps

Repeating only “producer out, consumer in” without proving an assignment, calling `List` deeply immutable because it is covariant, or promising a particular Java wildcard without examining the emitted signature.

## Follow-up probes

How do function types vary? Why is `MutableList<T>` invariant? When would splitting a repository improve both testing and substitution?

## Sources

- [Kotlin documentation: Declaration-site variance](https://kotlinlang.org/docs/generics.html#declaration-site-variance)
- [Kotlin documentation: Calling Kotlin from Java—variant generics](https://kotlinlang.org/docs/java-to-kotlin-interop.html#variant-generics)
