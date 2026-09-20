# Verification

- 179 focused tests pass, including empty/populated dossier transitions, mailbox and announcement loading/selection, Watch request errors, CSS import order and debt budget.
- ESLint, production build and built-CSS contracts pass; existing Vite asset/chunk warnings remain.
- Browser: desktop Watch empty result centered without phantom table, nested bookmark labels resolve to 400.
- 390px portrait Settings: all three label SVG icons display none. Friends, Achievements, Leaderboard, Warehouse, Announcement and Mailbox empty results have transparent backgrounds and no border; no horizontal page overflow.
- 320x568 Watch: all labels resolve to 400, empty result fits inside the shell and no page overflow.
- Shared empty illustration is static and aria-hidden; compact dossier keeps its semantic section and existing text.
