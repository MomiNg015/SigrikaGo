# Story Sprite And Expression Contract

## 1. Scope / Trigger

Use this contract when changing story appearance fields, standard illustration assets, tutorial/home guide expressions, editor selectors or story workbook columns. This rollout covers existing onboarding windows, teaching NPC bubbles and the fixed home tour. Other gameplay portraits, candy scripts and handbook cards keep their existing resource entry points.

## 2. Signatures

- `normalizeStorySpriteSelection(node) -> { appearanceId?, expressionId? }`
- `storySpriteSelectionError(node) -> string` (empty means valid)
- `applyAuthoredGuideExpression(node, scriptKey) -> node`
- `applyAuthoredGuideExpressions(nodes, scriptKey) -> nodes`
- `resolveStoryPortraitPresentation(node, { characters?, character?, user?, variant? }) -> { src, fallbackSrc, standard, appearanceId, expressionId, style }`
- `storyAvatarUrls(nodes, { characters?, user?, fallbackCharacterIds? }) -> string[]`
- `storyGuidePortraitUrls(nodes, { characters?, user?, fallbackCharacterIds?, variant? }) -> string[]` defaults to full illustrations; the avatar helper delegates with `variant: "avatar"`.
- `node scripts/import-story-sprites.mjs --source-root <delivery-root>` writes registered assets and the manifest; input PNGs are read-only.
- Existing StoryScript draft/published JSON and API payloads carry the two optional strings. No Prisma column, migration, seed overwrite or database rewrite is required.

## 3. Contracts

```js
{
  id: "node-1", characterId: "sigrika",
  appearanceId: "sigrika-standard-v1", expressionId: "surprised",
  text: "哇，是新同学！你就是{username}吧？"
}
```

`CHARACTER_STORY_SPRITES` owns the legal three profiles: `sigrika-standard-v1`, `denia-standard-v1`, `aemeath-standard-v1`. Source package `amis-sprite-expressions` maps to runtime `aemeath`; do not add a global `amis` alias. Story-local Chinese character names resolve to these profiles; dedicated `denia-rainbow-glow` remains a separate legacy identity.

Fields missing entirely permit authored fallback. Presence of either field, including an empty value, disables fallback. Valid appearance with empty expression uses `smile`. An explicitly empty appearance with empty expression selects legacy art.

The authored sidecar is keyed by script key, node ID, canonical role and the exact un-interpolated text. Only `onboarding.default` and `home.onboarding` participate. Apply it in admin/player payload construction before username interpolation. A different text, role or key does not reuse the old expression. Current published onboarding has 225 nodes and 169 character lines; all non-presentation fields must remain equivalent. The fixed home tour has 24 steps and 22 lines. Aemeath has no onboarding lines and must not be inserted into the plot.

Valid authored standard appearance fixes narrative clothing and does not inherit equipped costume framing. Corrupted Sigrika and rainbow-glow Denia still have priority; unsupported/unknown selections use the old portrait resolver including costumes. Resource errors fall back to the resolved legacy URL.

Full images are lossless transparent 832x1216 WebP at `/assets/characters/story-sprites/<id>/<expression>.webp`; avatars are separately cropped 256x256 transparent WebP with `-avatar` suffix. Same profile uses the same canvas and crop for every expression. The importer checks all source alpha and visible RGB pixels after full-image conversion. `manifest.json` records source hashes and crops.

Story windows preload only story-window expressions, using the same resolver as display and four workers. Teaching bubbles and the home tour also display/preload full illustrations, including actual stage NPC fallbacks and special/costume resolution. Derived avatars remain available for future compact surfaces. Keep global startup/default portrait loading and the 900x900 catalog separate. Presentation geometry follows [Story Guide Layout](../frontend/story-guide-layout-contract.md).

Editor changes to any role selector clear both presentation fields, including skill-role selectors. Excel v1 adds optional `立绘造型ID` and `表情ID` columns. Missing columns preserve absent fields; present empty cells explicitly opt out. Import still changes a browser-local draft only, and published data remains read-only until existing publish actions.

## 4. Validation & Error Matrix

| Case | Draft/read | Publish/import |
| --- | --- | --- |
| Fields absent | Existing art or exact authored fallback | Allowed |
| Empty pair | Legacy art | Allowed |
| Valid appearance, omitted/empty expression | Default smile | Allowed |
| Appearance belongs to another role | Preserve historical nodes; render legacy | Reject `立绘造型与角色不匹配。` |
| Unsupported expression | Preserve historical nodes; render legacy | Reject `该角色没有此表情。` |
| Unknown future appearance | Preserve the entire script; render legacy | Reject unsupported selection |
| Image failure | Legacy URL, no repeated fallback loop | No plot interruption |

Do not throw for sprite metadata during JSON parsing: the existing catch would otherwise discard the entire script. Publishing validates after normalization; workbook errors retain sheet and row location.

## 5. Good / Base / Bad Cases

- Good: `node-1` receives surprised, `node-2` closed smile, explaining rules serious; every original option and timing remains intact.
- Base: an unchanged old database gets authored fields in the response without a write. Administrator explicitly selects original art to opt out.
- Bad: a new story reuses `node-1` but has unrelated text; it must not get onboarding's surprised face.
- Base: NPC with blank `characterId` uses the current stage NPC; preload its same resolved illustration/costume URL.
- Bad: changing a skill role leaves the previous role's appearance ID; clear both fields in the same patch.

## 6. Tests Required

- `characterStorySprites.test.js`: all 225 nodes equivalent after removing the two fields; all 169 lines covered; exact-text guards, interpolation order, explicit opt-out, publication errors, unknown read fallback, special states, fixed narrative appearance, preload variants, 54 files and alpha consistency.
- `StoryPlayerModal.dom.test.jsx`: same appearance image element survives expression change; src changes, original text remains, narration clears the image/name, image error falls back.
- `NpcDialogue.dom.test.jsx`: speaker/text/avatar change together, 256px path, null bubble cleanup.
- `StorySpriteFields.dom.test.jsx` and `storyScriptWorkbook.test.js`: role-specific choices, presentation-only patches, two-field round trip and legacy sheets without columns.
- `npx playwright test -c tests/e2e/story-sprites.config.js`: actual production story/teaching components at desktop, 390x844, 360x640; loaded images, expression change, long-text scrolling, reachable actions, Denia full art and avatar.
- `npx playwright test -c tests/e2e/home-onboarding.config.js`: existing real home tour geometry and actions.
- Final gate: `npm run check`.

## 7. Wrong vs Correct

Wrong: infer every face from text keywords at runtime or replace the published plot with a regenerated script.

Correct: author per-node presentation metadata against exact source text; apply a guarded sidecar to unchanged records and preserve the graph.

Wrong: render the entire transparent body with `object-fit: contain` in a 58px NPC slot, or enlarge a derived avatar as protruding artwork.

Correct: keep the original grid reservation and crop the full illustration inside an independent fixed bust frame; expression changes keep its framing stable.
