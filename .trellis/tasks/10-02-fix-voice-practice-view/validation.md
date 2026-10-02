# Validation

- Root cause: DesktopViewportGate unmounts RoomScreen below the minimum viewport; local refs lost the consumed game-start event. Session-scoped bounded opening voice ledger now survives remounts, including team rounds and resumed starts.
- Root cause: both practice engine routes used gameViewForColor, substituting Nabomo visibleAs colors before SGF/heuristic evaluation. practiceBotView removes color illusions before projection; hidden-hand visibility and human/special-duel projections are unchanged.
- Focused regression: 7 suites / 61 tests passed; final audio-only rerun 7 tests passed after dependency cleanup.
- npm run lint passed. npm run build passed (existing unresolved public-asset placeholder warnings remain).
- npm run docs:system-design completed; docs generation regression passed.
- npm run check: 383 suites passed, 9 failed (2771 tests passed, 12 failed). Documentation mismatch was corrected by generation and verified separately. Other 11 failures concern profile/social summaries, socket event expectations, room label and CSS contracts, outside this fix. No unrelated fixes made. Full check is not green.
- No commit made; unrelated working changes preserved.
