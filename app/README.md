# Kotlin Concepts

A curated Kotlin/JVM learning graph for experienced Java developers.

```bash
npm install
```

## Quick start

```bash
npm run dev
```

Runs the development server at `http://localhost:3000`.

## Build

```bash
npm run build
```

Validates the canonical concept Markdown and curriculum manifest, generates application data, and builds the static assets to `dist/`.

The canonical authored content lives in `content/concepts/`, while `content/curriculum.json` owns category definitions, the Kotlin/JVM baseline, and curated study-path order. Generated JSON and LLM exports are ignored build artifacts.

See [`docs/publication-contract.md`](../docs/publication-contract.md) for the human-review fields, publication transitions, preview isolation, generated representations, and baseline-upgrade checks enforced by `npm run verify`.

## Agent & LLM discovery

Every concept, type signature, and code example is exposed in standardized format for AI agents and LLMs.

```bash
# Agent overview & concept links
curl -s https://kamil-kazmierczak.github.io/kotlin-jargon/llms.txt

# Complete full-text documentation with all code blocks
curl -s https://kamil-kazmierczak.github.io/kotlin-jargon/llms-full.txt

# Generated JSON dataset (concepts, curriculum, typed relationships)
curl -s https://kamil-kazmierczak.github.io/kotlin-jargon/data/content.json
```

`llms.txt` follows the [llmstxt.org](https://llmstxt.org/) specification. Structured data is embedded on the page as JSON-LD (`WebApplication`).

## Deploy

```bash
npm run build
```

Configured for GitHub Pages at `https://kamil-kazmierczak.github.io/kotlin-jargon/`. Deployed automatically via `.github/workflows/deploy.yml`.

## Progress backup format

Learning progress stays in browser storage. The Progress menu can export or import this versioned JSON format:

```json
{
  "version": 2,
  "assessments": {
    "platform-types": {
      "status": "can-explain",
      "assessedAt": "2026-09-20"
    }
  },
  "groupAssessments": {
    "java-developer-foundations": {
      "status": "scenario-ready",
      "assessedAt": "2026-09-20"
    }
  }
}
```

Concept assessment states are `needs-review`, `can-explain`, and `interview-ready`. Curriculum-group assessment states are independently set to `needs-review` or `scenario-ready`; they are never calculated from concept assessments. Imports replace existing progress only after the complete file passes validation, and version 1 exports migrate with no group assessments. Selection, scratch answers, stage reveal state, rubric details, assessment history, filters, study paths, theme, and graph camera are never exported as progress.

## License

MIT
