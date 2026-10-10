# Club dossier integration validation

The user selected the folder and challenged the left-column rank. The production layout now places rank inside the selected ordinary record page, beside metrics on desktop and above metrics at widths up to 900px. Challenge and team pages replace it. Identity actions, portraits, nameplates, chain badges and existing callbacks stay available in both profile contexts.

## Checks
- Full `npm run lint` passed; scoped lint repeated after the final source edits.
- Related component/service/style suites passed. The full suite was also run: 428 files, 3155 tests; its three outdated profile bookmark assertions were corrected and rerun. The three remaining failures are pre-existing: CSS byte baseline already exceeded by 899 bytes before this work; the existing match-mode-title-layout 360px media query is unregistered; CharacterDetailDialog's candy portrait test expects the old standard-figure classification. No unrelated source/test behavior was changed to mask them.
- `npm run build`, `npm run check:built-css`, and `npm run docs:system-design` passed. Build retains the existing bundle-size advisory.
- Browser checks: self/social × 1440×1000, 800×600, 390×844, 360×844, 320×568. All three Spark plays, replay callbacks, no page/content horizontal overflow, identity-action separation and last record reachability passed. Six extra long-name checks at 1440/390/320 verified 8-dan eight-star and 9-dan points layout.
- Desktop/mobile, challenge and team screenshots were visually reviewed. Fixtures use invented data and real repository art. Browser API responses are fixtures; backend behavior is covered by service/route tests, not a live production database.

## CSS and design-hook review
Four bounded final owners add 12679 normalized bytes including entry imports, 192 important declarations, six palette literals and one media owner. The increase is limited to the approved shared-folder surface, with existing higher-specificity legacy owners requiring overrides; no animation, z-index or broad theme fallback was added. Each file stays under 6000 bytes. The baseline update includes only this delta, retaining the 899-byte pre-existing gap.

The image hook's two missing-src warnings are false positives: both new image sites spread `characterPortraitImageProps`, which supplies the resolved src and historical costume framing. Costume-source assertions and browser renders confirm the images. Old absolute self-action positioning and inner portrait-mask dimensions were caught by visual inspection and explicitly reset; browser geometry now checks the action/name separation.

## Data contracts
Challenge ranking uses bounded best-row/count queries with competition ties; missing users/empty records remain distinct. Ordinary replay scope is applied before pagination and keeps friend duels. Team summary projection accepts finished snapshots only and strips room/character private fields. Existing default Spark replay behavior remains unchanged. No schema or settlement changes.
