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

## License

MIT
