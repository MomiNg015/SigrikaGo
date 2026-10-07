# Player interface motion audit — 2026-10-05

Research-only inventory. No implementation was changed during this pass. Source review covered home, ordinary/nested windows, self/social dossier, handbook, settings, shop/recruitment, friends/ranking/watch, and live-room controls/popovers. Browser verification of computed winners remains necessary; source findings below distinguish confirmed ownership from likely cascade symptoms.

## Intended language and boundaries

Bright School already has a coherent paper-and-hard-shadow interaction language. Preserve it: short ink/color feedback, small paper lift for true actions, physical press depth, and a restrained window reveal. Ordinary actions already respond at 160 ms; adding continuous decoration to all controls would diminish the existing voice and compete with board play.

- Press: 100–160 ms; hover/focus acknowledgement: 160–200 ms; panel/menu reveal: 180–240 ms.
- Prefer transform/opacity. Avoid animating dimensions, margins, grid tracks, or scroll position as a new ordinary-control effect.
- Fine-pointer hover only; coarse pointers get clear active/selected states without sticky hover lifts.
- Keep focus outlines and native disabled/ARIA busy behavior. Pending controls do not lift or repeatedly pulse.
- Keep close/cancel immediate and never add a timer or animation-end dependency that delays unmounting, input, network requests, or focus restoration.
- Ordinary window motion must exclude story players, opening-duel presentations, skill banners, board/Pixi effects, recruitment cinematics, and Sigrika corruption. The existing product-directed persistent corruption exception is documented in frontend quality/CSS specs and must remain confined to those existing owners.

Read for this pass: `.agents/skills/impeccable/reference/animate.md`; `.trellis/spec/frontend/css-architecture.md`; frontend button-colors/quality guidelines; `src/styles/README.md`; CSS layer inventory/contracts.

## Cascade map

`src/styles.css` → shared/domain CSS → mobile/terminal compatibility → HUD → prefixed Tailwind → `themes.css`. Themes import shared, isolation, Bright School, then `mobile-adaptive.css` last. Mobile adaptive also contains many desktop-safe final component owners; do not move this entry earlier.

Bright School's late `qa-guard.css` imports `quality-base` (including `sticker-motion.css`), commerce/home/room/modals/mobile/effects, dossier repairs, then `button-color-roles.css` and **`button-color-states.css`**. This final semantic control owner intentionally overrides earlier universal button, selected-control, and refinement-control transforms.

Important transform resets in `surface-contracts/final-controls-forms.css` and `final-explicit-surfaces.css` suppress keyframes written against `transform`. Shared desktop windows already solve this by animating individual `translate` and `scale` properties in `modals/window-entry-motion.css`; use the same deliberate technique for ordinary mobile sheets if computed-style QA confirms suppression.

New CSS debt must be registered through `cssLayerInventory.js` with a concrete reason and metrics; no new z-index family, color palette, or breakpoint is needed. Reuse 768/769 px, hover/pointer, and reduced-motion families.

## Surface and owner inventory

| Surface | Semantic/input owner | Current CSS/motion owner | Assessment |
| --- | --- | --- | --- |
| Home ordinary header/menu buttons | `home/components/HomeHeader.jsx`, `InteractionFeedback.jsx` | `quality-base/button-color-states.css`, mobile header/menu final guards | Existing 160 ms hover/press is good. Mobile menu panel has no explicit reveal in its two final geometry owners. |
| Home match/manual artwork | `HomeImageEntries.jsx`; `.home-entry-motion` inside native button | base artboard image entries → theme effects/home-image-entry-buttons → final home placement | Multiple historical hover owners exist, but final artwork remains image-only. Preserve fixed hit-area/position and move inner artwork only. No continuous bobbing required. |
| Home utility artwork | `HomeUtilityDock.jsx`; `.utility-entry-motion` | theme utility-toolbox grid/interactions; mobile-adaptive/home-utility-interactions | 160 ms wrapper motion, bounded art shadow, reduced-motion coverage already exist. Final phone guard suppresses coarse hover and retains 1 px press. Good reference pattern. |
| Hanging student ID | native `.home-student-id` button in `HomeStage.jsx` | `mobile-adaptive/home-student-id-layout.css` | 220 ms hook-origin rotation, hover/fine/no-preference gate, disabled/focus guard already exist. Preserve anchor geometry while portrait implementation changes. |
| Ordinary desktop windows | modal backdrop + native dialog or `ModalDialog` | `modals/window-entry-motion.css` | 200–260 ms entrance with translate/scale independent of transform resets. Good; add only missing ordinary subclasses below. |
| Ordinary phone windows | modal backdrop + dialog | `mobile-adaptive/phone-interactions.css`, `motion-keyframes.css`, Bright School mobile/motion | 180 ms backdrop and token-duration sheet entry; transform keyframes can lose to important resets. No explicit ordinary owner reduced-motion beside these keyframes; cumulative global reduce works for default theme. |
| Self dossier | `ResumeModal.jsx`, `ProfileResumeView.jsx`, semantic tablist/tabpanel | shared house window entry; dossier geometry + `button-color-states.css`; bookmarks | Self window inherits house entry. Stable prior data remains visible during pending mode fetch; do not animate records on every room/user update. |
| Social dossier/detail | `UserProfileCard.jsx`, native identity buttons, cached/requested mode state | nested-profile, profile-social-actions, dossier repairs, campus tagged controls | Desktop `.room-floating-modal.user-profile-modal` is missing from shared entrance selectors; page appears abruptly. Report/blacklist/ordinary inline confirmations likewise absent. |
| Bookmark tabs | `WindowBookmarkTabs.jsx` preserves state, portals into opted-in window; ArrowUp/Down/Home/End | `mobile-adaptive/window-bookmark-paper.css` | 180 ms transform from X=7 to 0 gives strong state relation, native busy guards. Reduced-motion disables transition while preserving useful selected geometry. Good. |
| Settings tabs/panels | `SettingsModal.jsx` semantic tabs and native range | `commerce/shop-settings/settings-panel.css`, theme/mobile settings owners | 150 ms content reveal already exists; normal React reconciliation may retain panel node across tab changes (verify whether animation actually replays). Audio mute label forcibly removes transform/transition; color/icon feedback can be added on a bounded inner icon rather than moving the range row. |
| Handbook diagonal previews | `house/HouseCharacterGrid.jsx`; native button; pointer/touch/focus expanded state | `mobile-adaptive/handbook-strip-frame.css`, labels/paper | Purposeful 260 ms expansion; **flex-grow, portrait left, and phone height animate layout**. Bounded to six strips but should profile on portrait. Existing reduced-motion and scroll-clear preview logic are good. |
| Handbook full detail | `house/CharacterDetailDialog.jsx`; body portal/theme-preserving target | `mobile-adaptive/handbook-detail-figure.css` plus nested-window entry | Verify portrait reveal and portal ancestry before extending. Preserve full-body image geometry and single scrollbar. |
| Shop products | native `shop/ShopItemCard.jsx` button | shop-window-redesign; product stage paint containment; theme repairs | Existing moving/rotating artwork and shadow need gutter/containment preservation. New whole-card scaling must not compound the stage's existing transforms. |
| Shop signs and purchases | native switch/action buttons, `data-button-role` | signpost-switch; campus tagged button states | Good 160 ms physical feedback and reduced-motion. The semantic campus selector cannot be blindly applied to illustrated sign buttons. |
| Recruitment/gacha | ordinary action controls + cinematic owner | dedicated recruitment/cinematic, gacha stages | Keep time-aligned presentation and lock/recovery timing unchanged. Ordinary button microfeedback only. |
| Friends/ranking/watch | native action buttons + profile action entry; data rows | campus buttons, `sticker-motion.css`, final mobile list owners | Some sticker selectors (`record-card`, `leaderboard-row`, `friend-row`, `watch-room-row`) lift static/read-only rows. Actual friend list uses `.friends-row` plural in many owners, so singular `.friend-row` may be ineffective. Interactive row semantics must determine motion. |
| Live-room actions | native actions; mobile tablist; skill/board dedicated controls | campus ordinary states; final phone room tab guards | Ordinary move controls already use feedback. Selected phone room tabs intentionally use zero transform/filter/shadow. Preserve this stability; do not animate board, countdown layout, identity/nameplate ancestors, or every data update. |
| Room people/popovers | native `.room-person-entry` buttons; `RoomPeopleFloatingLayer` portals to app shell | `room/people-floating-replay.css` | 180 ms popover entrance exists. Local owner lacks reduce fallback, relying on broad theme/mobile ancestry; fallback-to-body portal can evade it. Add a scoped local reduce rule if touching this owner. |
| Capture/trait tooltips | native/tap help trigger; `PlayerInfo.jsx` app-shell/body portal | captures-tooltips and mobile-tap-tooltip | 140–150 ms entry already exists. Local mobile tooltip owner similarly lacks reduce fallback outside theme/mobile ancestry. Maintain placement transform; reduced fallback should remove animation, not position. |
| Toast/deadline feedback | timers + body portal | request-toast, chat responsive, toast | Preserve deadline scale-progress and SFX alignment. This is operational timing, not decorative animation. |

## Prioritized repairs

### P1 — Keep read-only and unavailable content still

**Owner:** `src/styles/themes/bright-school/quality-base/sticker-motion.css`.

Current broad `:where(...):hover` lifts by -5 px, rotates -1 deg, scales 1.02, and repaints a large soft shadow. It does not guard disabled, aria-disabled, or aria-busy for most listed cards. It also attaches motion to read-only `.record-card`/row shells and is not fine-pointer gated. This can make disabled or non-actionable data look clickable and can stick after a phone tap.

Replace broad hover allowance with explicitly interactive native buttons or true action rows, guarding disabled/busy and `(hover: hover) and (pointer: fine)`. Keep existing action-specific artwork owners authoritative. Prefer a smaller 1–2 px lift with no broad blur-shadow transition; static rows can retain a small color highlight only if it aids reading. Provide local reduce behavior and preserve static resting transformations of painted cards.

### P1 — Reliable ordinary mobile window reveal and social detail entry

**Owners:** `modals/window-entry-motion.css`; `mobile-adaptive/phone-interactions.css`; `mobile-adaptive/motion-keyframes.css`; `themes/bright-school/mobile/motion.css` if theme-specific entry wins.

Add explicit ordinary `.user-profile-modal`/report/blacklist/confirm shells to window motion rather than broadening all `.room-floating-modal` indiscriminately. Use 180–220 ms, small (6–10 px) independent translate/scale/opacity, preserving the `transform: translate(-50%, -50%)` positional centering of inline confirmations. Validate the real friends → details and room people → details portal paths.

For phone sheet entry, confirm the computed animation still moves at midpoint. If a late important transform removes displacement, convert owned keyframes to individual translate/scale (the established desktop pattern), not another specificity escalation. Add explicit local reduced-motion fallback for these ordinary windows so portal/body fallback and owner keyframes remain safe. Keep reduced motion instant or opacity-only ≤80 ms, with no hidden/backwards delay.

### P2 — Give mobile menus a small clear opening acknowledgement

**Owners:** `mobile-adaptive/bright-school-overrides/home-header-menu.css`; equivalent room mobile menu owner if separately applicable.

Native controls already press; the expanded panel is inserted without its own reveal. Add 160–180 ms opacity plus individual 3–4 px translate to the actual panel, with reduced-motion bypass. Keep full width/44 px toggle/geometry guards and zero input delay. No repeated animation on menu-item content re-render. No out-of-flow exit timer needed.

### P2 — Optional dossier mode commit feedback, with identity kept stable

**Owners:** `ProfileResumeView.jsx`; dedicated dossier record-panel CSS rather than hero/whole-dialog.

Mode changes preserve old data during fetch. If adding a one-shot reveal, trigger only after committed `normalizedMode` changes (e.g. stable mode key/data hook on record content), not on pending/failure or any user payload re-render. Use a 120–160 ms opacity/2 px translate content reveal. Preserve previous data, focus, scroll owner, tab keyboard behavior, and immediate newly clicked state. Avoid remounting the complete dossier or restarting portrait/nameplate effects.

### P2 — Bound tooltip/popover reduced motion to their own portal owners

**Owners:** `room/people-floating-replay.css`; `room/players-timers-skills/mobile-tap-tooltip.css`.

Add local `(prefers-reduced-motion: reduce)` animation bypass if these are changed. Keep placement transforms untouched. Current default app-shell ancestry is mostly covered; body fallback/coarse desktop could evade broad rules. This is an ownership hardening, not a reason for broad room motion changes.

### P3 — Remove unnecessary always-on compositor promotion

**Owners:** base artboard image entries `.home-entry-motion`, theme utility toolbox `.utility-entry-motion`, surface-contracts/home-utility-tabs; shop mascot images.

These set persistent `will-change: transform`/opacity despite short transitions. Six toolbox buttons plus large home art have significant texture area. Remove declarations where profiling shows no first-frame benefit or scope promotion to a short active owner. Do not replace with a global will-change rule. Continuous marquee/cinematic and corruption canvas owners are separate and should not be changed casually.

### P3 — Measure handbook expansion before architectural rewrite

**Owner:** `mobile-adaptive/handbook-strip-frame.css` and handbook contract/tests.

`flex-grow 260ms`, `left 260ms`, and `height 260ms` are confirmed layout transitions. The six-strip stage is constrained, so these are a performance risk rather than proof of jank. First measure preview swaps at 360x640/390x844 and desktop with all portraits loaded. If budget is poor, use a measured transform-based portrait offset and immediate geometry update with a 180–220 ms opacity reveal, or a focused FLIP design. Preserve accurate head landmarks and focus/touch expansion semantics. Do not silently replace the established diagonal preview design or grow JS infrastructure just to add motion.

### P3 — Unavailable action shake is overlong for routine feedback

**Owners:** `base/message-feedback.css`; `app/InteractionFeedback.jsx`; audio `UI_UNAVAILABLE_SHAKE_MS` contract.

Visual shake is 1063 ms and 5 px lateral repeats; it follows existing unavailable sound duration. A brief 180–240 ms, 2 px acknowledgement could be less disruptive, with a static color/opacity fallback. Do **not** shorten shared audio duration indiscriminately. If changing, separate visual duration from sound contract and inspect interaction tests first. Disabled card motion repair above has higher value and lower risk.

## Validation strategy

1. Contract/DOM checks focused on changed owners: CSS import order/debt baseline; local reduced-motion; transform/opacity-only new keyframes; no blanket `transition: all`; fine-pointer/disabled/busy guards; social dialog paths and self/social shared tabs. Run existing `styleContract.test.js`, `themeContract.test.js`, `cssLayerInventory.test.js`, ProfileResumeView/ResumeModal/UserProfileCard/HomeStage DOM tests, settings/house tests as touched. Do not add tests that only duplicate every declaration.
2. Real browser QA at 1440x900/1280x800; 390x844, 360x640; 844x390 landscape. Use the complete app CSS and actual ancestors. Capture rest, hover/focus, active, midway entry and settled entry; record `transform`, individual `translate`/`scale`, `animation-name`, disabled/busy effects and `prefers-reduced-motion` results. A source animation definition alone cannot prove it wins late CSS.
3. Verify tabbing/Escape restoration, repeated open-close, keyboard activation, quick profile mode switching, slow/error profile fetches, touch scrolling through last records, menu width and zero document horizontal overflow. The action must execute immediately even during reveal.
4. Keep list/card shadow gutters visible at first/last scroll row and while pressed. Avoid stacking transforms on stage cards or nameplate artwork. Verify home hook/card/manual geometry after portrait changes.
5. Run one live-room smoke pass with player info, captures tooltip, people popover, mobile dock tab change, ordinary confirm, and replay controls. Confirm board points, skill banners/marks, countdown, cinematic sequences, and corrupted-room owners compute the prior behavior.
6. Profile DevTools frame/layout timeline on phone handbook preview and shop stage; ordinary new reveals should not introduce layout events per frame or large filter/shadow painting. Target smooth 60 fps, acknowledging that desktop emulation is not a physical-phone performance guarantee.

The recommended first implementation is small: tame broad sticker hover; make ordinary sheets/social windows reliably reveal; add bounded mobile menu acknowledgement; keep existing shared action feedback intact. Subsequent passes should be driven by rendered evidence.
