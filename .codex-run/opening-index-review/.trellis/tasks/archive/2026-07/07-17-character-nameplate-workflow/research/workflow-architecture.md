# Character nameplate workflow architecture

## Evidence from the current repository

- `UserIdentity` already owns the generic three-layer rendering contract and exposes `data-nameplate-id`; character-specific work should stay asset-owned instead of adding effect fields to APIs or Prisma.
- Sigrika's owner/motion split proves that layout/static appearance and keyframes can be isolated in separate CSS files while scene scale remains shared.
- The July 16–17 task history exposes the repeatable failure modes: visual language drift, raster-edge clipping, CSS overflow confusion, unsafe username padding, full-surface haze, blink-only perceived lighting, late cascade overrides, and unrelated dirty-worktree leakage.
- `scripts/pngTrim.mjs` handles trimming but does not encode a full delivered-asset contract; a separate validator should inspect the final canvas rather than mutate it.
- `scripts/export-skill-gifs.mjs` proves a Trellis-task-local Vite harness can import real app components and be captured by Playwright without adding a production route.

## Chosen architecture

1. Project-local Skill in `.agents/skills/create-character-nameplate/` so paths and contracts evolve with SigrikaGo.
2. High-freedom research and visual-language guidance in Skill instructions/references.
3. Low-freedom scripts for final PNG validation and preview harness setup/capture.
4. Mandatory human gate after four concept directions.
5. Separate `new` and `refine` modes, with diagnosis required before edits in refine mode.
6. Data/reward wiring is opt-in only when explicitly requested.
7. Development preview harness accelerates iteration; final app-surface checks remain required.

## Resource layout

```text
.agents/skills/create-character-nameplate/
  SKILL.md
  agents/openai.yaml
  scripts/
    validate_nameplate_asset.mjs
    prepare_nameplate_preview.mjs
  references/
    input-and-visual-language.md
    asset-and-motion-contract.md
    integration-and-qa.md
  assets/preview-harness/
    index.html
    src/main.jsx
    src/preview.css
```

## Validation strategy

- Unit-test the validator with synthetic pass/fail PNG fixtures generated during the test, not committed image clutter.
- Contract-test Skill metadata, mandatory human gate wording, project paths, and preview isolation.
- Run the official skill validator on the final folder.
- Forward-test with a fictional/new character request up to the concept-plan boundary, without generating or modifying a production asset.
