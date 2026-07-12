# Current Shop System Audit

## Scope

Read-only audit of the player-facing shop catalog, purchase path, responsive layout, tests, local development database, and the two user-provided layout sketches. No shop implementation code has been changed.

## Current Runtime Flow

- `src/app/AppOverlays.jsx` lazy-loads `ShopModal` and passes the authenticated user, music metadata, purchase callback, notice callback, and close callback.
- `src/modals/shop/useShopCatalog.js` fetches `GET /api/shop` when the modal opens. The client receives every enabled item, applies display names for music items, and keeps the result in modal-local state.
- `server/publicRoutes.js` authenticates `GET /api/shop` and calls `listShopItems(prisma, userId)`.
- `server/shop.js` loads all enabled `ShopItem` rows ordered by `sortOrder` and `createdAt`, then adds user-specific purchase counts and remaining stock.
- `POST /api/shop/:id/purchase` runs the purchase in a Prisma transaction, validates availability and ownership, deducts coins, grants the asset/item, records progress, syncs structured user assets, and returns the updated public user plus updated item payload.
- The frontend updates the purchased item in the already-loaded catalog and switches Zahira to a five-second thank-you state. Repeated successful purchases refresh that timer.

## Current Catalog and Stock Semantics

- `ShopItem` contains category, target id, per-user item stock limit, price, discount, purchasable/enabled flags, sort order, description, image, illustration credit, and source.
- The local development database currently contains 7 rows, 6 enabled and purchasable: 3 items, 2 decorations, and 1 music track. The only character row is disabled.
- The durable admin snapshot matches the same 6 enabled products.
- Finite `stockQuantity` applies only to category `item` and is enforced against each user's `itemPurchaseCounts`; it is not shared global stock.
- Characters, decorations, and music are one-time ownership purchases. The current card remains visible after ownership and shows a disabled `已拥有` button.
- The requested rule explicitly hides sold-out products. Whether already-owned one-time products should also disappear is not yet specified.

## Current UI Structure

- `ShopModal` has no semantic header or title. The close button is an absolute modal control.
- Desktop is a two-column layout: a narrow left receptionist/sidebar and a large right product area.
- The left sidebar currently contains Zahira's speech bubble, both crossfading portrait assets, and the coin wallet.
- The right product area contains category tabs, an eight-slot category grid, and pagination.
- Empty page slots render `暂未上架` placeholder cards so the grid is always eight slots.
- Product cards open a separate nested detail dialog when the card body is clicked; the purchase button buys immediately without opening detail.
- Current card states include owned, sold out, not purchasable, insufficient coins, and purchasing. All unavailable purchase actions are native disabled controls.

## Current Responsive and Theme Constraints

- Base desktop modal is up to 1080 x 760 CSS pixels. The base shop layout uses a 190-pixel sidebar.
- Portrait phone layout collapses to a stacked receptionist region followed by a two-column scrollable product grid.
- Bright School applies multiple later theme and final mobile layers. Some use `!important`, so redesigning only base CSS would not be reliable.
- Existing phone safeguards preserve hidden-but-scrollable regions, 44-pixel touch targets, close-button priority, and self-contained product cards.
- Existing tests assert the old two-column sidebar/product topology, category tabs, stable eight-slot pagination, wallet/portrait placement, disabled states, detail behavior, responsive containment, and theme contracts. A redesign must replace those obsolete assertions rather than layer around them.

## Sketch Interpretation

### Desktop sketch

- Header spans the top and orders refresh, title, and close from left to right.
- Product area occupies the upper-left/left body and shows at most five scattered cards.
- Wallet sits at lower-left.
- Zahira occupies lower-right.
- Dialogue floats above Zahira and may overlap header background, but must not cover portrait, product area, or close action.

### Mobile sketch

- Header keeps refresh, title, and close in one top row.
- Five products are arranged as two cards on the first row and three on the second row in the sketch.
- Dialogue appears below the products.
- Wallet sits to the right of the dialogue/above the portrait.
- Zahira anchors to the bottom and is intentionally cropped by the viewport/modal edge.

## Architectural Decision Point

The current server has no concept of a five-item offer set, refresh history, refresh cooldown/cost, or persistence of the previous offer. The API returns the full catalog. Therefore:

- A session-local shuffle can be implemented entirely in the modal hook and disappears when the modal/app is reopened.
- A per-device remembered shuffle can use local storage but will not follow the user across browsers/devices.
- A per-account remembered shuffle requires new server state/API semantics and likely a data-model change, but gives deterministic cross-device behavior and stronger anti-abuse controls if refresh later gains cost or cooldown.

## Existing Asset Preload Path

- `src/app/useStartupPreload.js` already fetches `/api/shop` during authenticated startup and passes every shop item into `loginPreloadAssets()`.
- `src/shared/preloadAssets.js` includes all shop item `imageUrl` values in deferred login images, loads them through `Image`, limits concurrency, applies per-task timeouts, and retries skipped assets in the background.
- Therefore, most shop images should already be cached before the modal opens. The requested next-batch preload should reuse or expose the same bounded loader behavior as a targeted safeguard rather than create a second incompatible cache system.
- Precomputing the next batch during cooldown still has value: it removes random selection work from the refresh click, fixes the exact next result for testability, and re-warms assets that were skipped or introduced after startup.

## Risks and Edge Cases

- With only 6 enabled products and a 5-card window, a strict rule that every refreshed card must be unseen is impossible. The practical rule must maximize unseen products first, then fill remaining slots from the previous offer without duplicates.
- When eligible products fall below 5, the product area should redistribute real cards rather than render fake empty slots.
- Random rotation and vertical drift must preserve hit targets, readable text, card-to-card separation, keyboard focus outlines, and reduced-motion behavior.
- A live purchase can change eligibility immediately. If the purchased product becomes owned or sold out and should disappear, the current five-card offer needs a defined refill rule.
- Loading, catalog failure, no eligible products, and a catalog of exactly one to four products need explicit layouts and copy.
- Zahira's dialogue may overlap header background only inside a bounded safe region; close and refresh must remain operable, and the portrait must not intercept product clicks.
