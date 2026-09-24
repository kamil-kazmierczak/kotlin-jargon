# Kotlin desktop release verification

Issue [#29](https://github.com/kamil-kazmierczak/kotlin-jargon/issues/29) exercises the complete curriculum as one production candidate: 59 human-approved concepts across ten curriculum groups, including off-path reference lessons.

## Reproduce from a clean checkout

Use Node.js 22.20 or newer, Eclipse Temurin 25.0.1+8-LTS, and the checked-in Gradle wrapper. Install root and app dependencies with `npm ci` and `npm --prefix app ci`, then install Chromium and its system dependencies with `npm --prefix app exec -- playwright install --with-deps chromium`.

Run `npm run verify` at the repository root. `.github/workflows/deploy.yml` uses the same prerequisites and command, and uploads only `app/dist`. Preview tests build into `app/.preview/dist`, preserving the production artifact. No separate deployment-time content source exists.

## Coverage

| Release contract | Evidence |
| --- | --- |
| Ten curriculum groups, complete scenarios, all authored concepts published | `release-content.test.mjs`, group content suites |
| Human approvals and pinned baseline | `verify-human-reviews.mjs`, `verify-baseline.mjs` |
| Sourced, structurally valid lessons; distinct categories, depth, typed edges and paths; duplicate, cycle and dangling-reference rejection | `content-pipeline.test.mjs`, production generation |
| Kotlin compilation, expected output, expected compiler failures, mixed Java consumers and deterministic concurrency examples | Gradle `verifyExamples` |
| Canonical content and deterministic exports | `verify-generation.mjs`, `release-content.test.mjs`; production export byte comparisons in `release.test.mjs` |
| All production concepts reachable through search, including references and deep dives | `release.test.mjs` |
| Compact overview, wide centered reader, bounded column, independent scrolling and outline tracking at realistic length | `release.test.mjs`, selecting the longest coroutine/streams lesson from the corpus |
| Optional Deep Dives, preview dismissal, deliberate study, origin reading position, path-derived navigation and sharing | `release.test.mjs` |
| Exact graph selection, camera, filters and path restored after study | `release.test.mjs`, `application-state.test.mjs` |
| Temporary search reveal and history navigation | `e2e.test.mjs`, `application-state.test.mjs` |
| Independent concept and scenario assessments; persistence, filtering and JSON round trip across types, concurrency and advanced Kotlin | `release.test.mjs`; invalid-import and migration cases in state/E2E suites |
| Static Pages subpath, metadata and served exports | `release.test.mjs` uses a static server with real 404s |
| Kotlin identity and removal of the old catalogue and celebration dependency | `release-content.test.mjs`; refreshed production screenshot in `app/public/site-preview.png` |

## Regressions repaired

The focused desktop reader and its outline had been removed by a later graph change. The release restores that composition, keeps the overview compact, and derives previous/next navigation from the selected study path (or the first containing path). Optional Deep Dives expose already-reviewed connected lessons at deep-dive depth; they do not hide core reasoning or introduce another source of lesson prose.

Closing a lesson also triggered graph auto-centering, overwriting the captured camera. Auto-centering now runs when the overview opens, while closing accepts the saved camera. Preview dismissal and returning along a lesson trail retain the origin reading position within the session.

Graph control pointer events previously bubbled into canvas hit testing and zooming, so selecting a filter could unexpectedly open a lesson. Canvas interactions now ignore control events; the release test checks independent control scrolling.

The root README, contributor guide, social preview and README-only JavaScript tooling still represented the original catalogue. They now describe and verify the Kotlin product. The unused confetti dependency and stale Yarn lockfile were removed. CI installs the browser explicitly before the release command.

The project uses JavaScript/JSX rather than TypeScript. Vite checks the application build; Node checks the executable modules and tests; the Gradle harness typechecks Kotlin and Java examples. No browser-side Kotlin execution or account service is introduced. Assessment remains an explicit learner judgment, with no grading, certification or gamification.
