# Kotlin Concepts

A curated Kotlin/JVM learning graph for experienced Java developers preparing to explain language semantics and make design decisions.

[Open the desktop learning app](https://kamil-kazmierczak.github.io/kotlin-jargon/).
Explore concepts by category, depth, prerequisites, related concepts, or curated study path. Open a focused lesson to study examples and sources, practise interview reasoning, and record your own assessment. Group scenarios connect the lessons into design decisions. Progress stays in this browser and can be exported or imported as JSON.

The curriculum covers execution and core semantics, types and null safety, domain modeling, collections and sequences, functions and idioms, generics, Java interoperability, coroutine foundations, streams and concurrency, and advanced Kotlin. Reference concepts remain searchable outside the curated paths.

## Develop

Use Node.js 22.20 or newer and the exact Eclipse Temurin JDK recorded in [the verification baseline](examples/gradle/verification-baseline.properties). The Gradle wrapper provisions the pinned Kotlin compiler and libraries.

```sh
npm ci
npm --prefix app ci
npm --prefix app exec -- playwright install --with-deps chromium
npm run dev
```

## Verify and build

From a clean checkout with the prerequisites installed, run the same release command used by CI:

```sh
npm run verify
```

This verifies the JVM teaching examples, baseline, human approvals, content and graph structure, deterministic exports, production build, application state, and desktop browser behavior. It also runs the unpublished curriculum preview checks. The deployable production output stays in `app/dist`; preview output is isolated in `app/.preview/dist`.

CI deploys the verified production artifact to GitHub Pages on pushes to `master` or `main`. See [the release evidence and coverage map](docs/release-verification.md).

## Authoring and sources

[Concept Markdown](content/concepts/) and [the curriculum manifest](content/curriculum.json) are the canonical content. Generated JSON and LLM references are disposable build output. Every production concept has primary sources, a verification baseline, and a human review attestation. See the [publication contract](docs/publication-contract.md) and [contributor guide](contributing.md).

The app exposes [an LLM index](https://kamil-kazmierczak.github.io/kotlin-jargon/llms.txt), [full reference](https://kamil-kazmierczak.github.io/kotlin-jargon/llms-full.txt), and [generated data](https://kamil-kazmierczak.github.io/kotlin-jargon/data/content.json).

## License

MIT. See [LICENSE](LICENSE) for the original project's attribution.
