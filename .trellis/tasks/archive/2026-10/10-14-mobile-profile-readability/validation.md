# Validation

- Production changes are scoped to the existing mobile folder stylesheet; CSS inventory accounts only for this task's +521 normalized bytes and +6 important declarations.
- Real ResumeModal/UserProfileCard fixture browser QA: both contexts at 320, 360, 390, 412 and 1440px. Assertions pass for avatar/name alignment, separate actions, 18px gutters, 44px character portraits, 14px names, 13px data, no page overflow and last-row reachability.
- Narrow 320x640 long-name and equipped-nameplate variants checked separately.
- Four profile suites: all 35 tests passed. ESLint, production build and built-CSS checks passed. System design HTML regenerated.
- Existing unrelated global guard failures remain: CSS bytes exceed the baseline by 889 bytes after accounting for this task; match-mode-title-layout.css uses an unregistered max-width:360px query; mobile entry expectation omits the two watch-ledger imports. No unrelated source or test changes were made to hide these failures.
- Scoped implementation committed as `4f31b676`; unrelated working-tree changes, including replay portrait resolver work, remain unstaged.

## Follow-up verification
- Avatar and identity centers differ by less than 1px on 320/360/390/412px self/social fixtures; the 24px column gap remains above 22px after avatar rotation. Long-name and equipped-nameplate variants fit 320x640.
- Replay browser QA passes at 320/360/390/412 and 1440px: portrait stacked players, move placard, no horizontal list overflow, desktop hidden decorations, full-row click and Enter activation, last-row access. Counts include 0, 128 and 1024; friendly/team badges and long names/results remain visible.
- All 33 focused profile/replay/team tests pass; lint, build and built-CSS checks pass. The same three unrelated global CSS guard failures remain (889-byte pre-existing debt, unregistered match-mode-title breakpoint, missing watch imports in the expectation).
- Design hook color findings refer to unchanged legacy replay colors and pre-existing color assertions in tests. They are outside this layout adjustment and intentionally preserved; no color exceptions or suppressions were added.
- Commit contains only task changes. Shared dirty docs/inventory files and ReplayList were staged from scoped content; generated committed HTML matches the committed Markdown, while the working HTML also includes ongoing work.
