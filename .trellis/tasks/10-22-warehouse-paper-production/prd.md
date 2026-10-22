# Ship approved warehouse paper layout

## Scope and approved requirements
Install the accepted 2026-10-22 warehouse template into the real WarehouseModal. Keep its current shell/title, server metadata, inventory refresh and item-use behavior. No additional preference discovery is required after the explicit approval.

- Paper directory cards and inspector keep hard shadows, hover lift and press sink.
- Quantities read `持有` plus a numeral; never cover the item image.
- Keep circular backdrop and rotated large desktop artwork. Portrait detail stays compact (196–226px), image/text side by side, action at bottom. Single-column mobile directory fits whole rows and snaps after native scrolling.
- Remove category UI, type counts and detail paging. Select from the directory. Retain latest quantity lookup and neighboring fallback when an item disappears.
- Preserve character-target, self-use, recruitment, hidden action, zero stock and busy guards. No fake template confirmation or inventory in production.
- Reuse the measured-row hook from production in the standalone template; no duplicated algorithm.

## Implementation and boundaries
Update WarehouseItemGrid and its three existing final CSS owners; retain target-dialog CSS and global import order. Add a scoped row-fitting hook with observer cleanup and harmless non-layout/SSR behavior. Update tests that assert the removed UI and add browser coverage on real WarehouseModal. Record the production contract and sync system design. Preserve unrelated profile/achievement/promo WIP and stage shared docs by section.

## Acceptance
- [x] Approved desktop and portrait appearance renders under full production themes, with loaded artwork and no clipped shadows/actions.
- [x] Native wheel/touch scrolling, endpoints, resizing and inventory refresh leave whole cards after settling.
- [x] Real callback/API flows, busy/error behavior, character picker, recruitment and hidden actions still work.
- [x] Targeted tests, lint, build/style checks and system-design checks pass; snapshots and safe isolated preview are retained.

## Results
24 warehouse unit/DOM checks, 20 CSS inventory checks, 58 style contracts and 4 system-design checks passed. Browser run passed 18 tests including the nine production warehouse tests and existing empty warehouse/team/match-success regressions. Standalone sample passed its eight viewport/state and wheel/touch checks with zero real API requests. Full-repository lint, Vite build and built-CSS contracts passed. Build emitted existing asset-placeholder/chunk-size warnings without failing. Production screenshots reviewed at desktop and mobile. CSS delta is limited to the three existing owners: +72 bytes, +20 targeted important declarations, one media owner and one reduced-motion owner; no new colors/files/breakpoints. Design hook color finding is an unchanged legacy disabled-color test assertion, not newly introduced paint.

## Checks
WarehouseModal and WarehouseItemGrid DOM/unit suites; measured-row observer lifecycle regression; existing empty warehouse E2E; new production browser cases for 1440/390/360/320 and short portrait; sample verification; CSS debt/import contracts; build and built-CSS checks. Broader failures unrelated to this scope are reported without absorbing WIP.
