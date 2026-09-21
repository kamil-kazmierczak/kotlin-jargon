---
id: visibility
title: Visibility and module boundaries
profile: compact
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
prerequisiteIds: [classes-inheritance]
relatedIds: [jvm-execution, declarations-properties]
aliases: [internal, private, protected, public, module]
---

## Overview

Kotlin's default visibility is public. Internal declarations are visible within a Kotlin module; top-level private declarations are confined to their file.

## Why it matters to Java developers

Internal is not Java package-private, and Kotlin protected does not add access for unrelated classes in the same package. Kotlin source access rules are not a security barrier against Java or reflection.

## Semantics

A module is a compilation boundary, such as a Gradle source set, with supported friend relationships such as tests accessing main internals. It is not a package. Members can be private, protected, internal, or public; protected is unavailable at top level. An enclosing declaration also limits access.

On the JVM, internal declarations are exposed as public to Java, with internal members subject to name mangling. Do not promise exact mangled spellings. Kotlin private at file scope lets declarations in the same file cooperate without exposing a package-wide API.

## Example

```kotlin run id=core-visibility file=Visibility.kt main=VisibilityKt expected=10
private fun doubled(value: Int): Int = value * 2
internal fun adjusted(value: Int): Int = doubled(value)
fun main() = println(adjusted(5)) // 10
```

All declarations here share one file and module, so the private helper is accessible. Moving doubled into a different file would require changing its visibility or the calling design.

## Connections

This concise path step is an API-design prerequisite for interpreting [JVM execution](#jvm-execution). It relates to the private-setter example in [properties](#declarations-properties).

## Interview question

A team marks a Kotlin API internal to prevent a Java integration from calling it. Explain why that plan does not establish a hard boundary and propose an appropriate alternative.

## Essential points

Internal limits Kotlin module visibility, not JVM security. Java can see public bytecode declarations. Keep implementation APIs out of the supported surface, test consumers, and use actual module/runtime isolation when access must be enforced.

## Trade-offs

Internal is useful for compiler-enforced Kotlin encapsulation; stronger runtime isolation costs architectural effort and solves a different problem.

## Common traps

Equating modules with packages, assuming protected grants Kotlin package access, or relying on mangling as authorization.

## Follow-up probes

What can another Kotlin file in the same package access? Why may a test source set access main internals without making them public?

## Sources

- [Kotlin documentation: Visibility modifiers](https://kotlinlang.org/docs/visibility-modifiers.html)
- [Kotlin documentation: JVM visibility](https://kotlinlang.org/docs/java-to-kotlin-interop.html#visibility)
