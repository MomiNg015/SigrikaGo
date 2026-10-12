# Watch window design samples

## Scope
Audit the existing watch window and deliver three isolated interactive designs. Remove the left mode bookmarks in every proposal; show each room's mode in a dedicated list column. Preserve the current Bright School palette, title artwork and window shell. Desktop and portrait mobile must remain usable.

## Directions
- Ledger: dense, ruled roster with separate black/white columns.
- Duel: larger paired portraits and matchups with a dedicated type column.
- Ticket: perforated paper rows, stacked player identities and a type column.

## Boundaries
Only prototype files and documentation change. Fixture rooms contain all four supported modes, active/finished/disconnected states and normal/long/many/empty cases. Search and refresh work locally; watch actions select the fixture row and never connect to a server room. Promotion is pending user choice.

## Verification
Inspect the real original window using isolated fixture responses. Test three variants at desktop and 390/360/320px portrait, including long names, full counts, scroll reachability, search, refresh, selection, close/reopen and keyboard focus. Record audit and screenshots beside the samples.

## Results
All 48 variant/viewport/content combinations passed browser checks. Search, selection, refresh, keyboard focus, close/reopen, fixed height, numeric visibility and portrait decoding passed. Original and final desktop/mobile screenshots were inspected. Scoped ESLint passed, including JSX through an explicit temporary parser configuration; system-design HTML regenerated. No production watch changes; awaiting user choice for promotion.

## Selected implementation
User chose ledger and requested denser mobile layout. Production now uses parallel identities and three mobile rows (116px), an explicit all-mode API query, local search and real join/close. Related 35 tests and 48 browser cases passed; lint/build/built-CSS passed. CSS inventory retains the two pre-existing unrelated failures.
