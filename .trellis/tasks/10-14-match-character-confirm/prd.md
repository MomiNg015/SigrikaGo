# Confirm characters before starting matches

## Goal
Add a character slot to the Zhunshibao difficulty window and explicit start actions to all non-team character pickers.

## Requirements
- Selecting a character updates the selection without closing the picker or starting a match.
- Footer labels: 开始标准对弈匹配, 开始星炬对弈匹配, 开始五子棋匹配, 开始吃子挑战赛, 开始准时宝对局.
- Start uses the current selected character and mode, then dismisses the entry windows. No selection disables Start.
- Zhunshibao gets an independent per-account `practice` selection, validated by existing owned/available character rules.
- Team lineup behavior stays unchanged. Existing mode-card quick starts remain available.
- Preserve artwork, candy cancellation, sortie voice, keyboard behavior and portrait reachability.

## Practice interaction
User confirmed: difficulty clicks select a difficulty; start through an explicit action on the difficulty window or character picker. Initial difficulty is beginner.

## Acceptance
- All non-team modes retain selected cards until explicit close/start and send the right character payload.
- Practice and capture selections remain independent of regular Spark/account identity.
- Missing/unavailable selections cannot start; closing does not start.
- Desktop and portrait start actions remain reachable; regression tests and docs updated.

## Scope
Frontend selection flow only. Existing backend practice:start already accepts characterId. Preserve unrelated working-tree changes.

## Verification
- Lint passed; 114 tests passed across home, match actions and server practice events.
- Production build, built CSS contracts and regenerated system-design HTML passed. Documentation generation initially hit a transient Windows rename lock and succeeded on retry.
- Browser checked all four non-team standard/Spark/gomoku/capture start actions at 1440x1000 and 360x640. Character selection alone did not start; explicit start sent aemeath and the correct mode/challenge and closed both entry windows.
- Practice at 390x844 and 360x640 retained selected difficulty while closing/reopening character selection; explicit start sent advanced/random/aemeath and dismissed the windows. The footer stays visible while the card grid scrolls.
- Design hook findings for the existing 12px radius and #fff3c9 hover fill are out of scope, not introduced by this change. The new selected state reuses existing theme tokens.
- Existing uncommitted identity-sync, team-slot, voice/stamp and styling work overlaps these files; preserve it separately from this task.
