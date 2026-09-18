# 10: Verify Kotlin/JVM teaching examples

**What to build:** Let a content author mark Kotlin and Java teaching examples with explicit verification modes and receive a trustworthy pass or failure from the same release command, using the exact teaching baseline while the browser continues to render static code only.

**Blocked by:** 09: Publish the first structured Kotlin concept

**Status:** ready-for-agent

- [ ] The verification harness pins Kotlin compiler and Kotlin Gradle plugin 2.4.20, language/API 2.4, Eclipse Temurin 21.0.12.1+1, JVM target 21, Gradle Wrapper 9.7.0, and matching kotlinx.coroutines modules 1.11.0.
- [ ] Java and Kotlin compilation targets are explicitly aligned, and the Gradle distribution plus immutable JDK artifact or image identity are locked.
- [ ] A `compile` example succeeds only when its complete source compiles.
- [ ] A `run` example succeeds only when execution produces its deterministic authored result.
- [ ] A shared example identity compiles mixed Java and Kotlin sources together at the actual interoperability boundary.
- [ ] A `compile-fails` example asserts a stable diagnostic category rather than an entire compiler message.
- [ ] `fragment` and `pseudocode` examples are explicitly excluded without being mistaken for unverified complete programs.
- [ ] Progressive mode, preview language versions, unstable compiler flags, and experimental APIs are not enabled globally.
- [ ] The browser renders verified examples as static highlighted code and exposes no browser-side compile or run control.
- [ ] All fixture modes run through the top-level verification command and fail that command when their contract is violated.
