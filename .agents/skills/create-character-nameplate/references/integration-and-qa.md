# Integration and QA contract

## Integration map

Inspect these owners before editing:

- shared DOM: `src/shared/UserIdentity.jsx`;
- base/import entry: `src/styles/hud-components/user-identity.css` and its child imports;
- asset owners: `src/styles/hud-components/user-identity/`;
- final cascade repairs: `src/styles/mobile-adaptive/user-nameplate-final.css`;
- component contract: `src/shared/UserIdentity.test.jsx`;
- CSS contract: `src/styles/hudComponents.test.js`;
- import/inventory contracts: `src/styles/styleContract.test.js`, `src/styles/cssLayerInventory.js`, `src/styles/cssLayerInventory.test.js`;
- raster/preload assertions: `src/home/HomeScreen.test.jsx` and asset preload tests;
- architecture: `.trellis/spec/frontend/quality-guidelines.md`, `.trellis/spec/frontend/css-architecture.md`, `docs/system-design.md`.

Search current paths instead of assuming this list never changes.

## Owner files

Create a focused `<role>-nameplate.css` and `<role>-motion.css` under the user-identity domain. Import them from the existing domain entry. Keep entries containing `@import` import-only.

Use exact selectors:

```css
.user-identity[data-nameplate-id="<asset-id>"] { ... }
```

Do not change generic base geometry to fit one role. Do not branch in every consumer. Do not add a backend effect field for code-owned motion.

Start from:

- `assets/templates/nameplate-owner.css`
- `assets/templates/nameplate-motion.css`

Replace every `__PLACEHOLDER__`. The templates define ownership and performance boundaries, not a visual style.

## Development preview

Prepare a task-local harness after the owner is importable:

```powershell
node .agents/skills/create-character-nameplate/scripts/prepare_nameplate_preview.mjs `
  --task-dir .trellis/tasks/<task> `
  --asset-id <id> `
  --image-url <url> `
  --style <optional-owner-path>
```

The generated page renders:

- `Alice_12`;
- four CJK characters;
- a legacy overlong username;
- a title + independent text badge + nameplate combination;
- normal, compact, and phone-like scale rows.

Capture evidence:

```powershell
node .agents/skills/create-character-nameplate/scripts/capture_nameplate_preview.mjs `
  --preview-dir .trellis/tasks/<task>/nameplate-preview `
  --output-dir .trellis/tasks/<task>/research/nameplate-preview
```

The capture script produces `1440x900`, `1024x768`, and `375x812` screenshots with normal and reduced motion. These are task artifacts, not production assets.

## Browser QA matrix

| Surface | Required check |
|---|---|
| Home plaque | Final theme winner, adjacent stats, no button clipping |
| Personalization try-on | Draft/saved state and image preload |
| Room player strips | Desktop + portrait scale, title/badge coexistence |
| Leaderboard | Dense repeated rows, no overflow |
| Friends/blacklist/watch | Compact identity alignment |
| Profile | Full identity stack and long-name fallback |
| Result | Winner/player identity remains centered and readable |

For each relevant surface, inspect bounding boxes, computed color/text-shadow/overflow/filter, horizontal document overflow, and hit testing over the effect layer.

## Required test matrix

- `UserIdentity`: exact asset id, background/effect/text layers, ordinary fallback, title + badge coexistence, no per-name font variable.
- Owner/motion: exact geometry, scene scale, pointer transparency, persistent light declaration, transform/opacity keyframes, reduced-motion.
- Asset: exact PNG dimensions, RGBA decode, transparent corners, four-edge Alpha margins, declared safe-zone width.
- Imports/inventory: owner/motion imports, file-size guard, motion/reduced-motion registration, updated byte baseline when required.
- Preload: existing/new URL remains collected from equipped assets.
- Skill: metadata, mandatory human gate, `new`/`refine`, opt-in data boundary, validator pass/fail cases, preview generation, no production route registration.

Suggested focused command:

```powershell
npx vitest run scripts/characterNameplateSkill.test.js src/shared/UserIdentity.test.jsx src/styles/hudComponents.test.js src/home/HomeScreen.test.jsx src/styles/cssLayerInventory.test.js
```

Then run the official Skill validator, `npm run docs:system-design`, and `npm run check`.

## Handoff and git safety

1. Snapshot dirty paths before work and again before staging.
2. Separate task-owned changes from pre-existing role assets/docs hunks.
3. If generated system-design HTML contains an unrelated markdown hunk, stage a clean task-only generated version, then restore/regenerate the unrelated working copy.
4. Never stage task concepts, screenshots, temporary harness output, logs, or unselected images as production assets.
5. Do not push unless explicitly requested.
