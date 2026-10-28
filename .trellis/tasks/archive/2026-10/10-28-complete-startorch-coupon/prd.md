# Complete Startorch coupon terminology

## Goal

Complete the user-approved replacement of visible coin currency with the authored Startorch coupon throughout player and admin surfaces.

## Requirements

- Cover shop insufficient-balance notices, achievements including legacy stored reward text, and non-gacha admin currency labels/validation/analytics.
- Update built-in and exported defaults. Existing stored currency rewards must display the new label and artwork without a database migration.
- Reuse the approved 827:746 coupon; preserve aspect ratio. Shop copy continues to use icons.
- Preserve numeric balances, prices, transactions, internal `coins` fields and API types. Preserve unrelated working tree changes.
- Update system design entry/chapter and generate HTML.

## Acceptance Criteria

- No in-scope first-party visible currency copy still says 金币 or coins; legacy matching, regression fixtures and excluded gacha surfaces are allowed.
- Old stored reward names/images cannot override the coupon presentation.
- Legacy and current insufficient-balance messages use the coupon and retain mascot feedback.
- Focused regression tests, lint, build, generated-doc and CSS checks pass; browser verification covers achievement presentation and portrait scaling.

## Approach

Use the existing coupon helpers for currency wording and typed reward projections; keep business identifiers stable. Plain admin text uses 星炬券 while player amount surfaces use the shared image. The user explicitly excludes unreleased gacha; all task edits to its UI, server, tests, CSS and seeded pool data have been withdrawn.

## Out of Scope

Unreleased gacha (including its admin settings and seeded pools), economy changes, database field renames, historical task/artifact rewrites, unrelated onboarding work.

## Verification

- Final scope: 14 targeted suites / 137 tests passed; lint passed.
- Build and built-CSS contracts passed; isolated admin default snapshot round-trip passed; generated design HTML is covered by the targeted docs suite.
- Browser checked real achievement UI at 1280x800, 390x844 and 320x568, plus admin currency option label/value. Coupon is 34px wide and keeps 827:746 ratio. Evidence under docs/design-samples/coupon-completion-2026-10-28/.
- Full npm check was interrupted when the user excluded gacha; final verification above applies to the narrowed scope.
- Verified all gacha-only paths have zero diff and mixed default/draft files retain only non-gacha changes. Existing unrelated work remains untouched.
