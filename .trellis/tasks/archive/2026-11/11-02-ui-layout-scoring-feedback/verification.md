# Verification

## Browser checks

Used the actual `RoomBattleStage`, `ActionBar`, `AssetPreloadScreen`, `SettingsModal`, `InteractionFeedback` and `ResultModal` under the complete production theme cascade, with local fixture data and Chrome.

- Playing/marking/confirmed/reset retain identical board and action bounds at 1280x720, 1440x800, 1920x1080, 2301x1152, 390x844, 360x640 and 320x700. All inner boards remain square; no horizontal page overflow.
- At 1440x800 the 515px board frame stays fixed, while playable-grid width increases from 335px to 386.28px through proportional inner padding/coordinate tracks. Both scoring callbacks run correctly; confirmation disables only the confirm key, reset enables it again.
- Short portrait screens retain the existing vertical page scroll. Clicking Confirm automatically scrolls it into view and succeeds at 360x640.
- Actual 10-second tip/portrait rotation preserves panel, portrait-slot, progress, note and tip-slot bounds on desktop and 320/390px phones. Tested short/long wrapping tips and different portrait sources. Rechecked after splitting CSS geometry into existing owners.
- Unreleased theme choices compute the shared disabled fill/ink and `not-allowed` cursor. Mouse pointerdown/click produces one notice and one shake; Enter/Space produce one notice per activation. No theme mutation or modal dismissal. Narrow 320px choices have no text overflow. Reduced motion uses brightness feedback rather than translation.
- Result cards compute a 3px solid ink border and solid 6px/6px shadow on desktop and 320px phones, within viewport shadow gutters.
- Existing color/font findings from the design hook are unchanged authored values, not additions in this task. Retained them without suppressions or unrelated palette changes.

Evidence: `.codex-run/ui-layout-check/measurements.json` and screenshots in the same ignored directory.

## Automated checks

- Focused behavior: 9 suites, 68 tests passed; added loading live-region regression raises that group to 70 tests.
- CSS/room/result regression: 3 suites, 112 tests passed.
- Repository lint, production build, built CSS contracts, portrait manifest/bounds, isolated admin snapshot round-trip and production configuration passed.
- System design HTML regenerated; scoped `git diff --check` passed.
- Initial full check found the loading CSS owner exceeding its size limit. Moved geometry rules into existing portrait/tip owners and reran the entire style-contract suite successfully; did not increase the debt allowance.
- Initial full suite: 3472 passed, one failure (the already-corrected CSS size check), 523.57 seconds. The full command stopped at that failure; no claim of an uninterrupted green `npm run check`. After the CSS split the entire style/room/result group passed (112 tests); current behavior regressions total 70 passing tests, and all remaining check stages were run successfully as separate commands. Final production build and built-CSS checks passed after the last markup adjustment.

No server rules or API payloads changed. Existing unrelated workspace edits and artifacts were preserved. Committed as 9cdffa62 on master.

Follow-up: removed icons only from Confirm dead stones / Reset confirmation; normal counting/resignation icons remain. ActionBar 26 tests passed. Desktop and 390px portrait screenshots confirm no SVGs in the scoring keys, and the visual report was refreshed.


## Final pre-commit gate (2026-11-02)

`npm run check` completed successfully: 478 test files and 3473 tests passed (518.28 seconds), followed by portrait validation, isolated admin snapshot round-trip, production build, built-CSS contracts, production configuration and system-design HTML generation. Staged diff whitespace checks passed. The commit contains only the 18 scoped source/test/spec/document files; unrelated workspace edits remain outside this commit.
