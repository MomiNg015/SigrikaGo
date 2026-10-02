# Hide invalid replays in all modes

- Reject invalid finished games before every persistence branch (including team, practice/challenge and special duel).
- Existing invalid snapshots are omitted from personal/social/admin replay lists; replay detail returns 404.
- Filter the authoritative winner.invalid flag, not rated status or move count. Keep valid friendly/team/special replays.
- Pagination scans bounded batches until 50 valid records plus lookahead, preserving createdAt/id cursor semantics. Do not expose snapshots in summaries or delete history.
- Add regression tests and update system design/specs. User request confirms scope.
