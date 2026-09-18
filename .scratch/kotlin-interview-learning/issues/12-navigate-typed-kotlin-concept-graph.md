# 12: Navigate the typed Kotlin concept graph

**What to build:** Give learners a graph whose categories, curriculum depths, prerequisite edges, related edges, and curated study path have distinct visible meanings, while retaining free exploration, stable URLs, and search across hidden concepts.

**Blocked by:** 09: Publish the first structured Kotlin concept

**Status:** ready-for-agent

- [ ] Representative concepts cover more than one category and all three curriculum depths without duplicating a concept across categories.
- [ ] Directed prerequisite edges and undirected related edges are visually distinguishable and remain distinct in generated data.
- [ ] Selecting a concept labels its immediate relationships in plain language.
- [ ] The curated study path is an optional overlay independent of categories and both edge types.
- [ ] No concept is locked; opening a concept before a prerequisite shows a light `Best understood after…` notice with working links.
- [ ] Core concepts are visible by default, while deep-dive and reference concepts remain discoverable through filters and search.
- [ ] Search includes concepts hidden by active graph filters; choosing one temporarily reveals it and its immediate neighborhood.
- [ ] A learner can return from a temporary search reveal to the exact previous filtered graph view.
- [ ] Direct stable URLs and sharing continue to use permanent authored IDs rather than titles.
- [ ] Graph validation rejects dangling relationships, prerequisite cycles, missing study-path concepts, nonexistent categories, and duplicate IDs.
- [ ] Desktop browser acceptance tests cover typed edges, prerequisite notices, the path overlay, depth filtering, hidden-result search, and return to the prior view.
