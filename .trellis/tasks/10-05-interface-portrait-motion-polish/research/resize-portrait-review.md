# Intermediate viewport and live-resize portrait review

2026-10-05; Chrome desktop channel; existing Vite server 5305. Production edits frozen after the verified ordinary-landscape repair. Root owns system-design and CSS inventory integration.

## Coverage and gate evidence

The temporary fixture in `.tmp/interface-polish/resize-review/` renders real HomeScreen, ResumeModal, UserProfileCard and RoomScreen with full `src/styles.css`, production DesktopViewportGate, decoded bust images and loaded fonts. It uses deterministic users/records and does not exercise authentication or server mutations.

56 states: four surfaces × six fresh viewports (1024×768, 1280×720, 768×1024, 844×390, 768×390, 1440×768), then four mounted surfaces × eight live changes (1024×768 → 768×1024 → 390×844 → 844×390 → 769×390 → 768×390 → 767×390 → 1440×768). This extends the completed character/equipment matrices without repeating all nine characters.

The actual gate correctly blocks 1024×768, 1280×720 and 768×1024. They show `请用合适尺寸窗口进行游玩`; they are intentional unsupported windows. The actual gate permits 844×390 and the 767–769×390 landscape boundary. Gate removal/restoration follows every resize correctly.

At supported sizes, student-ID/profile art keeps source proportions and a visible focal crop. Self/social final character-record rows remain reachable at every populated profile state; desktop uses the table scroller, compact profiles use their body scroller. No page errors or horizontal document overflow occurred. The home landscape match artwork retains its existing wide-stage cropping; this review changes no home layout.

Evidence: `metrics.json` and `fresh-/resize-*.png` preserve the initial state; `metrics-after.json` and `after-fresh-/after-resize-*.png` contain final captures.

## Verified defects and authorized repair

Initial 844×390 battle masks measured width 0, despite decoded 832×1216 images. `mobile-room/landscape-room.css` removed the named portrait area while `base-shell-dock/player-timer-strip.css` kept the 58px card cap. `room-terminal/mobile-landscape.css` repairs only ≤800px. Implicit zero-width grid tracks therefore hid art above that boundary.

The Bright School `quality-base/audit-room.css` wrap width also retained the desktop 430px minimum while mobile height was 278/264px. Intrinsic grid tracks made the SVG extend below the viewport: at 844×390, wrap430×278 and SVG364² reached y466; at768×390, stage264×443.9 was vertically displaced. All affected windows are permitted by the real gate.

The old dock96/100px and panel44/58px caps could not hold55px tabs plus50px action content and chrome. Below800px, `room-terminal/mobile-portrait.css` also replaced the five landscape columns with three, clipping the second row. Before repair, 768px last buttons extended to y441.

Authorized production owner: `src/styles/mobile-adaptive/mobile-room-landscape.css` only. The added existing max900-landscape family is scoped to ordinary Bright School rooms with the real `[data-action-anchored]` viewport, excludes `.sigrika-candy-duel-room`, reserves identity/portrait/time rows, clears the inherited player cap and constrains the art to its row. Single-bust wrappers center with a132px maximum width so the remaining short row shows face and shoulders consistently; team slices retain their full stage width. Stage/wrap use square zero-minimum tracks with the existing coordinate gutters. Dock content now takes natural height; normal controls use five columns, replay keeps seven. No point handlers, source catalog, crop/focal framing, portrait-phone rules or desktop rules were changed.

The `[data-action-anchored]` scope also supplies sufficient specificity against the later `battle-paper-portrait.css` 180px height. Final screenshot inspection caught that cascade interaction; permanent regression now requires the art frame to sit between identity and timer, so merely nonempty art cannot pass.

Final normal dock bounds: all five buttons y334–378, height44px, with center hits verified. Final decoded captures have stage201.47² and wrap195.47² at844×390, stage200.14² and wrap194.14² at768×390; SVG and board share exact square bounds. All169 point centers hit their own `.point`, coordinates remain present and the full board lies inside its row. Source ratios remain proportional. Single-bust masks132×113.67 at844 and131.05×111.95 at768 keep the focal point at y51–55, leaving visible shoulder space above the label.

Team prototype checks at844/768 preserve polygon slices, all five revealed-member images load, and hidden slot has zero images. Prototype comparisons at390×844/1440×900 were identical before/after for team, tutorial-placeholder and special-duel source/geometry data. Special candy-duel was identical at all four prototype sizes. Tutorial/null branch sources remain their existing placeholders; no standard character is invented. Special-duel landscape retains its pre-existing layout, which was deliberately excluded from this ordinary-room repair.

## Permanent checks and CSS accounting

Append-only tests in `tests/e2e/interface-polish.spec.js` cover844/768 supported landscape, team hiding/diagonal slices, all169 point center hits, complete44px actions and continuous769→768→767 resizing followed by portrait/desktop restoration. The fixture itself renders raw RoomScreen; the regression separately imports the production gate classifier to establish that these windows are supported.

- Full interface browser suite:15 tests pass before the final132px single-bust bound; affected landscape3 tests pass again after that final bound.
- Focused RoomScreen/CSS/theme suite:133 tests pass.
- `npx eslint tests/e2e/interface-polish.spec.js`:pass.
- Final56-state resize capture:zero gate mismatches, page errors, document overflow, unreachable profile rows, zero-size or nonproportional busts, or nonsquare boards.

CSS owner LF bytes1314→3271 (+1957), `!important`0→7, media rules1→2. The extra media uses the already registered `(max-width:900px) and (orientation:landscape)` family. No added stylesheet/import, hardcoded colors, motion, reduced-motion rule or z-index. Physical file is3318 bytes because existing CRLF lines are retained.

Limit: these geometry checks use actual components with deterministic data and production CSS, not a fresh authenticated application journey. Root's final app/build checks remain the integration gate. The earlier126 art +50 profile +36 equipment evidence remains authoritative for the full character/equipment matrix.

## Post-opening special candy-duel landscape triage and prototype

The later special review uses a real server-created public room: `createSigrikaCandyDuelRoom` plus `buildRoomView`, with opening presentation finished, `phase: playing`, human turn, both 1800-second main clocks, zero byoyomi and the authored NPC/human corrupted portraits. It is rendered by real RoomScreen, production DesktopViewportGate and full CSS. No network or persistent game state is changed.

Neither the gate nor special-room contracts require portrait orientation. The actual gate permits both844×390 and768×390. The pre-existing clipping is therefore a playable-layout defect:844px hits130/169 point centers (SVG364² ending y462.53);768px hits143/169 (SVG368² ending y443.14). All five rendered actions are partially clipped; at768px the enabled resign button is entirely unreachable in its second row. The existing native first-point click still emits the expected move payload.

Winning geometry owners are the shared `mobile-room/landscape-room.css`96px dock/44px panel caps, the final `mobile-adaptive/mobile-room-landscape.css`100px dock/58px panel caps at≤768, the non-orientation-restricted `room-terminal/mobile-portrait.css`three-column action layout at≤800 and the Bright School `quality-base/audit-room.css`430px board-wrap width. Special `sigrika-corruption/room-controls.css` correctly preserves its own8px/10px action padding and purple/pink palette; that content needs62px instead of the generic44/58px caps.

Browser injection in `special-prototype.mjs` proved a bounded repair in existing special owner `sigrika-corruption/room-secondary-surfaces.css`, which already owns special mobile tabs and short-desktop board geometry. Root approved and applied the combined production repair. The max900-landscape selector includes the actual special mobile room and `[data-action-anchored]` viewport. It changes board/stage zero-minimum square tracks and the natural dock/panel height, restores five normal action columns and retains seven replay columns. A definite player-slot/card height and zero-minimum single-column meta/art/time rows also prevent the inherited58px cap and missing portrait area from collapsing the cards. Authored art is centered within the available row and a132px maximum width, with its existing sources/object-fit/transforms preserved. No timer, clock, cinematic, gameplay or color declaration changed.

| Prototype viewport | Stage / wrap / board+SVG square sizes | Point centers hit | Fully visible actions | Dock bounds |
| --- | --- | --- | --- | --- |
|844×390|196.27 /194.27 /128.27px|169/169|5/5,44px each,y328–372|y259–386,height127px|
|768×390|195.48 /193.48 /131.48px|169/169|5/5,44px each,y328–372|y259–386,height127px|

Both enabled actions (pass/resign) are fully visible and center-hittable. Coordinate gutters remain present. Computed room/card/board/timer/action colors, backgrounds and borders are unchanged, as are portrait URLs, object-fit and transforms. Before/after complete measurement objects are identical at390×844,1440×900 and1440×768. All five reviewed sizes have zero horizontal document overflow. Evidence: `special-triage-metrics.json`, `special-prototype-metrics.json`, `special-actual-*.png` and `special-prototype-*.png`.

Both player cards now remain inside their slots and above the dock:844px masks132×87.47 between identity y64.73–83.53 and clock y183–249;768px masks132×85.30 between identity y65.52–83.70 and clock y181–247. Cards end at255/254, with dock beginning259. Both authored images show face and shoulder space. Every point button is also fully contained, and the newly reachable bottom-right native click emits exactly `{type: "move", pointId: "12,12"}`.

The production CSS is frozen at4816 LF bytes (2820→4816,+1996),25 `!important` (18→25,+7),2 media rules (1→2,+1 existing landscape family),4867 physical bytes. No added file/import, color, z-index, motion or source owner. Official fixture accepts an optional `page.addInitScript` public-room payload and keeps ordinary defaults intact. Two permanent special-landscape tests use the Node-side server factory/public view, then assert square geometry,169 center hits, complete actions, separated meta/art/clock rows, dock clearance, native move payload and portrait/desktop restoration. Full17 interface-browser tests and133 focused RoomScreen/style/theme tests pass; ESLint on fixture/spec and `git diff --check` pass.
