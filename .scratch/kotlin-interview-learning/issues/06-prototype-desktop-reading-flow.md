# Prototype the desktop concept-reading flow

Type: prototype
Labels: wayfinder:prototype
Status: resolved
Assignee: Codex
Parent: [Plan a Kotlin interview learning app for an experienced Java developer](../map.md)
Blocked by: 03

## Question

Using an abbreviated `Platform types` lesson, what desktop composition and transitions best realize the agreed reading model without losing the graph as the learner's orientation surface?

Create a cheap, non-production prototype covering four states: the compact Concept Overview, the Focused Lesson with its section outline, a related or prerequisite Concept Preview, and return to the exact prior graph context. Test whether the transition into focused reading, the lesson width and hierarchy, the preview interaction, and the way back are clear on a full-screen desktop display.

Do not prototype mobile layouts, production styling, the complete lesson, content authoring, progress tracking, or executable code. Record the chosen interaction behavior and link the prototype asset in the resolution.

## Answer

Choose **Variant A: Docked inspector**. The user selected it after reviewing three structurally different desktop compositions in the interactive prototype.

The compact **Concept Overview** is a right-hand inspector laid over the full graph. The graph remains legible and interactive-looking behind it, keeping the selected `Platform types` node and its neighborhood as the orientation surface. The overview contains only the concept summary, Java-developer relevance, prerequisite, depth, and one strong `Study focused lesson` action.

That action transitions to a wide, centered **Focused Lesson** surface while the graph visibly recedes behind it. The lesson uses most of the viewport but not the full window, preserving a peripheral sense of where it came from. A fixed left rail contains `Back to graph` and the compact section outline; the reading column scrolls independently at a comfortable, bounded width. The outline highlights the current section.

Following a prerequisite or related-concept link opens the **Concept Preview** as a narrower panel from the right, above the still-visible lesson. This keeps the relationship to the current reading position clear. The preview offers two deliberate exits: return to the current lesson or study the previewed concept. It does not silently replace the lesson.

`Back to graph` closes the reading surface and restores the exact selected node, camera position, active filters, and study-path overlay. A short confirmation may make that restoration visible, but it must not become a persistent extra navigation layer.

The prototype deliberately does not settle production styling or animation timings. The implementation should preserve this composition and state contract while rewriting the UI as production code.

Asset: [Desktop concept-reading prototype](../assets/06-desktop-reading-prototype.md), captured on local throwaway branch `prototype-kotlin-desktop-reading-flow` at commit `7b0312f`.
