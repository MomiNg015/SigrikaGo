# Costume System Contract

> Cross-layer contract for the Residual Star costume shop, character wardrobe, portrait resolution, persistence, and administration.

## 1. Scope / Trigger

- Trigger: any change to costume Prisma models, player/admin costume APIs, costume assets, the shop or handbook wardrobe, global character portraits, candy-effect portraits, or room/replay portrait snapshots.
- Costume ownership and equipment are permanent account state. Shop batches and mascot copy are modal-session UI state.
- Character ownership and costume ownership are separate gates: the catalog may show a locked costume, but purchase and equipment require the base character.

## 2. Signatures

### Database

- `Costume { id, name, characterSlug, portraitUrl, candyEffectPortraitUrl, portraitScalePercent, portraitOffsetXPercent, portraitOffsetYPercent, description, illustName, illustUrl, priceCoins, discountPercent, shopVisible, purchasable, enabled, sortOrder, source, createdAt, updatedAt }`.
- `UserCostume` owns one unique `(userId, costumeId)` pair.
- `UserCostumeEquipment` owns one unique `(userId, characterSlug)` pair.
- `GameRecord` stores each side's costume id, portrait URL, display scale, horizontal offset, and vertical offset.

### Player API

- `GET /api/costumes` -> `{ costumes, ownedCostumeIds, equippedCostumes }`.
- `POST /api/costumes/:id/purchase` -> `{ user, costume }`.
- `POST /api/costumes/equip` body `{ characterSlug, costumeId }` -> `{ user, characterSlug, costumeId }`.
- `costumeId: "default"` removes the character's equipment row and returns to the permanent base portrait.

### Admin API

- `GET /api/admin/costumes` -> `{ costumes }`.
- `POST /api/admin/costumes` creates one catalog row.
- `PATCH /api/admin/costumes/:id` updates mutable catalog fields; the stable URL id is not renamed.

### Shared resolution

- `resolveCharacterPortrait(character, { itemEffects, user, equippedCostumes, costumeSnapshot })` returns the effective portrait URL.
- `resolveCharacterPortraitPresentation(...)` returns the URL plus normalized framing, and `characterPortraitImageProps(...)` exposes render-ready image props.
- `finalCostumePrice(costume)` uses `ceil(priceCoins * (100 - discountPercent) / 100)`, clamped to a non-negative safe integer.

## 3. Contracts

- Player catalog rows expose the normalized admin fields plus `finalPrice`, `owned`, `characterOwned`, and `equipped`.
- Player listing returns enabled costumes. Shop visibility and purchase flags still gate store selection and settlement; the handbook may render the complete enabled character catalog.
- The costume shop shows at most five unowned rows per batch. Purchasable rows for owned characters are selected before gray locked rows for unowned characters. Its stage reuses Zahira's measured `layoutShopCards` contract so one to five visible products are centered according to the actual count without empty placeholder slots.
- A purchase runs in one Prisma transaction: re-read user, costume, and ownership; atomically decrement coins with `coins >= finalPrice`; create `UserCostume`; write the progress ledger; return the refreshed public user.
- Purchasing never equips implicitly. The success dialog may offer equipment, but declining equipment must keep the just-purchased costume owned.
- The wardrobe always includes a virtual `default` card. Default is not a `UserCostume` row and is equipable only when the user owns the base character.
- Unowned costume cards remain inspectable but gray. Their equipment button is natively disabled and has no extra warning flow.
- Disabling a costume or changing its target character deletes matching equipment rows but keeps ownership rows.
- `publicUser()` and every player projection that renders a portrait must carry `equippedCostumes`.
- Portrait precedence is:
  1. explicit room/replay `costumeSnapshot`;
  2. supplied/account equipped costume;
  3. base character portrait.
- Costume framing defaults to `100/0/0`; scale accepts `50..150`, and each offset accepts `-50..50`. Framing applies to wardrobe thumbnails and effective equipped-character portraits, but not to shop product art or costume detail art.
- For Denia's rainbow candy effect, use the equipped costume's `candyEffectPortraitUrl` and costume framing when configured; otherwise fall back to the base candy portrait at `100/0/0`. A costume without a candy asset must not suppress the candy effect.
- Match creation snapshots `{ id, portraitUrl, candyEffectPortraitUrl, portraitScalePercent, portraitOffsetXPercent, portraitOffsetYPercent }` into the room player. Result persistence copies the effective costume id, portrait URL, and framing into `GameRecord`; replay and result UI read snapshots rather than current account equipment.
- Character, costume, and costume candy-effect portraits configured as local `/assets/...` URLs are normalized through `npm run portraits:normalize`: crop to the union of non-zero alpha bounds, preserve aspect ratio and complete visible content, fit the longest edge to a shared 792px safe box, and bottom-center it with a 54px margin on a transparent 900x900 per-frame canvas. Static inputs encode as lossless WebP. Animated WebP inputs preserve every frame, per-frame delay, and loop metadata; every frame uses the same union-bounds transform so animation does not jump, and assets marked `requiresAnimation` fail validation if reduced to one frame. `npm run check:portraits` is part of the repository gate and rejects local catalog portraits that drift from this contract; HTTP(S) URLs are supported but skipped without fetching. The three costume-shop mascot states remain independent 1024x1024 compositions and are outside this portrait contract.
- Built-in normalized portraits use new current URLs while legacy files remain committed for room/replay snapshots that preserve old URL plus framing. `migrateBuiltinPortraitAssets()` updates only exact untouched default character/costume rows and resets those costume rows to `100/0/0`; it must not change custom admin rows, ownership/equipment, rooms, or `GameRecord` history.
- The costume shop title is exactly `残星会cosplay部` and remains a complete single line. Each price badge is a child of the shrink-wrapped `.costume-shop-art` owner so it overlaps the visible portrait's lower-right corner rather than the surrounding grid slot.
- A costume product detail reuses Zahira's `.shop-item-detail-modal`, `.shop-detail-art`, `.shop-detail-copy`, and `.shop-detail-stats` structure. Costume-specific classes are theme modifiers only; the bottom stats slot contains the purchase button instead of Zahira's ownership row.
- A settled detail purchase attempt always closes the costume detail in `finally`. Only a truthy successful purchase result opens the sibling `CostumePurchaseEquipDialog`; rejection or a falsy result shows no equipment prompt. The prompt equips only after the explicit confirmation and closes only when that equipment request succeeds.
- Zahira and Nivora mascot feedback is explicit modal state, not a timer. Purchase success or failure copy and portrait remain until refresh, shop switch, close/reopen, or another explicit state transition; shop hooks must not schedule delayed resets.
- Costume products reuse Zahira's per-batch slight rotation and vertical float parameters. The portrait and nested price badge stay inside the same transform wrappers, pause together on hover/focus/press, and stop continuous floating under reduced motion.
- The wardrobe and costume detail are sibling top-level overlays under the app portal root. A costume detail backdrop must never be a positioned child of the wardrobe dialog. The card detail trigger stays transparent and shadowless; equipped state color belongs to the outer `.character-costume-card.is-equipped`.
- `Costume` is part of `ADMIN_DEFAULT_CONFIG`. Startup creates missing default rows without overwriting admin-edited rows; explicit admin-default sync remains the overwrite-capable deployment path.
- `ensureCostumeSchema()` creates costume tables/indexes before default seeding for legacy development databases. `ensureGameModeSchema()` adds missing `GameRecord` costume snapshot columns before runtime record operations.

## 4. Validation & Error Matrix

| Condition | Result |
|---|---|
| Costume id is not 2-64 lowercase letters, numbers, or hyphens | Admin `400` validation error |
| Missing name, character, valid portrait URL, or non-negative integer price | Admin `400` validation error |
| Scale is outside `50..150`, or an offset is outside `-50..50` | Admin `400` validation error |
| Asset URL is neither `/assets/...` nor HTTP(S) | Admin `400` validation error |
| Costume target character does not exist | Admin `400` |
| Create uses an existing costume id | Admin `409` |
| Update target does not exist | Admin `404` |
| Purchase target is missing, disabled, hidden, or not purchasable | Player `400`, `服装不可购买` |
| User already owns the costume | Player `400`, `已拥有该服装` |
| User does not own the base character | Player purchase `400`, `需要先拥有对应角色`; equip `400`, `尚未拥有该角色` |
| Coin balance is below `finalPrice`, including an update race | Player `400`, `金币不足`; transaction creates no ownership |
| Costume purchase rejects or returns no purchased costume | Detail closes; equipment prompt remains absent |
| Costume purchase returns a purchased costume | Detail closes; centered equipment prompt opens with that costume |
| Equipment confirmation rejects or returns false | Prompt remains open so the user can retry or decline |
| Equipment target is disabled or belongs to another character | Player `400`, `服装不可装扮` |
| Equipment target is not owned | Player `400`, `尚未拥有该服装` |
| Default equipment requested for an owned character | Delete only that character's equipment row |
| A catalog asset marked `requiresAnimation` decodes to fewer than two frames | `npm run check:portraits` fails with an animation-required error |
| An animated portrait's per-frame canvas, alpha union, safe box, anchor, or file-size limit drifts | `npm run check:portraits` fails with the corresponding portrait validation error |

## 5. Good / Base / Bad Cases

- Good: buy a 600-coin Denia costume with 800 coins; one transaction returns 200 coins, ownership, a `costume.purchase` ledger entry, and no automatic equipment.
- Good: disable an equipped costume in admin; ownership remains, equipment resets to default, and future portrait projections use the base character.
- Good: start a match while a costume is equipped, then change clothes or its admin framing later; the room, result, and replay keep the start-time portrait and framing.
- Good: open a costume detail from the wardrobe; the detail backdrop covers the viewport as a sibling overlay while the wardrobe remains dimmed behind it.
- Good: resize the shop to portrait mobile; the complete `残星会cosplay部` title remains on one line and each price badge still overlaps its alpha-cropped portrait.
- Good: refresh from five visible costumes to three or one; the measured stage recenters only the existing product cards, and each portrait plus price badge floats and rotates as one unit.
- Good: buy a costume from its Zahira-shaped detail; the detail closes, then one centered prompt offers immediate equipment without equipping implicitly.
- Good: fail a costume purchase; the detail still closes, no equipment prompt appears, and Nivora's failure feedback remains visible until an explicit action changes it.
- Good: normalize the 16-frame Denia candy WebP; all frames use one union-bounds transform and retain their authored 70ms delays and infinite loop.
- Base: a user owns the base character but no costumes; the wardrobe shows default first and enabled unowned costumes gray.
- Base: a costume has no candy portrait; Denia's active candy effect uses the existing base candy art.
- Bad: derive replay portraits from the current account equipment, because historical matches would visually change.
- Bad: deduct coins before entering the ownership transaction or trust the client-reported price.
- Bad: hide locked-character costumes from the store when the product contract requires gray discovery rows.
- Bad: delete `UserCostume` ownership when an admin disables a catalog row.
- Bad: put an opaque button surface inside an equipped wardrobe card, because it hides the outer pale-green equipped state.
- Bad: anchor a shop price badge to the full grid slot or a padded square image canvas, because the badge will float below the visible character.
- Bad: hardcode costume slots with `nth-child` columns or animate the price badge outside the portrait card, because counts below five leave holes and the product separates while moving.
- Bad: reset either shop mascot with `setTimeout`, because feedback disappears while the player is still reading it and timer cleanup can race with shop switching.
- Bad: keep the costume detail mounted after settlement or open the equipment prompt from a failed request.
- Bad: open an animated portrait with the default single-page decoder before normalization, because the output silently becomes a static first frame.

## 6. Tests Required

- Schema and migration tests assert all three costume models, uniqueness/indexes, and all costume/framing `GameRecord` snapshot fields.
- `server/costumes.test.js` covers validation, schema guard SQL, listing projection, atomic purchase, character ownership, default equipment, and owned costume equipment.
- Admin tests cover create/update audits, duplicate ids, character existence, and equipment reset on disable or character reassignment.
- Route tests cover authentication and player/admin endpoint wiring.
- Snapshot/export/seed tests assert all costume fields survive bootstrap export and create-only startup seeding.
- Shop helper and modal tests cover five-row selection, owned-character priority, gray locks, independent refresh state, insufficient-funds copy, persistent mascot feedback without timers, purchase persistence, detail closure on both purchase outcomes, success-only equipment prompting, and optional post-purchase equipment.
- Wardrobe tests cover virtual default ordering, gray unowned cards, disabled equipment, immediate equipment, and detail-card behavior.
- Wardrobe DOM/CSS tests assert the detail backdrop is a direct app-root overlay, the trigger surface is transparent and shadowless, and the equipped outer card owns the pale-green state.
- Shop source/CSS tests assert the exact non-wrapping title, alpha-trimmed WebP dimensions, shrink-wrapped art owner, price positioning inside that owner, measured count-aware layout reuse, whole-card motion wrappers, hover pause, and reduced-motion fallback.
- Portrait normalization tests cover alpha trimming, shared canvas/safe-box geometry, bottom-center anchoring, WebP/alpha validation, idempotence, catalog discovery, remote skips, exact built-in migration guards, animation frame/timing/loop preservation, shared frame placement, static-output rejection for `requiresAnimation`, and the committed Denia asset's 16×70ms contract.
- Portrait tests cover base/equipped/snapshot precedence, normalized framing, and candy fallback.
- Room factory/view/result/replay tests assert the start-time costume id, URL, and framing survive the full record path.
- CSS contracts cover shared import-only splits, Bright School overlay order, final-mobile placement, reduced motion, and non-growth metrics.

## 7. Wrong vs Correct

Wrong:

```js
await prisma.user.update({
  where: { id: userId },
  data: { coins: { decrement: clientPrice } }
});
await prisma.userCostume.create({ data: { userId, costumeId } });
```

Correct:

```js
await prisma.$transaction(async (tx) => {
  const costume = await tx.costume.findUnique({ where: { id: costumeId } });
  const price = finalCostumePrice(costume);
  const changed = await tx.user.updateMany({
    where: { id: userId, coins: { gte: price } },
    data: { coins: { decrement: price } }
  });
  if (changed.count !== 1) throw routeError(400, "金币不足");
  await tx.userCostume.create({ data: { userId, costumeId, source: "purchase" } });
});
```

Wrong:

```js
const portraitUrl = user.equippedCostumes[player.character]?.portraitUrl;
```

Correct:

```js
const portraitUrl = resolveCharacterPortrait(character, {
  itemEffects: player.itemEffects,
  costumeSnapshot: player.costumeSnapshot
});
```

The room snapshot is authoritative for an in-progress or recorded match; account equipment is authoritative only before the snapshot boundary.

Wrong:

```jsx
<section className="character-costume-dialog">
  <div className="character-costume-detail-backdrop">...</div>
</section>
```

Correct:

```jsx
<>
  <ModalDialog className="character-costume-dialog">...</ModalDialog>
  <div className="modal-backdrop character-costume-detail-backdrop">...</div>
</>
```

The detail overlay is a portal-root sibling, so parent overflow and descendant-position overrides cannot turn it into inline content.

Wrong:

```css
.costume-shop-card-slot:nth-child(1) { grid-column: 2 / span 2; }
.costume-shop-card-slot:nth-child(2) { grid-column: 4 / span 2; }
```

Correct:

```jsx
const size = useShopStageSize(stageRef);
const placements = layoutShopCards({
  width: size.width,
  height: size.height,
  count: batch.length,
  mobile: size.mobile,
  seed: (batchVersion * 97) + batch.length
});
```

Count-aware measured placements keep one to five products centered. The portrait and its nested price badge must then be rendered inside the same shared scale, rotation, and float wrappers.

Wrong:

```js
const frame = await sharp(animatedInput).png().toBuffer();
```

Correct:

```js
const decoded = await decodePortraitFrames(animatedInput);
const bounds = await alphaBoundsAcrossFrames(decoded.frames);
```

Decode every page, calculate one alpha-union transform, normalize every frame with that transform, then rejoin with the source `delay` and `loop`. Assets marked `requiresAnimation` must also fail read-only validation when only one page remains.

Wrong:

```js
const purchased = await onPurchase(costume);
if (purchased) {
  setShowEquipPrompt(true);
  setTimeout(resetMascot, 5000);
}
```

Correct:

```js
let purchased = null;
try {
  purchased = await onPurchase(costume);
} finally {
  onClose();
}
if (purchased) onPurchaseSuccess(purchased);
```

Purchase settlement owns detail closure, while the parent owns the sibling equipment prompt. Mascot feedback changes only through explicit shop actions.
