---
id: classes-inheritance
title: Classes and inheritance
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
prerequisiteIds: [functions]
relatedIds: [initialization, equality, visibility]
aliases: [open, final, override, abstract, virtual dispatch]
---

## Overview

Kotlin classes and their ordinary members are final by default. Inheritance and overriding require an explicit contract, while an open member still dispatches through the runtime receiver.

## Why it matters to Java developers

Java habits can lead you to expect extension points that do not exist, or to underestimate constructor-time virtual dispatch merely because most Kotlin declarations start final.

## Mental model

Separate permission to inherit from runtime method selection. `open` permits extension; `override` documents implementation of an inherited contract; dispatch still follows the actual object.

## Semantics

An inheritable ordinary class and an overridable concrete member need `open`. Abstract classes and abstract members provide extension points without their own complete implementation. An override remains overridable unless marked final. A base constructor runs before the derived class's initialization completes.

Primary-constructor parameters marked val/var declare properties. A plain parameter supplies construction input but is not an externally accessible property.

## Example

```kotlin run id=core-dispatch file=Dispatch.kt main=DispatchKt expected=derived
open class Formatter {
    open fun label(): String = "base"
}
class JsonFormatter : Formatter() {
    override fun label(): String = "derived"
}
fun main() {
    val formatter: Formatter = JsonFormatter()
    println(formatter.label()) // derived
}
```

The variable's declared type permits the call; the receiver determines the selected override.

## Java comparison

Kotlin reverses Java's usual opt-out of inheritance: an ordinary declaration starts final. That does not remove the shared risk of calling an overridable member before the derived state is initialized.

## Common mistakes

Opening an entire API only to make tests convenient, forgetting that an override can itself be overridden, or assuming a base-typed reference suppresses dispatch.

## Decision guidance

Prefer composition when there is no stable substitutable contract. Open the specific extension points you intend to maintain and avoid virtual calls during construction.

## Knowledge check

Would `final override fun label()` change the demonstrated output? No; it prevents a further subclass from overriding that method. This particular derived class is already final.

## Connections

This core path step prepares [constructors](#constructors) and [initialization](#initialization). [Equality](#equality) explains why an ordinary class does not automatically gain value semantics.

## Interview question

A Java base class is ported to Kotlin, and downstream subclasses stop compiling. How do you restore intentional extensibility while preventing construction-time overrides from observing incomplete state?

## Essential points

- Identify the final defaults for both classes and concrete members.
- Open only intended extension points and implement explicit overrides.
- Move required construction inputs into constructor parameters or finish construction before invoking polymorphic behavior.

## Trade-offs

Inheritance supports substitution but commits to extension behavior. Composition avoids constructor dispatch hazards while sometimes requiring explicit forwarding.

## Common traps

Adding open everywhere or calling a virtual “initialize” method from a constructor as a supposed fix.

## Follow-up probes

Can an open class still contain final methods? What further guarantee does final override provide?

## Sources

- [Kotlin documentation: Inheritance](https://kotlinlang.org/docs/inheritance.html)
- [Kotlin documentation: Classes](https://kotlinlang.org/docs/classes.html)
