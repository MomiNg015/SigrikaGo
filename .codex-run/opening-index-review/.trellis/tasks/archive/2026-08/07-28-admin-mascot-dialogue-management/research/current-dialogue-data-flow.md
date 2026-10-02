# Current mascot dialogue data flow

## Existing runtime sources

### Zahira shop

- `src/modals/shopModalHelpers.js` owns two random pools (`SHOP_MASCOT_LINES`, `SHOP_MASCOT_REFRESH_LINES`) and four fixed lines (loading, empty, error, thanks).
- `src/modals/shop/useShopCatalog.js` selects lines when the catalog loads, refreshes, errors, becomes empty, or completes a purchase.
- The hook deliberately keeps purchase feedback until refresh/retry/close; configurable text must not introduce timers or change this state machine.

### Nabomo costume shop

- `src/modals/costumeShopHelpers.js` owns two random pools and five fixed lines (loading, empty, error, thanks, insufficient coins).
- `src/modals/shop/useCostumeCatalog.js` selects lines for the same catalog states plus the insufficient-coins purchase failure.
- Mood selection and portrait switching are separate from the copy and should remain unchanged.

### IRIS database

- `src/shared/irisGreeting.js` provides the default and normalization for one greeting.
- `SiteSetting.irisGreeting` is already loaded through `/api/site-settings`, rendered by `src/home/IrisDatabase.jsx`, and edited by `src/admin/AdminIrisSettings.jsx`.
- `AdminIrisSettings` also owns the IRIS links editor, so consolidating navigation must preserve that editor.

## Existing persistence path

`Admin form -> PATCH /api/admin/site-settings -> server/siteSettings.js -> SiteSetting rows -> GET /api/site-settings -> app siteSettings state -> UI consumer`

`SiteSetting` avoids a schema migration and already participates in admin audit logging, deployment defaults, and public configuration loading.

One safety issue is relevant to this feature: `sanitizeSiteSettings()` currently expands a partial PATCH body to every known setting using code defaults. A dialogue-only save can therefore reset unrelated saved settings unless the server merges the patch over the persisted settings or the client posts every current setting. The durable fix belongs on the server boundary so every partial admin settings editor is safe.

## Feasible admin navigation approaches

### A. Upgrade the existing IRIS entry to “看板娘管理” (recommended)

- One discoverable owner for all three characters.
- Preserve the IRIS links fieldset inside the IRIS section.
- No duplicate IRIS greeting editor and no ambiguous source of truth.

### B. Add a separate “看板娘管理” and keep “IRIS 管理”

- Smallest visual change to the existing IRIS page.
- Either duplicates the IRIS greeting or forces users to switch pages for one mascot, weakening the stated unified-management goal.

### C. Put shop mascot copy under each shop/costume admin page

- Contextual to each catalog.
- Does not satisfy a single mascot-management entry and leaves IRIS structurally separate.

## Recommended storage boundary

- Keep `irisGreeting` as the existing canonical IRIS field to preserve saved installations without migration.
- Add one normalized JSON site-setting value for the two shop-host dialogue configurations, because they share random greeting/refresh pools and catalog-state feedback.
- Expose all three through one admin component; the UI does not need to reveal storage details.
- Normalize at a shared module used by server and client, with bounded pool counts, bounded line lengths, whitespace cleanup, and per-field fallback to current defaults.
- Pass `siteSettings` from `AppOverlays` into `ShopModal`, then pass the normalized character config into the two catalog hooks without changing their state machines.
