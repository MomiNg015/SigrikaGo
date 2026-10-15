# Reference and feasibility notes — 2026-10-14

## Public references

- Arknights home screen: https://img.gamewith.net/bbs/post/images/89ae34ef99a9c625ae87e961ab3469a7.jpg ; source https://gamewith.net/arknights/bbs/threads/show/15 . Large character plus asymmetrical functional areas is a useful composition reference.
- Endfield character screen: https://static.actugaming.net/media/2026/01/Arknights-Endfield-operateur-physique.jpg ; source https://www.actugaming.net/operateurs-arknights-endfield-776164/ . Gray/white interface, central character and yellow action region are the relevant visual reference.
- Older beta comparison: https://gamingcypher.com/arknights-endfield-beta-test-impressions/ . Treat as a dated beta reference, not evidence of the latest game build.

Search returned screenshot previews/descriptions and the source pages were opened. Direct native browser inspection timed out, so no detailed pixel measurements or animation timings are claimed. Public references span versions and support stylistic exploration, not claims about the current game's full interaction contract.

## Verified local evidence

- Viewed `docs/design-samples/handbook-chibi/student-profile-story-2026-10-09/1440-home.png`: campus notebook framing, image-owned utility buttons, student ID, handbook and Q-version board scene.
- Viewed `docs/design-samples/watch-mobile-2026-10-13/production-desktop.png`: production component rendered with isolated sample data, paper table and move placards.
- Read `src/app/visualTheme.js`, `src/app/useAppShellTheme.js`, shared theme token/wiring files, new-theme template, `src/styles/themes.css`, and existing Startorch sample notes.

## Feasibility conclusion

A second theme fits the existing registration and root-scope design. It requires a complete visual skin, including theme-sensitive assets and some presentation composition. Color-token substitution alone will leave paper graphics and theme-specific shapes in place. Reuse gameplay and data logic; isolate visual assets and layout ownership. Check final mobile rules and portaled overlays during implementation.

Suggested first proofs are lobby (identity and navigation), character details (portrait and information density), and battle (legibility and portrait layout). This is a recommendation, not an approved implementation scope.
