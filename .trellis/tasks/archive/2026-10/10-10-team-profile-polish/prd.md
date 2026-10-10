# Team profile statistics and dossier polish

## Goal
Give team matches an independent rank, aggregate record, last ten results and character appearance records. Refine the approved club dossier with a compact horizontal identity header, compact record hierarchy, clear controls and readable portrait layout.

## Accepted decisions
- Team rank is independent of ordinary Spark and follows the existing star progression. New team matches persist progression atomically with their replay; existing ranks/coins in other modes remain unchanged.
- User confirmed: only characters that actually entered a stage count one appearance and the final match outcome. Unused selected teammates do not count.
- Rename the character table's 对局 column to 出场次数 across profiles. The account-wide 总对局 metric remains a match count.
- Use stored valid team snapshots to display historical appearances and recent outcomes; do not retroactively award stars or coins for older replay-only matches. Initial independent team rank uses the standard default until a new settlement.
- Keep existing special challenge behavior, ordinary statistics and profile social/account actions.

## Visual findings and direction
The first folder integration leaves too much unused left-page height, recent results consume an oversized band, compact character art/type loses readability, and the icon-only replay affordance is unclear. Keep paper/ink palette and internal tabs; replace the empty left column with a horizontal identity header, compact headers and rank/stat rhythm, enlarge character names/portraits, label replay, and group secondary social actions so danger controls do not dominate.

## Acceptance
- [x] Atomic/idempotent independent team progression; failure does not mutate live users; invalid matches stay excluded.
- [x] Team profile contains rank, totals, last ten including draws, and entered-character appearances; legacy team replay stats remain available.
- [x] Both profile contexts share the same layout and 出场次数 label; loading/error/retry and replay continue working.
- [x] Desktop, portrait 390/360/320 and short height checked visually; long names and high ranks fit; last row reachable.
- [x] Appropriate tests/lint/build/docs pass; known unrelated baseline failures distinguished; commit only this task's delta.

## Constraints
Preserve unrelated dirty work. No change to board rules, team handoffs, hidden lineup projection or coins. No global navigation expansion just to store a team stats row. Follow current Trellis inline workflow and existing identity/nameplate resolvers.
