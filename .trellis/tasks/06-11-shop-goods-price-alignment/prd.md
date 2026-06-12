# Shop Goods Price Alignment

## Goal

Update the shop item display so character goods and decoration goods no longer show purchase-limit text, and their sale prices remain horizontally centered on both desktop and mobile layouts.

## Requirements

* Remove the limit-purchase wording from character goods in the shop.
* Remove the limit-purchase wording from decoration goods in the shop.
* Keep the item sale price horizontally centered in the affected shop cards.
* Apply the behavior consistently on desktop and mobile.
* Update `docs/system-design.md` for the UI behavior change.

## Acceptance Criteria

* [x] Character shop goods do not display purchase-limit text.
* [x] Decoration shop goods do not display purchase-limit text.
* [x] Sale prices are horizontally centered in affected cards on desktop layout.
* [x] Sale prices are horizontally centered in affected cards on mobile layout.
* [x] `docs/system-design.md` is updated.

## Definition of Done

* Relevant frontend specs are consulted before implementation.
* Lint/type-check or the closest practical project verification is run.
* System design documentation is synchronized.

## Technical Approach

Find the shop card rendering for character and decoration goods, remove or conditionally suppress the limit label for those categories, and adjust the price row/card CSS so the price centers without relying on the removed label.

## Out of Scope

* Changing purchase-limit business logic or server-side purchase validation.
* Changing other shop categories unless they share the same reusable component and require layout-safe handling.
* Altering item pricing or currency behavior.

## Technical Notes

* User explicitly requires desktop and mobile parity.
* AGENTS.md requires every update to synchronize `docs/system-design.md`.
