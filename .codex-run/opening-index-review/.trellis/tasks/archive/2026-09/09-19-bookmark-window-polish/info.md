# Verification

- Focused modal tests: 30 passed.
- Style/theme/overlay/profile/documentation tests: 177 passed.
- ESLint, production build, and built CSS contracts passed. Build retains existing public-asset/chunk-size warnings.
- Real-component browser fixture: desktop single friend is 72px tall instead of filling a 178px list; header-to-toolbar gap is 10px.
- At 320x568, 20 friends retain 76px rows with a bounded 320px scroller; document has no horizontal overflow.
- Watch shows only three short mode labels on desktop and portrait; the 36px control row clears the dashed divider by 13px.
- Long Recruitment names use a 148px desktop rail with single-line labels; portrait labels remain one column and the last selected tab scrolls fully into the rail.
- Inspected portrait Settings, Achievements, Leaderboard, Friends, Announcements and Profile for divider boundaries and overflow.
- Local .codex-run fixtures are excluded from the commit.
