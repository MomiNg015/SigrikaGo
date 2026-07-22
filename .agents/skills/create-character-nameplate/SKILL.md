---
name: create-character-nameplate
description: Create or refine character-specific achievement username nameplates for SigrikaGo, including text-first dossier research, four hand-painted concept directions, transparent PNG delivery, exact asset-ID CSS motion, local preview capture, integration tests, and safe handoff. Use when Codex is asked to research a character archive or make, redesign, repair, animate, validate, or integrate a character-themed username background/nameplate in this repository.
---

# Create Character Nameplate

Build each nameplate as character storytelling, not a recolored generic effect. Keep creative decisions human-gated and mechanical checks deterministic.

## Start safely

1. Ensure a Trellis task exists before repository writes. Read the active PRD and the frontend CSS/quality specs.
2. Inspect `git status --short`; record unrelated dirty paths and exclude them from every commit.
3. Inspect `src/shared/UserIdentity.jsx`, its tests, the user-identity CSS import tree, `mobile-adaptive/user-nameplate-final.css`, `cssLayerInventory.js`, preload collection, and the target asset/owner when present.
4. Determine the mode:
   - `new`: no committed asset owner exists, or the user requests a new visual identity.
   - `refine`: the artwork/direction already exists and the user requests clipping, readability, motion, sizing, or cascade repair.
5. Treat achievement/reward seed and data wiring as out of scope unless the user explicitly requests a new achievement or reward.

Read [references/input-and-visual-language.md](references/input-and-visual-language.md) for research and concept work. Read [references/asset-and-motion-contract.md](references/asset-and-motion-contract.md) before producing or editing the final raster/CSS. Read [references/integration-and-qa.md](references/integration-and-qa.md) before project integration and handoff.

## Phase 1: Build the visual-language card

Resolve repository facts yourself. Read a supplied character page as a textual dossier, not an image gallery: inspect its body copy and relevant tabs, accordions, anchors, and linked dossier sections. Prefer official/primary material and record source locators in the task research folder.

### Mandatory text-first evidence gate

Before writing the visual-language card or generating any concept, complete the coverage matrix in [references/input-and-visual-language.md](references/input-and-visual-language.md). Cover personality, biography, goals/values/conflicts, relationships, dialogue/voice, major plot development, abilities, meaningful objects/places/hobbies/foods, and achievement relevance. Copy every required category into the research artifact; do not merge, rename away, or omit rows. Mark each category `found`, `absent`, or `inaccessible`; never fill gaps from visual guesses.

Images are secondary corroboration for visible design facts. Image-only research is insufficient. If the textual matrix is incomplete because a dynamic or blocked page cannot be read, exhaust available browser/DOM navigation, report the inaccessible sections, and request the missing text. Do not proceed to concepts.

For every selected motif, palette/material choice, and motion verb, record `textual evidence -> interpretation -> visual decision`. Reject any decision that cannot be traced to the dossier, achievement meaning, or an explicit user direction.

Write a compact visual-language card containing:

- personality and emotional temperature;
- role, story, powers, hobbies, places, and meaningful objects;
- primary/secondary/accent colors and material/mark-making language;
- 3–5 high-confidence representative motifs;
- explicit forbidden or misleading motifs, including user rejections;
- static composition language and motion verbs;
- username safe zone and runtime size.

Do not convert every biographical fact into decoration. Select a coherent visual sentence with one primary anchor, one supporting motif family, and one tail/closure language.

## Phase 2: Explore four directions

For `new` or major visual redesign work, generate four separate concepts with the same delivery ratio. Each must differ in composition and narrative emphasis, not only color.

- Keep username/character names, letters, logos, and branding out of the raster.
- Show the intended username safe area as quiet artwork, not as baked sample text.
- Evaluate every concept at the real runtime height before presenting it.
- Use the available image-generation/editing skill for bitmap work. Inspect user references before editing.
- Store concepts under the active task, never under the production asset URL.

### Mandatory human gate

After presenting four concepts, stop. Do not choose for the user, remove backgrounds, overwrite a production asset, write asset-specific CSS, or integrate code until the user explicitly selects a direction or requests a revision.

Skip four-direction exploration only in `refine` mode when the user has explicitly locked the existing artwork and requests a technical repair. Diagnose first and preserve the chosen art.

## Phase 3: Prepare and validate the final asset

After selection:

1. Generate/edit against a removable solid key background when transparency is unreliable.
2. Remove the key cleanly; inspect edge fringing at source scale.
3. Trim accidental transparent waste, then uniformly scale and center the subject into the final canvas with deliberate safety margins. Never stretch the left core or right tail independently.
4. Match the raster ratio exactly to the exact-ID runtime slot ratio.
5. Run the deterministic validator:

```powershell
node .agents/skills/create-character-nameplate/scripts/validate_nameplate_asset.mjs `
  <asset.png> --width 1125 --height 240 `
  --min-left 40 --min-right 40 --min-top 8 --min-bottom 8 `
  --safe-left 315 --safe-right 990 --min-safe-ratio 0.5
```

Tune the numbers to the declared asset contract; do not weaken them merely to make a failing image pass. The validator checks final geometry and Alpha. Human visual review still owns motif integrity, text contrast, and whether the declared safe zone is actually quiet.

## Phase 4: Design asset-owned motion

Use exact `data-nameplate-id` selectors and the existing background/effect/text layers. Start from the templates in `assets/templates/`, then replace every placeholder and every generic visual value with character-derived choices.

Build three motion roles:

1. Persistent primary illumination: a continuously visible alpha-following rim or illustration-aligned carrier light.
2. Local narrative motion: one or two motions tied to the character motif, such as sunlight breathing, water drift, ink settling, petal lift, or device pulse.
3. Secondary accents: sparse glints/stars/particles that support rather than carry perceived illumination.

Animate only `transform` and `opacity`. Keep blur, shadow, gradient, and filtering static. Effects must be `aria-hidden`, pointer-transparent, layout-neutral, and frozen into a readable static state under `prefers-reduced-motion: reduce`.

Reject these defaults unless the character research specifically justifies them: full-width glossy sweep, full-surface screen haze, continuously rotating generic ring, generic esports neon, blink-only lighting, or the prior character's motif/color vocabulary.

## Phase 5: Integrate and preview

1. Keep generic nameplates unchanged. Add one exact-asset owner and motion file, then update import/motion/inventory contracts.
2. Add a late exact-asset mobile/theme winner only after computed-style evidence proves a later broad rule defeats the owner.
3. Prepare the task-local preview harness:

```powershell
node .agents/skills/create-character-nameplate/scripts/prepare_nameplate_preview.mjs `
  --task-dir .trellis/tasks/<active-task> `
  --asset-id <asset-id> `
  --image-url /assets/achievements/<asset.png>
```

Pass `--style <repo-css-path>` only when previewing an owner that is not yet reachable from `/src/styles.css`; do not import an already registered owner twice.

4. Capture desktop, narrow, phone, and reduced-motion evidence:

```powershell
node .agents/skills/create-character-nameplate/scripts/capture_nameplate_preview.mjs `
  --preview-dir .trellis/tasks/<active-task>/nameplate-preview
```

The preview harness accelerates iteration but does not replace the final checks in real home, personalization, room/player strip, leaderboard, social/watch, profile, and result consumers.

## Phase 6: Verify and hand off

- Test a legal 8-half-width name, four CJK characters, a representative legacy overlong name, and title + independent badge + nameplate coexistence.
- Check `1440x900`, `1024x768`, and `375x812` with the full active theme cascade.
- Verify no bitmap clipping, CSS clipping, text collision, adjacent-stat overlap, horizontal overflow, pointer interception, or animation-only readability.
- Run focused component/preload/CSS/inventory tests, the Skill tests, the official Skill validator, docs generation, then `npm run check`.
- Update `.trellis/spec/frontend/quality-guidelines.md`, CSS architecture/inventory when affected, and `docs/system-design.md`; regenerate `docs/system-design.html`.
- Stage only task-owned paths. Preserve unrelated role assets, docs hunks, and local experiments.

## Diagnose refine-mode failures

Classify before editing:

- Raster-internal clipping: non-zero Alpha touches the canvas; CSS overflow cannot restore missing pixels.
- CSS/ancestor clipping: raster has margins but computed overflow or container bounds cut effect bleed.
- Safe-zone failure: fixed padding does not match the illustration or legal names.
- Perceived-light failure: persistent carrier/rim light is absent and only blink accents remain.
- Over-effect failure: full-surface blends wash out hand-painted detail at runtime size.
- Cascade failure: later theme/mobile `!important` rules win over the asset owner.
- Context failure: one shared consumer applies a different scale or alignment owner.

Fix the diagnosed layer and add a regression contract for that class of failure.
