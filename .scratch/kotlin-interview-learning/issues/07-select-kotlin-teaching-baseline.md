# Select the initial Kotlin teaching baseline

Type: research
Labels: wayfinder:research
Status: resolved
Assignee: Codex
Parent: [Plan a Kotlin interview learning app for an experienced Java developer](../map.md)
Blocked by: 04

## Question

Which exact Kotlin compiler and language version, JDK, JVM target, Gradle version range, and `kotlinx.coroutines` version should define the initial reproducible teaching and example-verification baseline?

Use current primary sources to establish compatibility, support lifetime, stable language behavior, Gradle and Kotlin plugin constraints, coroutine compatibility, and any version-sensitive caveats the curriculum must label. Prefer a conservative current baseline suitable for a senior backend Kotlin/JVM curriculum over preview features. Record the sources and date of verification; do not install the toolchain or implement the verification harness.

## Answer

Use this exact initial teaching and example-verification baseline:

- Kotlin compiler and Kotlin Gradle plugin `2.4.20`;
- Kotlin language version `2.4` and API version `2.4`;
- Eclipse Temurin `21.0.12.1+1`;
- JVM target `21`, with Java compilation aligned to the same target;
- Gradle Wrapper `9.7.0`; and
- `kotlinx-coroutines-core` and matching coroutine modules `1.11.0`.

Pin every component rather than following latest releases. Do not enable progressive mode, preview language versions, experimental compiler flags, or experimental APIs globally. The future verification harness should explicitly configure its Java/Kotlin toolchain, language/API versions, and JVM target, and should lock both the Gradle distribution checksum and the JDK artifact or image digest.

This is a conservative current baseline as of 2026-09-18: Kotlin 2.4.20 is the latest stable tooling release in the supported 2.4 language line; Kotlin Gradle plugin 2.4.20 fully supports Gradle 7.6.3 through 9.7.0; Gradle can run on JDK 21 from 8.5 onward; JDK 21 is the older mature LTS with a longer-established backend footprint than JDK 25; and coroutines 1.11.0 is the latest stable release. Gradle 9.7.0 is chosen instead of newer 9.7.1 because 9.7.0 is the maximum version JetBrains currently names as fully supported for this Kotlin plugin.

Lessons must label Kotlin 2.4 behavior where it is version-sensitive, especially K2-only compilation, tightened Java nullability and sealed-class interoperability, and changed default annotation targeting. Coroutine examples should teach the 1.11 replacements for deprecated dispatcher-key usage, old test APIs, and passing a `Job` directly to builders. JDK 25 and experimental Kotlin features are locally labeled comparisons, not silent substitutes for the baseline.

The cited primary-source analysis, compatibility ranges, support horizons, configuration sketch, and upgrade triggers are in [Initial Kotlin teaching baseline research](../assets/07-kotlin-teaching-baseline-research.md).
