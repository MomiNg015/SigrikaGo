# Profile Resume Modal Polish

## Goal

Apply the browser review feedback for the profile resume modal on desktop and mobile without changing the broader resume architecture.

## Requirements

- Show the "recent ten games" explanation as a small black text label above the recent-result row on desktop and mobile.
- Stop rendering that explanation as a low-contrast background watermark.
- Keep the recent result chips or empty state readable below the label.
- Show user character records in descending total-game order.
- Ensure the character record list owns the vertical scroll area; the section title and earlier resume content should not scroll together with the rows.
- Keep the resume header wallet controls on one line. The controls may shrink to fit, but the coin/gem widgets must not wrap onto multiple lines.
- Preserve the existing Bright School theme and mobile safety-layer contracts.

## Acceptance Criteria

- [ ] Resume markup contains a visible recent-results label before the marker chips.
- [ ] CSS no longer relies on `.profile-rank-results::before` / `::after` for the explanatory watermark.
- [ ] Character records are sorted by `total` descending with stable tie breakers.
- [ ] The embedded `.resume-character-records .character-record-list` is the scroll container on desktop and mobile.
- [ ] The mobile resume wallet action group does not use wrapping and uses shrink-safe sizing for long numbers.
- [ ] Relevant static tests pass.
- [ ] `docs/system-design.md` or the matching split system-design file is updated and `npm run docs:system-design` is run.

## Technical Approach

- Update `RecentResultMarkers` to render an explicit label only when used with `profile-rank-results`.
- Adjust modal and mobile CSS layers to style the label and remove watermark pseudo-element behavior.
- Keep or strengthen sorting in `deriveCharacterRecordStats`; add a regression test with unequal totals.
- Update static CSS tests for the new visual contract.
- Update the system-design docs to reflect the revised recent-result label and wallet no-wrap rule.

## Out of Scope

- No new resume modal sections.
- No change to rank/rating/reward calculation.
- No redesign of character record row columns beyond what is required for scroll and wrapping fixes.

## Technical Notes

- Main files: `src/components/RecentResultMarkers.jsx`, `src/modals/house/houseStats.js`, `src/styles/modals/replay-mode-resume.css`, `src/styles/mobile-adaptive/bright-school-portrait.css`, `src/styles/mobile-adaptive.css`, `src/modals/HouseModal.test.js`.
- System design references currently describe the old watermark contract and must be updated.
