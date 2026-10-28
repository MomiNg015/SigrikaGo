# Shop materials: approved A

## Scope

The 2026-10-23 user-approved production design replaces the earlier Bright School header/wallet gradient and raster-dialogue paint contracts. Geometry, shop data, layout algorithms, fonts, signs, backgrounds, mascot placement and animation contracts remain unchanged. Other themes and nested details retain their owners.

## Owners

Four bounded files under `themes/bright-school/commerce/shop/` load at the end of `mobile-adaptive.css`: `material-header.css`, `material-cards.css`, `material-dialogue.css`, `material-fractsidus.css`. Every selector is scoped to the Bright School `.shop-window`. `--shop-material-*` tokens belong to that window; Fractsidus overrides them on its header and page.

- Zahira uses purple/gold trim, flat parchment product cards and a warm dialogue panel. No card texture, bitmap screenprint or decorative gradient is rendered. The stone preview has transparent fill and transparent solid borders, retaining its existing box dimensions and stone artwork.
- Fractsidus uses red/charcoal/silver header, tools, wallet, price tags and dialogue. Its dialogue is angular and its price/coin descendants explicitly use light text; generic theme rules must not restore dark text on dark fills.
- Header and purchase buttons provide `--campus-control-*` paint tokens to the existing button state owner. Preserve native disabled/cooldown behavior and existing hover/press/reduced-motion transitions; do not duplicate state motion.
- Dialogue paint uses pseudo-elements inside the existing element bounds with `isolation: isolate`; the tail stays inside the original aspect-ratio box. Keep production text padding, placement and responsive sizes. Existing raster frame assets and fallback declarations remain available to other styling paths.
- Preserve the 768px breakpoint family. These owners must not introduce card width/height, stage geometry, float or store-slide animation rules.

## Currency artwork (2026-10-28)

The approved blue/yellow ticket is `public/assets/ui/startorch-coupon.webp`, a lossless 827×746 crop of user artwork. Use `StartorchCouponIcon` for currency in wallets, prices and inline copy. Its wrapper sets width only; the image uses `width: 100%; height: auto; object-fit: contain`. Never apply the product-art square dimensions or independent X/Y scaling to it. Accessible text is 星炬券. `CouponText` replaces legacy 金币 and current 星炬券 words at display time; retain original backend error comparisons and `coins` fields. Price values, discounts, zero-cost eligibility, native disabled states and purchase/equip behavior are unchanged. Check both stores on desktop and portrait mobile with production CSS.

## Verification

Result rewards reuse the same coupon. Reward-card padding, borders and surfaces must target direct `.result-rewards > span` children in shared/terminal owners, never all descendant spans: an icon wrapper otherwise inherits 22px of horizontal padding/border and shrinks a 28px image to 6px. Verify the computed image width is 28px and the wrapper has zero padding/border with production CSS, including portrait mobile and loss/zero-reward states.

`docs/design-samples/shop-window-2026-10-23/materials/production.html` mounts the real ShopModal and production CSS; its root is `shop-production`, so prototype selectors cannot paint it. Only the fixture intercepts API calls. `verify-production.mjs` compares six pre-integration geometry/animation snapshots at 1440x900, 390x844 and 320x568 across both stores, checks texture removal and stone transparency, and exercises details, purchases, costume equip and reopening without network API requests. Do not regenerate `production-baseline.json` after implementation to mask drift.

Run shop/dialog DOM tests, CSS import/debt/theme/button contracts, lint, build and built CSS checks. CSS inventory changes must use task-only deltas and preserve unrelated work. Inspect actual button hover/cooldown and descendant price text in the browser, not only the source declarations.
