# Teaching-example verification

`npm run verify` invokes this Gradle build before building the static browser app. It reads
Kotlin and Java fences from `content/**/*.md`; no compiler or runner is shipped to the browser.

Use one verification mode in every Kotlin or Java fence:

```text
```kotlin compile id=greeting file=Greeting.kt
// complete source
```
```

`compile` checks the full source set sharing an `id`, which is how a Kotlin and Java pair is
compiled at its real interoperability boundary. `run` additionally requires `main=<class>` and
`expected=<single-line-stdout>`. `compile-fails` requires a stable `category` (`type-mismatch`,
`unresolved-reference`, or `smart-cast-impossible`) rather than a fragile full compiler message.
Use `order=java-first` on every block in a mixed fixture when Kotlin consumes declarations from
Java; the default order supports Java consuming Kotlin. `fragment` and `pseudocode` are
intentionally excluded; they need no identity or source filename.

The wrapper, Kotlin plugin/compiler, language/API versions, JVM target, coroutines modules, and
Temurin baseline are pinned in this directory. CI must provide Eclipse Temurin 25.0.1+8-LTS.
