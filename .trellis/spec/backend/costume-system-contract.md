# Costume System Contract

> Cross-layer contract for the Residual Star costume shop, character wardrobe, portrait resolution, persistence, and administration.

## 1. Scope / Trigger

- Trigger: any change to costume Prisma models, player/admin costume APIs, costume assets, the shop or handbook wardrobe, global character portraits, candy-effect portraits, or room/replay portrait snapshots.
- Costume ownership and equipment are permanent account state. Shop batches and mascot copy are modal-session UI state.
- Character ownership and costume ownership are separate gates: the catalog may show a locked costume, but purchase and equipment require the base character.

## 2. Signatures

### Database

- `Costume { id, name, characterSlug, portraitUrl, candyEffectPortraitUrl, description, illustName, illustUrl, priceCoins, discountPercent, shopVisible, purchasable, enabled, sortOrder, source, createdAt, updatedAt }`.
- `UserCostume` owns one unique `(userId, costumeId)` pair.
- `UserCostumeEquipment` owns one unique `(userId, characterSlug)` pair.
- `GameRecord` stores `blackCostumeId`, `whiteCostumeId`, `blackCostumePortraitUrl`, and `whiteCostumePortraitUrl`.

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
- `finalCostumePrice(costume)` uses `ceil(priceCoins * (100 - discountPercent) / 100)`, clamped to a non-negative safe integer.

## 3. Contracts

- Player catalog rows expose the normalized admin fields plus `finalPrice`, `owned`, `characterOwned`, and `equipped`.
- Player listing returns enabled costumes. Shop visibility and purchase flags still gate store selection and settlement; the handbook may render the complete enabled character catalog.
- The costume shop shows at most five unowned rows per batch. Purchasable rows for owned characters are selected before gray locked rows for unowned characters.
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
- For Denia's rainbow candy effect, use the equipped costume's `candyEffectPortraitUrl` when configured; otherwise fall back to the base candy portrait. A costume without a candy asset must not suppress the candy effect.
- Match creation snapshots `{ id, portraitUrl, candyEffectPortraitUrl }` into the room player. Result persistence copies the effective costume id and portrait URL into `GameRecord`; replay and result UI read snapshots rather than current account equipment.
- Costume and mascot source PNGs are converted to lossless WebP under `public/assets/costumes/`. The five shop costume portraits are cropped to non-zero alpha bounds, scaled proportionally to at most 900px on either axis, and keep their tight rectangular canvas; the three mascot states keep a 1024x1024 transparent canvas. Runtime code references only committed WebP paths and does not hardcode the source PNG dimensions.
- The costume shop title is exactly `残星会cosplay部` and remains a complete single line. Each price badge is a child of the shrink-wrapped `.costume-shop-art` owner so it overlaps the visible portrait's lower-right corner rather than the surrounding grid slot.
- The wardrobe and costume detail are sibling top-level overlays under the app portal root. A costume detail backdrop must never be a positioned child of the wardrobe dialog. The card detail trigger stays transparent and shadowless; equipped state color belongs to the outer `.character-costume-card.is-equipped`.
- `Costume` is part of `ADMIN_DEFAULT_CONFIG`. Startup creates missing default rows without overwriting admin-edited rows; explicit admin-default sync remains the overwrite-capable deployment path.
- `ensureCostumeSchema()` creates costume tables/indexes before default seeding for legacy development databases. `ensureGameModeSchema()` adds missing `GameRecord` costume snapshot columns before runtime record operations.

## 4. Validation & Error Matrix

| Condition | Result |
|---|---|
| Costume id is not 2-64 lowercase letters, numbers, or hyphens | Admin `400` validation error |
| Missing name, character, valid portrait URL, or non-negative integer price | Admin `400` validation error |
| Asset URL is neither `/assets/...` nor HTTP(S) | Admin `400` validation error |
| Costume target character does not exist | Admin `400` |
| Create uses an existing costume id | Admin `409` |
| Update target does not exist | Admin `404` |
| Purchase target is missing, disabled, hidden, or not purchasable | Player `400`, `服装不可购买` |
| User already owns the costume | Player `400`, `已拥有该服装` |
| User does not own the base character | Player purchase `400`, `需要先拥有对应角色`; equip `400`, `尚未拥有该角色` |
| Coin balance is below `finalPrice`, including an update race | Player `400`, `金币不足`; transaction creates no ownership |
| Equipment target is disabled or belongs to another character | Player `400`, `服装不可装扮` |
| Equipment target is not owned | Player `400`, `尚未拥有该服装` |
| Default equipment requested for an owned character | Delete only that character's equipment row |

## 5. Good / Base / Bad Cases

- Good: buy a 600-coin Denia costume with 800 coins; one transaction returns 200 coins, ownership, a `costume.purchase` ledger entry, and no automatic equipment.
- Good: disable an equipped costume in admin; ownership remains, equipment resets to default, and future portrait projections use the base character.
- Good: start a match while a costume is equipped, then change clothes later; the room, result, and replay keep the start-time portrait.
- Good: open a costume detail from the wardrobe; the detail backdrop covers the viewport as a sibling overlay while the wardrobe remains dimmed behind it.
- Good: resize the shop to portrait mobile; the complete `残星会cosplay部` title remains on one line and each price badge still overlaps its alpha-cropped portrait.
- Base: a user owns the base character but no costumes; the wardrobe shows default first and enabled unowned costumes gray.
- Base: a costume has no candy portrait; Denia's active candy effect uses the existing base candy art.
- Bad: derive replay portraits from the current account equipment, because historical matches would visually change.
- Bad: deduct coins before entering the ownership transaction or trust the client-reported price.
- Bad: hide locked-character costumes from the store when the product contract requires gray discovery rows.
- Bad: delete `UserCostume` ownership when an admin disables a catalog row.
- Bad: put an opaque button surface inside an equipped wardrobe card, because it hides the outer pale-green equipped state.
- Bad: anchor a shop price badge to the full grid slot or a padded square image canvas, because the badge will float below the visible character.

## 6. Tests Required

- Schema and migration tests assert all three costume models, uniqueness/indexes, and the four `GameRecord` snapshot fields.
- `server/costumes.test.js` covers validation, schema guard SQL, listing projection, atomic purchase, character ownership, default equipment, and owned costume equipment.
- Admin tests cover create/update audits, duplicate ids, character existence, and equipment reset on disable or character reassignment.
- Route tests cover authentication and player/admin endpoint wiring.
- Snapshot/export/seed tests assert all costume fields survive bootstrap export and create-only startup seeding.
- Shop helper and modal tests cover five-row selection, owned-character priority, gray locks, independent refresh state, insufficient-funds copy, purchase persistence, and optional post-purchase equipment.
- Wardrobe tests cover virtual default ordering, gray unowned cards, disabled equipment, immediate equipment, and detail-card behavior.
- Wardrobe DOM/CSS tests assert the detail backdrop is a direct app-root overlay, the trigger surface is transparent and shadowless, and the equipped outer card owns the pale-green state.
- Shop source/CSS tests assert the exact non-wrapping title, alpha-trimmed WebP dimensions, shrink-wrapped art owner, and price positioning inside that owner.
- Portrait tests cover base/equipped/snapshot precedence and candy fallback.
- Room factory/view/result/replay tests assert the start-time costume id and URL survive the full record path.
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
