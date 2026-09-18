# Desktop concept-reading prototype asset

The validated prototype is preserved outside `master` on the local throwaway branch `prototype-kotlin-desktop-reading-flow` at commit `7b0312f` (`prototype: explore Kotlin desktop reading flow`).

To inspect it:

```bash
git switch prototype-kotlin-desktop-reading-flow
npm run dev
```

Then open `http://localhost:3000/?prototype=kotlin-reading&variant=A`. The prototype also accepts `view=overview`, `view=lesson`, `view=preview`, or `view=graph`.

Return to the planning branch with `git switch master`. The branch is intentionally local and has not been pushed.
