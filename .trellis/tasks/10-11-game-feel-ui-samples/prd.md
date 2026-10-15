# Game-feel interface samples

## Goal
Build three interactive visual samples for settings, warehouse and friends, responding to the round-rectangle audit. The user's primary correction is that the result must feel like a game, not a pure data interface.

## Confirmed scope
- Isolated preview under docs/design-samples/game-feel-2026-10-11; no production integration yet.
- Preserve the Bright School campus identity and use current local character/item artwork.
- Settings: a club audio station with tactile sliders, mute and audible preview.
- Warehouse: an open item kit, prominent unboxed items, selected-item detail and local use feedback.
- Friends: a member contact book with portraits, online states, search and local interaction feedback.
- Support desktop and portrait phones; include an external sample selector and phone preview.
- All data/actions are explicitly local demonstrations, with no account or server changes.

## Design decisions
Use physical composition, character artwork, meaningful selection/press feedback and restrained small paper shadows. Avoid repeated rounded cards, dense dashboard tables, decorative counters and generic technology styling. Keep standard accessible controls. The sample is the reviewable result; no blocking preference remains before producing it.

## Acceptance criteria
- [x] Three distinct but related samples are reachable in a single preview.
- [x] Volume changes, mute, sound preview, item selection/use, friend search/filter and interaction feedback work.
- [x] Current local artwork loads without failures.
- [x] 1440x1000, 390x844 and 360x640 fit without horizontal overflow.
- [x] Keyboard focus and reduced-motion behavior are supported.
- [x] Preview and limitations documented; system-design entry and generated HTML updated.
- [x] Browser screenshots and focused interaction checks completed.

## Boundaries
No production CSS, game rules, API, account data or asset catalogs change. No commit or deployment is requested. Existing unrelated WIP stays untouched.

## Technical notes
Vite already runs at localhost:5173. Use standalone React preview files, scoped CSS and existing local assets. Prior audit confirmed rounded nesting in settings, warehouse and social rows. Existing profile/result flat paper styling and handbook character art are positive references.

## Review handoff

### 2026-10-12: battle header exploration

The user requested three battle-header samples excluding the upper-right utilities, with move count especially prominent. Added isolated `docs/design-samples/battle-header-2026-10-12/`: left hanging scoreboard, center match pennant, open score-sheet strip. All use real RoomHeader controls and RoomBattleStage context; title content is portaled locally. The preview supports count 0–999, long identities, team round, keyboard selection, coordinate control and phone preview. No production integration or global spec change is intended until the user selects a direction. This sample increment is independently reviewable and may be committed without closing the ongoing exploration.

Preview completed, awaiting the user's visual direction feedback before any production integration. Project lint and explicit project-rule ESLint for all four sample JSX files passed. Nine browser view/viewport combinations had no page errors, missing images or horizontal overflow. Tested audio range keyboard changes, mute/defaults and start/stop; item target/cancel/consumption/zero stock; friend search/filter/profile/offline/invite/watch feedback; close/reopen and phone iframe. Reduced motion and 44px fader width passed. Screenshots and QA records: `.codex-run/game-feel-2026-10-11/`. No production component/style/spec contract changed. System-design HTML regenerated. No commit or task archive while the exploration awaits feedback.

### 2026-10-12: selected scoreboard integration

User selected header direction 1, removed 第, and requested a shorter placard/header. Production RoomHeader now uses 54px/46px desktop/phone placards with measured normal header heights 71px/59px. Utilities remain unchanged; incomplete and corrupted rooms retain previous presentation. Preview direction 1 renders the real production component. Header/mode/menu tests, browser 1440/390/360/320 checks, lint, build and built CSS checks pass. The working tree CSS inventory has unrelated pre-existing 889-byte budget excess and an unregistered 360px match-mode-title-layout breakpoint; only this change's exact 3433-byte CSS delta is recorded. No other samples are integrated.
