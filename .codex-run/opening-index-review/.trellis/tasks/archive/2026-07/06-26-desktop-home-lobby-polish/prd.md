# Polish Desktop Home Lobby Layout

## Goal

Improve the desktop home lobby so it feels denser, more intentional, and aligned with the Bright School scrapbook/classroom style. The current left-bottom utility controls should become a richer 3x2 club toolbox, and the main match entry should expose per-mode queue tickets so the right-side hero area carries live lobby information instead of feeling empty.

## Requirements

* Preserve the existing Bright School desktop direction: warm paper surfaces, dark hand-drawn borders, sticker-like depth, pastel pink/mint/blue accents, and classroom/lobby art.
* Change the desktop utility dock from small homogeneous buttons into a 3x2 "club toolbox" layout.
* Each utility entry must include the existing Lucide icon, a primary Chinese title, and a short secondary Chinese descriptor:
  * 招募 / 成员补给
  * 商店 / 物资购入
  * 仓库 / 道具管理
  * 排行 / 天梯记录
  * 观战 / 当前房间
  * 好友 / 社交列表
* Give utility entries subtle per-action pastel backgrounds while retaining the same icon family and accessible native button semantics.
* Add three match-mode tickets below the main match entry, using the existing shared mode ordering and the current `lobbyStats.matchmakingCounts` data.
* Keep the match entry click behavior unchanged: clicking the main match entry still opens the mode picker before starting matchmaking.
* Keep mobile behavior compatible with the existing home contracts:
  * phone portrait keeps the landscape guard,
  * phone landscape remains compact and must not overflow,
  * compact desktop and micro desktop safety layers must not create overlapping invisible hit boxes.
* Update the system-design documentation for the user-visible home layout change and regenerate `docs/system-design.html`.

## Acceptance Criteria

* [ ] Desktop home utility dock renders six controls as a 3x2 toolbox with icon, title, and secondary descriptor.
* [ ] Bright School desktop styling gives the toolbox richer paper/sticker treatment without relying on utility pseudo-elements that theme firewalls remove.
* [ ] The match area shows one ticket per mode from `modeOrderedEntries()`, with queue counts from `lobbyStats.matchmakingCounts` and legacy spark fallback.
* [ ] Existing match-mode picker behavior remains unchanged.
* [ ] 1440px and 1920px desktop layouts show no overlap between player plaque, manual entry, utility toolbox, match entry, and mode tickets.
* [ ] 1024px-1180px compact desktop and phone landscape remain usable without horizontal content overflow beyond the existing stage strategy.
* [ ] Phone portrait still shows the orientation guard instead of the full stage.
* [ ] Reduced-motion keeps controls usable without large hover/press displacement.
* [ ] System design docs are updated and `npm run docs:system-design` is run.

## Definition of Done

* Relevant React components and CSS are updated.
* Existing style contracts are preserved or updated intentionally.
* Focused tests pass for the changed home UI and docs generation.
* No unrelated dirty files are reverted or included.

## Technical Approach

* Extend `HomeUtilityDock` with metadata-driven utility items so each button renders icon, title, and descriptor through real DOM nodes.
* Pass `matchmakingCounts` from `HomeScreen` into `HomeStage` and `MatchEntry`; render mode tickets from `modeOrderedEntries()` so future mode ordering stays centralized.
* Add scoped CSS for the desktop Bright School toolbox and tickets, using class names that survive the theme pseudo-element cleanup/firewall layers.
* Preserve existing mobile safety by adding small-screen overrides where necessary rather than changing the phone orientation guard.

## Decision (ADR-lite)

**Context**: The current desktop lobby has a large fixed stage and the left-bottom utility dock is visually repetitive. Existing Bright School theme layers also clear or flatten utility pseudo-elements, so purely pseudo-element-based decoration is fragile.

**Decision**: Implement richer real markup for utility descriptors and mode tickets, then style those elements with scoped Bright School desktop and compact/mobile rules.

**Consequences**: The home page gains more information density with minimal state changes. The CSS remains somewhat high-specificity because it must coexist with existing Bright School guard layers.

## Out of Scope

* Replacing the existing home art assets.
* Changing matchmaking protocol or mode picker behavior.
* Adding new live lobby APIs.
* Redesigning unrelated modals opened by the utility buttons.

## Technical Notes

* Relevant components: `src/home/HomeScreen.jsx`, `src/home/components/HomeStage.jsx`, `src/home/components/HomeImageEntries.jsx`, `src/home/components/HomeUtilityDock.jsx`.
* Relevant styles: `src/styles/base/home-stage-artboard.css`, `src/styles/themes/bright-school/home/*`, `src/styles/themes/bright-school/quality-base/*`, `src/styles/themes/bright-school/mobile/home-shell/*`.
* Relevant contracts: `.trellis/spec/frontend/component-guidelines.md` game-mode UI contracts and `.trellis/spec/frontend/quality-guidelines.md` Bright School home responsive contracts.
* Project docs rule: update `docs/system-design.md` or `docs/system-design/` and run `npm run docs:system-design`.
