# PRD: Gacha Featured Prize Toggle

## Goal

Allow admins to cancel the selected gacha featured prize instead of forcing every pool to keep a selected "大奖" row.

## Requirements

- Clicking the currently selected featured-prize control in the gacha admin editor clears the selection.
- New gacha pool drafts should not silently preselect the first prize as the featured prize.
- Saving a pool with no featured prize should preserve `featuredPrizeId: null` instead of falling back to the first prize.
- Existing pools with a stored featured prize should still show that prize as selected when edited.
- Player/admin payloads should report `featuredPrize: null` when no featured prize is configured.
- Sync `docs/system-design.md` with the nullable featured-prize behavior.

## Acceptance Criteria

- Admin source/tests cover the toggle-off interaction contract.
- Draft serialization accepts `featuredPrizeIndex: null` and sends it as `null`.
- Backend validation accepts `null`/missing featured prize and persists no featured prize.
- Gacha payload projection does not substitute the first prize when `featuredPrizeId` is null.
- Targeted tests, full check gate, and system design docs generation pass.

## Technical Notes

- Root cause: the UI used a radio input, `emptyGachaPoolDraft()` defaulted `featuredPrizeIndex` to `0`, `gachaPoolDraftToBody()` rejected negative/null indexes, and `adminGachaManagement` defaulted missing input back to `0`.
- Files likely touched: `src/admin/AdminGachaPools.jsx`, `src/shared/adminDrafts.js`, relevant tests, `server/adminGachaManagement.js`, `server/gacha.js`, and `docs/system-design.md`.
