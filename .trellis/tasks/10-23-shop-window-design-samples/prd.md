# Shop window: preserve layout, improve materials

## Goal
Review the existing shop, provide three interactive samples, and integrate the user-selected A treatment into production after removing product-card texture.

## User correction
The first-round layout redesigns were rejected. Preserve the existing shop layout and style. Focus on plain product cards, intrusive dialogue frames and an unattractive header. The first round is archived as layout-round.html / layout-round.md and is not a recommended or accepted direction.

## Requirements
- Current selection: A. Remove the stone-preview dashed frame and fill while retaining its box size. Give Fractsidus a separate dark-red/charcoal/silver visual language for header, wallet, tools, price tags, dialogue and window trim. Preserve Zahira's purple/gold treatment. The user approved production integration with all product-card texture removed.
- Use the real ShopModal and existing assets, title font, two-store interactions, five-card topology, card sizes/transforms, stages, mascot positions, backgrounds, signs and header controls.
- Provide three sample-only material treatments: velvet/gold labels, illustrated merchandise tickets, colored enamel.
- Include an instant original toggle which preserves the current store, batch and purchases.
- All API handling is a local fixture; no real purchase, equip or server mutation.
- Preserve unrelated work and existing production behavior. Update the system-design entry and generated HTML.

## Acceptance
- [x] All three treatments visibly cover cards, dialogue and header.
- [x] Original comparison works without remounting the shop.
- [x] Exact geometry and animation-declaration comparison passes at 1440x900, 390x844 and 320x568, both shops: 18 cases.
- [x] Native details, local purchase, costume purchase/equip, refresh cooldown and close/reopen work.
- [x] Insufficient-funds, long-dialogue and empty states are covered.
- [x] Browser screenshots, contrast evidence and design-hook review are saved with the samples.
- [x] Docs mark the first round rejected and point to the second round.

## Scope
Production integration is limited to four Bright School shop paint owners. Card scaling, geometry, motion, APIs and business logic remain unchanged. Corrupted and other themes retain their existing owners. Update the shop material contract, CSS inventory, design guidance and scoped system documentation; preserve unrelated WIP.

## Delivery
Entry: docs/design-samples/shop-window-2026-10-23/materials/index.html. Evidence: materials/verification.json, contrast-check.json, design-hook-findings.json and README.md.

## Production acceptance
- [x] Product-card textures removed; transparent stone previews retained.
- [x] Zahira purple/gold and Fractsidus red/charcoal/silver materials integrated through four bounded CSS owners.
- [x] Existing button state tokens drive hover/press/disabled appearance.
- [x] Six production preview cases preserve pre-integration geometry and animation declarations at desktop, 390px and 320px, both stores.
- [x] Local-fixture details, purchase, costume equip and close/reopen flows pass.
- [x] Lint, focused shop/style tests, production build and built-CSS checks pass.
- [x] System-design sources and generated HTML synchronized.

Production preview: materials/production.html. Evidence: production-baseline.json and production-verification.json. Approved shop palette/radii are localized design exceptions; no hook ignores were added.
