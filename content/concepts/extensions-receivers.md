---
id: extensions-receivers
title: Extensions, receivers, and static resolution
profile: substantial
category: functions-idioms
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [lambdas-higher-order-functions, classes-inheritance]
relatedIds: [scope-functions, inline-reified-functions, jvm-execution]
aliases: [extension function, extension property, receiver, dispatch receiver, extension receiver]
---

## Overview

An extension function provides receiver-shaped call syntax for a function declared outside the receiver class. It can make a focused operation discoverable near its input, but it does not modify the class, add a virtual member, or establish inheritance.

## Why it matters to Java developers

Extensions often replace Java utility-class calls such as `Names.normalize(value)` with `value.normalize()`. The call reads like a member, yet overload selection is statically resolved from the compile-time receiver type. On the JVM, a top-level extension is exposed as a static helper whose receiver is an ordinary parameter.

## Mental model

Mentally desugar `value.describe()` to an applicable function call with `value` as the first argument. Member functions win over extensions with the same applicable signature, and changing the variable's declared type can change which extension is selected.

## Semantics

Extensions are statically resolved functions: they do not insert members into a class and they do not dispatch virtually by the receiver's runtime type. A nullable receiver can be checked inside an extension. An extension property has no backing field. When an extension is declared inside another class, the value being extended is the extension receiver and the containing class instance is the dispatch receiver; unqualified name conflicts favor the extension receiver, and qualified `this` labels make intent explicit.

## Example

```kotlin run id=functions-extension-resolution file=ExtensionResolution.kt main=ExtensionResolutionKt expected=message:alert:member
open class Message
class Alert : Message()

fun Message.label(): String = "message"
fun Alert.label(): String = "alert"

class MemberMessage {
    fun label(): String = "member"
}

fun render(message: Message): String = message.label()

fun main() {
    println("${render(Alert())}:${Alert().label()}:${MemberMessage().label()}")
    // message:alert:member
}
```

`render` selects `Message.label` from its parameter's declared type even when the runtime object is an `Alert`. The real member on `MemberMessage` needs no extension and would take precedence over one with the same signature.

```kotlin run id=functions-receiver-resolution file=ReceiverResolution.kt main=ReceiverResolutionKt expected=outer:item:outer/item
class Renderer(private val prefix: String) {
    fun String.render(): String {
        val extensionValue = this
        val dispatchValue = this@Renderer.prefix
        return "$dispatchValue:$extensionValue:$dispatchValue/$extensionValue"
    }
}

fun main() {
    println(with(Renderer("outer")) { "item".render() })
    // outer:item:outer/item
}
```

The labels distinguish the extension receiver (`String`) from the dispatch receiver (`Renderer`). Receiver-heavy code that repeatedly needs such qualification may be signaling that ordinary parameters or a smaller DSL boundary would read better.

## Java comparison

A top-level extension has utility-method semantics even though Kotlin supplies member-like syntax. Java calls the generated static function through its file facade unless the API deliberately controls that facade. It cannot override an existing class member, access private receiver state, or participate in the class's virtual dispatch table.

## Common mistakes

Describing an extension as monkey-patching a class, expecting runtime dispatch among extension overloads, defining a broad extension whose origin is hard to discover, shadowing a future member, or nesting multiple implicit receivers until an unqualified name becomes misleading.

## Decision guidance

Use an extension for a cohesive operation whose primary subject is the receiver and whose required state is already public. Prefer a member when the behavior owns class invariants or needs virtual dispatch. Prefer a named helper when receiver syntax falsely suggests ownership, when several inputs are equally important, or when imports and receiver ambiguity damage readability. Use `@DslMarker`, labels, or explicit parameters to control larger receiver-based DSLs.

## Knowledge check

If `val message: Message = Alert()`, which extension does `message.label()` call? `Message.label`, because the declared receiver type controls extension resolution. A member function would instead use ordinary virtual dispatch when overridable.

## Connections

[Lambdas](#lambdas-higher-order-functions) provide receiver function types. [Scope functions](#scope-functions) temporarily expose a value as a receiver or argument, and [JVM execution](#jvm-execution) explains the static facade visible to Java.

## Interview question

A team wants `order.submit()` as an extension on a third-party `Order`. Decide whether the operation should be an extension, member, or service function. Defend the choice using invariants, dispatch, dependencies, discovery, and Java callers.

## Essential points

- An extension is statically resolved and does not modify or inherit from its receiver class.
- Member declarations take precedence, while overload selection uses the declared receiver type.
- Nested extension and dispatch receivers need explicit ambiguity control.

## Trade-offs

Receiver syntax can improve fluency and discovery in Kotlin. It can also imply ownership that the type does not have, hide imports and dependencies, and offer awkward Java syntax. Members support encapsulation and virtual behavior; explicit helpers make dependencies and multiple important inputs visible.

## Common traps

Claiming an extension adds a method to bytecode for the receiver class, relying on runtime subtype selection, exposing a public generic extension with surprising overload resolution, or using implicit receivers as a substitute for a clear domain model.

## Follow-up probes

What happens if the library later adds a matching member? How does a nullable receiver work? When would `@DslMarker` help, and what should a Java consumer call?

## Sources

- [Kotlin documentation: Extensions](https://kotlinlang.org/docs/extensions.html)
- [Kotlin documentation: Type-safe builders and DSL markers](https://kotlinlang.org/docs/type-safe-builders.html)
- [Kotlin documentation: Calling Kotlin from Java](https://kotlinlang.org/docs/java-to-kotlin-interop.html)
