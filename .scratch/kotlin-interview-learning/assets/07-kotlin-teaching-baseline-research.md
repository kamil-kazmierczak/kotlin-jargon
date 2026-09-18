# Initial Kotlin teaching baseline research

Verified: 2026-09-18

## Recommendation

Use this baseline for authored examples and the future verification harness:

| Component | Pinned baseline | Policy |
| --- | --- | --- |
| Kotlin compiler and Kotlin Gradle plugin | `2.4.20` | Pin exactly. It is the current stable release, published 2026-09-07, and the `2.4` standard-library release line is supported through 2027-12-03. ([Kotlin releases](https://kotlinlang.org/docs/releases.html)) |
| Kotlin language and API versions | `2.4` / `2.4` | Set both explicitly. Use stable language behavior; do not globally enable progressive mode, EAP language versions, experimental compiler flags, or experimental APIs. The compiler documents language/API versions as separate compatibility controls. ([Compiler options](https://kotlinlang.org/docs/compiler-reference.html)) |
| JDK | Eclipse Temurin `21.0.12.1+1` | Pin this vendor/build (or an immutable image digest containing it) for reproducible verification. JDK 21 is the deliberately conservative LTS baseline; Adoptium lists Temurin 21 availability through at least December 2029. ([Temurin release](https://github.com/adoptium/temurin21-binaries/releases/tag/jdk-21.0.12.1%2B1), [Adoptium support roadmap](https://adoptium.net/support/)) |
| JVM target | `21` | Set explicitly and align Java compilation to 21. Kotlin supports JVM targets from 1.8 and 9 through 26, but otherwise defaults to 1.8. ([Kotlin JVM compiler options](https://kotlinlang.org/docs/compiler-reference.html#jvm-target-version)) |
| Gradle Wrapper | `9.7.0` | Pin exactly. KGP 2.4.20's fully supported Gradle range is `7.6.3–9.7.0`; Gradle can run on Java 21 from 8.5 onward, so the effective range when the same JDK 21 runs the build is `8.5–9.7.0`. ([Kotlin–Gradle compatibility](https://kotlinlang.org/docs/gradle-configure-project.html), [Gradle Java compatibility](https://docs.gradle.org/current/userguide/compatibility.html), [Gradle 9.7.0 release](https://docs.gradle.org/9.7.0/release-notes.html)) |
| Coroutines | `org.jetbrains.kotlinx:kotlinx-coroutines-core:1.11.0` | Pin exactly, with matching `kotlinx-coroutines-test`/debug modules when used. It is the latest stable release. ([1.11.0 release](https://github.com/Kotlin/kotlinx.coroutines/releases/tag/1.11.0)) |

The compact baseline identifier is therefore:

```text
Kotlin/KGP 2.4.20; language/API 2.4; Temurin 21.0.12.1+1;
JVM target 21; Gradle 9.7.0; kotlinx.coroutines 1.11.0
```

## Why this is conservative and current

Kotlin 2.4.20 is a stable tooling release, not an EAP or release candidate. Pinning its language and API level to 2.4 teaches the current stable language while excluding previews. Kotlin/JVM's K2 compiler is stable throughout Kotlin 2.0.0–2.4.20. ([K2 migration guide](https://kotlinlang.org/docs/k2-compiler-migration-guide.html))

JDK 21 is intentionally chosen over JDK 25. Both are LTS releases, but 21 is the older, mature LTS with Oracle support scheduled through September 2028 (Premier) and September 2031 (Extended), while Temurin publishes a separate availability horizon through at least December 2029. This better matches a conservative senior-backend curriculum; moving to JDK 25 should be a deliberate baseline upgrade, not an incidental toolchain update. ([Oracle Java support roadmap](https://www.oracle.com/java/technologies/java-se-support-roadmap.html), [Adoptium support roadmap](https://adoptium.net/support/))

Name Temurin in verification provenance rather than saying only "JDK 21." Oracle JDK 21 updates move away from the permissive NFTC license beginning with the October 2026 update, while the Java feature release remains supported. That licensing change does not affect the language baseline, but it can surprise an installation recipe. ([Oracle Java support roadmap](https://www.oracle.com/java/technologies/java-se-support-roadmap.html))

Gradle 9.7.1 is newer than 9.7.0, but JetBrains' KGP 2.4.20 table names exactly 9.7.0 as the maximum *fully supported* Gradle version. A conservative reproducible harness should therefore stay at 9.7.0 until JetBrains expands that range or the project explicitly verifies a later patch. Gradle 9.7.0 itself was released 2026-08-06. ([Kotlin–Gradle compatibility](https://kotlinlang.org/docs/gradle-configure-project.html), [Gradle releases](https://gradle.org/releases/))

Coroutines 1.11.0 was built with Kotlin 2.2.20, which is not a conflict: stable Kotlin/JVM binaries are backward-readable by newer compilers, and the K2 compiler supports libraries compiled with any Kotlin version. ([Kotlin evolution principles](https://kotlinlang.org/docs/kotlin-evolution-principles.html#evolving-the-binary-format), [K2 library compatibility](https://kotlinlang.org/docs/k2-compiler-migration-guide.html#compatibility-with-kotlin-libraries), [coroutines 1.11.0 release](https://github.com/Kotlin/kotlinx.coroutines/releases/tag/1.11.0))

## Configuration constraints

The eventual harness should configure both the Java/Kotlin toolchain and target explicitly. Do not rely on Kotlin's default JVM target of 1.8. Kotlin's Gradle plugin checks related Java and Kotlin compilation tasks for target mismatch and fails by default on Gradle 8+, while a configured Kotlin JVM toolchain also configures Java compilation tasks. ([Kotlin Gradle JVM target and toolchains](https://kotlinlang.org/docs/gradle-configure-project.html#gradle-java-toolchains-support))

Conceptually, the pinned settings are:

```kotlin
plugins {
    kotlin("jvm") version "2.4.20"
}

kotlin {
    jvmToolchain(21)
    compilerOptions {
        languageVersion = KotlinVersion.KOTLIN_2_4
        apiVersion = KotlinVersion.KOTLIN_2_4
        jvmTarget = JvmTarget.JVM_21
    }
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.11.0")
}
```

This is illustrative configuration, not an implementation instruction. The future harness should also lock the Gradle distribution checksum and the JDK artifact or image digest. Routine JDK security updates should update environment provenance and rerun all fixtures without silently changing the Kotlin language baseline.

Gradle's *embedded Kotlin* version and language level govern Gradle Kotlin DSL build scripts; they are distinct from the project's KGP/compiler version. Curriculum prose must not conflate them. ([Gradle Kotlin compatibility table](https://docs.gradle.org/current/userguide/compatibility.html#kotlin))

## Version-sensitive curriculum labels

Lessons touching the following behavior should carry an explicit `Kotlin 2.4` or `coroutines 1.11` note:

- Kotlin 2.4 no longer supports rolling back to the K1 compiler with language version 1.9. The baseline teaches K2 behavior only. ([K2 migration guide](https://kotlinlang.org/docs/k2-compiler-migration-guide.html#how-to-roll-back-to-the-previous-compiler))
- Kotlin 2.4 tightened Java interop: explicitly nullable type arguments are no longer treated as flexible; Jakarta nullability annotations are enforced; exhaustive `when` handling for non-abstract Java sealed classes changed; and default annotation target selection changed in ways visible to reflection and annotation processors. Existing or comparative Java-interoperability examples must say which behavior they demonstrate. ([Kotlin 2.4 compatibility guide](https://kotlinlang.org/docs/compatibility-guide-24.html))
- Coroutines 1.11 deprecates using `CoroutineDispatcher` as a coroutine-context key, advances deprecations in the old `kotlinx-coroutines-test` APIs, and flags passing a `Job` directly to coroutine builders. Examples should teach the replacement patterns rather than preserve pre-1.11 idioms. ([coroutines 1.11.0 release notes](https://github.com/Kotlin/kotlinx.coroutines/releases/tag/1.11.0))
- Experimental Kotlin APIs and compiler `-X` options are outside the default baseline. If a lesson discusses one, mark the opt-in and version locally and exclude it from claims about stable language behavior. Kotlin documents `-X` options as unstable and subject to change without notice. ([Compiler options](https://kotlinlang.org/docs/compiler-reference.html))
- JDK 25 is a future baseline candidate, not a silent substitute. Examples specifically comparing JDK 25 APIs or bytecode must be labeled and kept separate from baseline-verified examples.

## Upgrade trigger

Review this baseline when any pinned component reaches its support boundary, when KGP's fully supported Gradle range changes, or when curriculum value justifies moving to JDK 25. An upgrade must rerun every fixture and review compiler diagnostics, Java interop, annotation placement, reflection output, coroutine deprecations, and expected runtime output before the baseline metadata changes.
