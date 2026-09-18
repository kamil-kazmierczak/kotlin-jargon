# Fit deep Kotlin explanations into the visual app

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Assignee: Codex
Parent: [Plan a Kotlin interview learning app for an experienced Java developer](../map.md)
Blocked by: 01

## Question

How should the existing graph and concept panel present the agreed lesson structure at enough depth for senior-interview preparation, including explanations, code examples, Java comparisons, mistakes, and revealable interview answers?

Use a representative topic from the selected curriculum to decide how much appears immediately, where deeper material lives, and how the learner moves between a lesson and related concepts. Determine whether a visual prototype is needed to settle any remaining interaction choices; if so, create a separate prototype decision ticket. Do not implement the interface or write the complete curriculum here.

## Answer

The graph remains the learner's orientation surface, while sustained study moves into a distinct desktop reading state. Selecting a graph node first opens a compact **Concept Overview**. Choosing its study action opens a wider **Focused Lesson** without losing the graph context from which the learner arrived.

`Platform types` is the representative lesson for validating this model. It exercises Kotlin semantics, a Java boundary, unsafe and corrected code, common misuse of `!!`, prerequisite and related-concept navigation, design judgment, and interview reasoning. The model should later be sanity-checked against longer coroutine material, but that is not required to settle this decision.

### Concept Overview and Focused Lesson

The Concept Overview contains the concept's short explanation, why it matters to an experienced Java developer, prerequisites, curriculum depth, and one clear action to study it. It does not duplicate lesson sections or reveal the interview question.

The Focused Lesson visually recedes the graph and gives reading most of the viewport. The application preserves the selected node, graph camera position, filters, and study-path overlay. Closing the lesson restores that exact context.

A substantial lesson follows a consistent scrolling spine:

1. mental model;
2. semantics;
3. worked Kotlin example, including the relevant Java boundary where needed;
4. focused Java comparison;
5. common mistakes;
6. guidance on when to use, avoid, or choose an alternative;
7. a knowledge check; and
8. the focused interview question with a revealable answer.

The order is a teaching default rather than a requirement to manufacture empty sections for small reference concepts. A compact section outline highlights the current section and permits direct navigation. Previous and next actions follow the curated study path, not prerequisite edges.

Core reasoning stays visible: definitions, semantics, the main example, Java contrast, mistakes, and decision guidance are not collapsed. Optional JVM internals, uncommon edge cases, and version-sensitive details appear as named **Deep Dives** that can be expanded without interrupting the lesson's main argument.

### Code and interview material

Code examples are read-only Kotlin blocks with syntax highlighting and a copy button. The app does not execute or compile Kotlin. Expected output and compiler diagnostics may be authored as ordinary explanatory content when they matter.

Java fragments appear only at the point needed to explain a Kotlin/JVM boundary; the lesson does not duplicate every example in two complete languages. For `Platform types`, the worked example should move from a small unannotated Java API through unsafe Kotlin consumption and its failure mode to progressively safer boundary handling.

The interview question appears near the end of the Focused Lesson. Its answer requires an explicit reveal and presents a model reasoning process, trade-offs, and likely follow-up probes rather than a short response to memorize. Whether revealing or answering affects learner progress remains for [Decide how learners practise and judge progress](05-practice-and-progress.md).

### Moving between concepts

Following a prerequisite or related-concept link from a Focused Lesson first opens a lightweight **Concept Preview**. The preview explains the linked concept and its relationship to the current lesson, then offers a deliberate choice to study it or return. Studying it replaces the current lesson while retaining a short in-session trail back to the origin.

This trail is local reading context, distinct from the curated study path and from graph prerequisite edges.

### Platform and prototype boundary

The planned learning experience is desktop-only. Existing mobile support should be removed during implementation rather than extended to the new lesson model. No mobile lesson layout or acceptance criteria are required.

The textual interaction contract is specific enough to resolve this decision, but its desktop composition and transitions need a cheap visual check. [Prototype the desktop concept-reading flow](06-prototype-desktop-reading-flow.md) will test the Concept Overview, Focused Lesson with section outline, Concept Preview, and restoration of graph context using an abbreviated `Platform types` lesson. It will not prototype production styling, content authoring, progress tracking, or mobile layouts.
