# Story Sprite And Expression Contract

## Denia rainbow spray animation (2026-10-10)

`denia-rainbow-glow` is a dedicated script-owned identity using the current chibi sprite. It does not join the default expression profile. `DENIA_CANDY_PORTRAIT_ASSET.storyUrl` is the native 832x1216 animated WebP; `storyStillUrl` is its reduced-motion frame. `EXTRA_STORY_PORTRAITS` declares chibi presentation, static companion and current default fallback. The story resolver propagates those properties and preloads the actual native animation. StoryPlayer's picture source removes itself on fallback, avoiding repeated failures under reduced motion.

Export with `node scripts/export-denia-rainbow.mjs`: reuse the accepted surprised sprite, composite three independently calibrated vector jets, restore every untouched source pixel after alpha compositing and verify each frame. 24 frames at 60ms loop continuously; the body is stationary. The persistent candy URL retains its normalized 900px canvas/792px safe box. Update its legacy WebP source too, so future normalization cannot restore retired art. Do not change story text/state or costume-specific candy-effect precedence. Keep native frames, effect SVGs, source hash and GIF delivery in the output work package.

## Facial cleanup acceptance (2026-10-10)

Do not treat original brows, eyelid creases or lash tails as protected hair. Cleanup masks must cover the entire old feature, including outer corners; extraction masks follow the new expression positions independently. A feature-free local plate may be opaque RGB even though every final PNG/WebP retains exact original alpha. Reject transparent holes, shading disks and misregistered hair contours in plates before assembly. Inspect native outputs after the final protected-source restore, not only candidate sheets or numerical masks. Review all expressions per role, including closed eyes and wink, and independently retain freckles, covered eyes and accessories. `characterStorySprites.test.js` samples original high brow ink against repaired closed-eye art as a regression check; this complements, rather than replaces, full visual review.

## Candy dialogue authored defaults (2026-10-10)

`authoredCandyExpressionsData.js` extends the same exact-match sidecar for `item.rainbow-bean-candy.{sigrika,denia,aemeath,lynae}`: 5, 5, 14 and 15 ordinary character lines respectively. Apply before username interpolation in admin draft/published and player payload construction; existing stored JSON needs no rewrite. Edited text/role/node/key and any explicit presentation field disable fallback. Narration stays unlabelled. Denia's three `denia-rainbow-glow` nodes and Sigrika corruption placeholders retain script-owned presentation. Verify complete ordinary dialogue coverage, valid catalog selections, source graph equivalence, persisted payloads and explicit opt-outs in `server/rainbowBeanCandyStory.test.js`.

## Seven additional chibi sets (2026-10-10)

Aemeath, Lynae, Mornye, Chisa, Changli, Qiuyuan and Nabomo use their current default Q sprites in independently calibrated `{id}-chibi-v1` work packages. Each has twelve native expressions: original, smile, serious, surprised, worried, sad, angry, embarrassed, closed_smile, thinking and two role-specific emotions. Full-head avatar crops are `[0,0,832,832]`. Closed smile and thinking are genuine distinct art for these seven, not source aliases. Aemeath retains its appearance ID and historical annoyed selection through `annoyed -> angry`. Sigrika, Denia and Baconbits are outside this production change.

Import selected profiles only, preserving unrelated manifest entries. Native original must match the default handbook Q sprite pixels. New expressions retain native alpha and pixels outside measured facial regions; protected bangs, accessories and freckles remain source pixels. Keep candidates, prompts, affine landmark alignment, rig, PSD and independent verification in each work package. Contact-sheet cells must be inspected before splitting: image tools may change cell geometry, omit clean plates or produce incomplete crops. Reject visible registration defects even when numerical source protection passes.

## Chibi runtime replacement (2026-10-08)

Sigrika and Denia keep their existing `*-standard-v1` appearance identifiers and URL locations so published explicit selections and exact-text authored defaults both use the new chibi art. Profiles specify `presentation: "chibi"`, source packages `sigrika-chibi-v1` / `denia-chibi-v1`, and fixed avatar crops `[140,100,520,520]` / `[190,100,540,540]`. Aemeath's later replacement is described above.

Historical expression source aliases: closed_smile -> smile and thinking -> serious for both; Denia additionally maps playful -> smile, sleepy -> sad and annoyed -> angry. Direct sad/worried/angry/embarrassed options are exposed as available per role. No runtime text-based inference is added. Import selected profiles with `node scripts/import-story-sprites.mjs --source-root output/character-expressions --characters sigrika,denia`; retain unselected manifest profiles and record source expression, package and hash.

## 1. Scope / Trigger

Use this contract when changing story appearance fields, standard illustration assets, tutorial/home guide expressions, editor selectors or story workbook columns. This rollout covers existing onboarding windows, teaching NPC bubbles and the fixed home tour. Other gameplay portraits and handbook cards keep their existing resource entry points; candy dialogue uses the scoped defaults described above.

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

`CHARACTER_STORY_SPRITES` owns the nine default chibi profiles, using `{id}-standard-v1` appearance IDs. Historical source package `amis-sprite-expressions` maps to runtime `aemeath`; do not add a global `amis` alias. Story-local Chinese character names resolve to these profiles; dedicated `denia-rainbow-glow` remains a separate script-owned animation identity.

Fields missing entirely permit authored fallback. Presence of either field, including an empty value, disables fallback. Valid appearance with empty expression uses `smile`. An explicitly empty appearance with empty expression selects legacy art.

The authored sidecar is keyed by script key, node ID, canonical role and the exact un-interpolated text. `onboarding.default`, `home.onboarding` and the four implemented candy script keys participate. Apply it in admin/player payload construction before username interpolation. A different text, role or key does not reuse the old expression. Current published onboarding has 225 nodes and 169 character lines; all non-presentation fields must remain equivalent. The fixed home tour has 33 steps and 29 lines after the 2026-10-27 document revision. Aemeath has no onboarding lines and must not be inserted into the plot.

Story actors never inherit account costumes, framing or account effects. Valid authored appearance fixes narrative clothing and expression; unsupported/unknown selections and resource-error fallbacks use the default character portrait. Explicit special character IDs remain script-owned identities. Apply this rule to story windows, teaching bubbles, home tours and future item-story consumers through the shared resolver.

Full images are lossless transparent 832x1216 WebP at `/assets/characters/story-sprites/<id>/<expression>.webp`; avatars are separately cropped 256x256 transparent WebP with `-avatar` suffix. Same profile uses the same canvas and crop for every expression. The importer checks all source alpha and visible RGB pixels after full-image conversion. `manifest.json` records source hashes and crops.

Story windows preload only story-window expressions, using the same resolver as display and four workers. Teaching bubbles and the home tour display/preload fixed expression avatars (`variant: "avatar"`), including default stage NPC fallbacks and explicit script special identities, without account costumes/effects. Keep global startup/default portrait loading separate. Presentation geometry follows [Story Guide Layout](../frontend/story-guide-layout-contract.md).

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
- Base: NPC with blank `characterId` uses the current stage NPC; preload its same default portrait URL, ignoring account costumes.
- Bad: changing a skill role leaves the previous role's appearance ID; clear both fields in the same patch.

## 6. Tests Required

- `characterStorySprites.test.js`: all 225 nodes equivalent after removing the two fields; all 169 lines covered; exact-text guards, interpolation order, explicit opt-out, publication errors, unknown read fallback, special states, fixed narrative appearance, preload variants, 64 runtime files and alpha consistency.
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

Correct: teaching/home bubbles request the derived avatar variant, keep a fixed square portrait column beside the growing text frame, and preserve its geometry across typing, expressions and fallback. Story stages use full illustrations with independent crop geometry.
