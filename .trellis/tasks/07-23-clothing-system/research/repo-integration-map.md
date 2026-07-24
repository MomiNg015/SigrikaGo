# Clothing system repo integration map

## Existing commerce path

- `src/modals/ShopModal.jsx` owns the current shop window shell, header, refresh control, product stage, mascot area and nested product detail.
- `src/modals/shop/useShopCatalog.js` owns one shop session: fetch once, choose up to five items, keep current and prepared batches, preload the next batch, run a three-second cooldown and update the effective user after purchase.
- `src/modals/shop/ShopProductStage.jsx` and `shopLayout.js` provide free-form desktop/mobile placement for five product cards.
- `src/modals/shop/ShopItemDetailDialog.jsx` already provides safe illustration credit display and an appropriate nested-detail pattern.
- `server/shop.js`, `server/commerceRoutes.js` and `prisma/schema.prisma` provide the authenticated coin-purchase transaction and existing user-asset patterns.

## Existing character portrait path

- `src/modals/HouseModal.jsx`, `src/modals/house/HouseNestedDialogs.jsx` and `src/modals/house/HouseCharacterGrid.jsx` are the handbook list/detail consumers.
- `src/modals/house/houseStats.js` currently funnels handbook portraits through the candy-effect resolver.
- Character portraits are also consumed by home, room, spectator, result, profile, recruitment, story and replay paths; the clothing task needs one shared resolver that distinguishes a target player's outfit from the current viewer's outfit.
- Replay and live-room payloads must snapshot the resolved outfit identity and URL at match start instead of re-reading the user's later selection.

## Data implications

- Existing shop categories and user assets do not represent an outfit that belongs to one character and can be equipped independently.
- Keep clothing definitions, user ownership and per-character equipment separate so catalog edits do not rewrite purchase history.
- `shopVisible`, `purchasable` and `enabled` have independent semantics.
- A disabled outfit must resolve to default and persist that fallback without deleting ownership.
- The optional candy-effect portrait belongs to the outfit definition; blank values fall back to the character-level candy portrait.

## UI and CSS implications

- Reuse the existing modal and nested-detail vocabulary instead of creating a second top-level shop overlay.
- Preserve the current Bright School header/control language while giving only the clothing-store body a dark-crimson theater-wardrobe scene.
- Desktop and portrait-mobile require distinct compositions. Mobile puts products first and the mascot/chat/wallet below.
- The shop switch uses transform-based 150–250 ms state motion, with an instant or crossfade reduced-motion fallback.
- The wardrobe grid uses native disabled buttons, independent card/detail click targets, local scrolling and stable focus-visible treatment.

## Asset facts

- Three Nabomo source images are 1000×1000 transparent ARGB PNGs.
- Four outfit sources are 1000×1000 transparent ARGB PNGs.
- `ダーニャ.png` is 800×800 transparent ARGB.
- Normalize visual content scale on a stable square transparent canvas before WebP conversion; do not stretch the 800×800 source.
