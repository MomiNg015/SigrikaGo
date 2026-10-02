# Fix mobile shop mascot clarity and width

## Goal

Make the mobile shop receptionist portrait sharper and slightly larger without changing the desktop shop layout or the purchase feedback behavior.

## Requirements

- Regenerate the two shop mascot WebP assets from their retained PNG sources using a lossless WebP encoding so mobile rendering does not show compression blur.
- Keep transparent alpha and the existing 1448x1054 intrinsic dimensions for both mascot images.
- Change the mobile shop mascot lane from 45% of the receptionist area width to 50% across the shared mobile shop layer and Bright School mobile owner layers.
- Keep the mascot right-bottom aligned, proportionally scaled, and non-overlapping with the greeting and coin wallet.
- Preserve the existing desktop shop receptionist layout and successful-purchase crossfade behavior.
- Update system design docs where they state the 45% mobile contract, then regenerate `docs/system-design.html`.

## Acceptance Criteria

- [ ] `public/assets/zahira_shop_default.webp` and `public/assets/zahira_shop_laugh.webp` are lossless WebP files with 1448x1054 dimensions.
- [ ] Mobile CSS contracts use a 50% right-side mascot lane in shared mobile, Bright School responsive, and Bright School portrait mobile shop rules.
- [ ] Existing tests covering shop sidebar rendering, preload assets, CSS contracts, and style inventory pass after updates.
- [ ] `npm run docs:system-design` passes and generated documentation reflects the 50% mobile mascot lane.
- [ ] `npm run build` passes.

## Definition of Done

- Focused tests updated or added for lossless mascot asset encoding and the 50% mobile layout contract.
- Relevant docs updated.
- Verification commands pass.

## Technical Approach

- Use the retained PNG source files in `public/assets/` as the source of truth and regenerate WebP with `ffmpeg -lossless 1`.
- Add a lightweight asset test that reads WebP headers and rejects lossy VP8/VP8X-only output for shop mascot assets.
- Update the four owner CSS layers that currently encode `45%`.

## Out of Scope

- No backend, API, purchase logic, or data model changes.
- No desktop layout changes.
- No visual redesign beyond the requested mobile width and asset clarity fix.

## Technical Notes

- Current mascot PNG and WebP dimensions are already 1448x1054, so the clarity issue is not caused by an intrinsic resolution mismatch.
- Current affected CSS contracts are in `src/styles/mobile-adaptive/phone-shop.css`, `src/styles/themes/bright-school/commerce/shop/responsive.css`, and `src/styles/themes/bright-school/mobile/commerce-warehouse/shop-layout.css`.
