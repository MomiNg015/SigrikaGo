# CSS Architecture

## Player UI selection

`base/foundation.css` disables native selection on `.app-shell.player-theme-enabled` and native image dragging within that shell. Restore text selection for input, textarea and non-false contenteditable elements. Admin uses its separate shell and retains selection. Do not replace this with transparent `::selection` paint or document-level mouse/selection blockers; preserve keyboard focus, touch scrolling and business pointer handlers. Check real drag sweeps and editable text selection under the full theme cascade.

## Practice dialog framing

`practice-sheet.css` keeps the close control in flow with `flex: 0 0 auto`; the shared window-sticker owner supplies its 36px square. Do not force a 44px flex basis against the shared 36px height. `practice-sheet-dialogue.css` owns both viewports: the portrait mask preserves desktop 240:218 geometry, the image stays at 100% width with its intrinsic ratio, and the -7% top inset leaves the authored head inside the mask. Mobile width scales from 154px to 240px; bubble width reserves portrait and tail space. Long copy grows naturally and the backdrop scrolls. Typography layers must not resize the portrait or impose a fixed dialogue height. The practice-window cases in `interface-polish.spec.js` check real HomeScreen ancestors, alpha bounds, three story states, five widths and close interactions.

## Global typography contract

Production UI uses the bundled LXGW Marker Gothic face (`Sigrika Window Title`) through `--font-ui-default` or `--font-window-title`, including admin, controls, ordinary numeric text and board coordinates. Local font-family declarations and font shorthands must use shared tokens instead of system/monospace overrides. Preserve current sizes, weights, line heights and numeric features. Keep all existing WuWa semantic selectors, faces and unicode ranges unchanged. IRIS entry and window are excluded as a whole: preserve the original Dotted Songti / WuWa mixed tokens, owner rules and fallbacks. Check computed fonts under full theme imports; verify actual custom font loading and IRIS independence from the global default. Raster lettering and historical standalone design samples are outside the runtime font contract.

Ordinary reading content is the explicit exception to preserved weight/spacing: `mobile-adaptive/text-readability.css` loads last and owns skill descriptions, trait explanations, character/item copy, information-center prose, mode rules, practice help, chat, story dialogue and ordinary admin prose. Use weight 400, `font-synthesis-weight: none`, `--font-reading-tracking: 0.025em` and `--font-reading-leading: 1.65`; scrollable detail prose has a 15px floor. Inline spans, emphasis and trait buttons inherit the paragraph typography despite theme resets. Do not broaden this to headings, compact labels/actions, WuWa or IRIS. Browser checks must cover dense Chinese wrapping, reachable final text/actions and trait interaction at desktop and portrait 320/390px.

> Project-specific contracts for SigrikaGo stylesheet work.

## Scope

Use this guide before changing `src/styles/**`, player theme CSS, HUD compatibility CSS, mobile safety layers, or CSS contract tests. The current goal is depollution and maintainability without visual redesign.

## Layer Order

### Ordinary window paper

`mobile-adaptive/window-paper-surfaces.css` owns the final normal Bright School window background: existing `--theme-bg` and `--theme-paper-grid`, 20px square cells, top-left repeat. Use its explicit window-shell list; do not use substring class matching or repaint cards/controls globally. Storefronts and their nested dialogs, admin, story/tutorial stages and authored recruitment/corrupted cinematics retain their dedicated backgrounds. Dossier page wrappers stay transparent so they do not hide the paper; the approved warm-paper hero and semantic cards use opaque cream fills. New ordinary window owners must preserve this winner. Verify computed color/image/size in a real browser, including nested dialogs and mobile, instead of only source declarations.

`profile-identity-tools.css` owns social-profile toolbar geometry; the later `profile-paper-actions.css` owns its approved opaque colors and interaction states. The older dossier geometry rule targets self-profile identity controls only; applying it to social tools reintroduces oversized 14px corners through five high-specificity exclusions. Preserve 44px icon targets, native disabled/focus behavior and title/ARIA labels.

### Character selection stamps

`MatchCharacterCardContent` owns the transparent `selection-stamp-{flag,1,2,3}-v2.png` image inside `.match-character-id`. The stamp center is inset diagonally toward the card interior by 30% of its size using `top: 0; right: 0; transform: translate(20%, -20%) rotate(var(--selection-stamp-tilt))`. The red ring is thick and distressed, with solid flag/numerals and coarse transparent missing-ink texture. Generate its random local angle in [-15, 15] once per mounted card, so rerenders and selection toggles preserve it. Ordinary selection uses the flag; team selection uses the fixed slot index, retaining III when II is cleared. Do not restore the selected-card pseudo-element border or old order badge. Keep keyboard focus visible separately and reserve stamp overhang in desktop and portrait scroll gutters. DOM tests cover asset choice, vacancy stability and angle persistence; browser checks must validate loaded, unclipped stamps at 1440px, 390px and 360px.

Card press feedback follows the battle clock's displacement/shadow relationship: apply `translate: 4px 6px` to the whole `.match-character-id` when its button is selected. Portrait, frame, name and stamp move together. The default hard 4px/6px shadow belongs to a `::before` raster backing at z-index -1, beneath all card content; selection clears its filter. Never filter the foreground frame: its transparent photo opening casts an inward shadow onto the portrait and visually separates the subject from the card. Reduced motion disables the 150ms translate transition while preserving state displacement. Browser regression checks compare portrait/frame/name bounds before/after and assert identical 4px/6px deltas with the same scroll position, plus no foreground filter.

`src/styles.css` is the only global CSS entry imported by React. Keep it as an import map:

1. Shared foundation and domain entries such as `base.css`, `lobby.css`, `room.css`, `modals.css`, `commerce-settings.css`, and responsive/mobile entries.
2. Terminal/HUD compatibility entries.
3. `hud-components.css`.
4. `tailwind.css` as a prefixed utility layer.
5. `themes.css`.

`src/styles/themes.css` keeps theme styles after HUD compatibility and imports `mobile-adaptive.css` last. Do not move `mobile-adaptive.css` earlier; it is the final phone, portrait, landscape, and narrow-desktop safety layer.

The admin route independently imports `admin.css` after its lazy module loads. Its shell responsiveness therefore belongs to `admin/shell-layout.css`; an earlier global mobile rule can lose after navigation. Below 900px the admin shell uses one column, a native horizontally scrolling navigation rail and a remaining-height main scroller. Preserve desktop sidebar dimensions and shadow gutters. Admin muted copy uses its own neutral palette and checkbox inputs must not inherit text-input width rules.

## Bright School Contract

### Shadow clipping boundaries

Scrollable panel padding is functional shadow clearance, not decorative surface styling. Do not reset it when clearing backgrounds or borders. Check right/bottom shadow extents at both scroll endpoints, including theme tabs and short portrait screens. Animated shop card layout must budget for rotation, maximum floating displacement and cast shadows before scaling; retain the product stage paint containment.

### Reviewed window state and content sizing

Portrait shop dialogue must clear desktop bottom anchoring before using auto height; test long copy against the painted frame after fonts load. Auth pressed state must remain distinct after pointer/focus leaves. Personalization keeps its bounded inner scroller but uses content height, with accessible saved/preview markers that do not persist until Save. Friends and blacklist use the approved [companion layout](./friends-companion-contract.md): identity and status stay grouped in selectable paper cards, with a separate action panel and unchanged left bookmark rail. Desktop retains the 760px shell; portrait stacks the scrollable roster above the companion. Hard-shadow gutters and shared nameplate constraints apply to both panes. Mobile leaderboard names use ellipsis instead of hard clipping. Constrain both the identity grid track and its main row; text-overflow alone cannot fix an intrinsic-width child clipped by its parent. Desktop duplicate-rank visibility belongs to the final theme leaderboard rule. Audio range inputs retain keyboard behavior while theme tracks use the numeric progress variable and portrait labels share a row with values.

### Portrait social-profile records

Self and social dossiers share the compact record presentation: no visible character-record or recent-ten heading, centered single-row recent results, and an accessible icon-only replay button in the record summary. The shared record card keeps replay in its header, then shows total games, wins, losses, draws and win rate in five aligned columns with values above labels and a separator before the rate; rank and record occupy two desktop columns (1:1.5), and each spans the full summary row on portrait mobile. Rank and record titles share typography, line height and color; do not vary title colors by card position. Shared record selectors target `.profile-resume-view`, not only `.profile-resume-view-self`; context-specific identity actions and scroll ownership stay separate. Lock both surfaces with DOM tests so a self-profile polish cannot silently leave social details on the old markup.

At widths up to 768px, `.user-profile-modal .profile-resume-view-social` owns vertical body scrolling. The social record panel and character section use natural block height; `.profile-character-table-scroll` has automatic height, no maximum height, and visible overflow inside that body scroller. Do not compress it into a residual `minmax(0,1fr)` row: identity, social actions, mode tabs and the recent-results summary can consume all available height. Verify the last record is reachable at 360x640 with and without title stickers. Preserve self-resume and desktop scrolling contracts.

Empty character records retain the ordinary framed `.profile-character-section`, with a compact `WindowEmptyState` nested inside it. Never put the borderless empty-state class on the section itself or collapse the residual grid row. Empty social/bookmark bodies use a growing flex record panel on narrow screens; populated social records keep natural height and the existing body scroller. Verify empty-to-populated mode changes at desktop and portrait sizes.

### Hanging student ID and handbook spacing

Portrait home gives the match artwork a 32px wider region with symmetric -16px margins and `clamp(248px, 70vw, 300px)` height in the final student-ID layout owner. Compact utility spacing belongs to real grid rows (`max(52px, 13.5vw)`), not nth-child offsets that leave phantom space. Preserve painted-frame bottom clearance and verify the last action remains reachable on short screens. Desktop geometry remains independent.

The student-ID photo frame must center the image box on both axes: shared image rules can force intrinsic height even with `height: 100%`, so use frame-owned flex centering and `object-fit: contain`. Preserve costume framing from the shared portrait resolver. Its username uses `UserIdentity` with only the equipped nameplate asset; do not add title/badge rows. Scale the nameplate independently from text sizing so the portrait-phone username remains readable, and retain exact asset-ID effect hooks.

`HomeStage` centers the desktop handbook between the board-anchored `.home-student-id-zone` right edge and `.home-match-feature` left edge. Observe their containers and sizes with `ResizeObserver`; subtract the current translation before computing the new `--home-manual-center-offset` so repeated callbacks never accumulate movement. At 768px and below clear the desktop variable and retain the portrait CSS placement. Do not approximate the midpoint by translating half of the capped stage's surplus width: the two neighbors have different positioning containers. On desktop, first set the board-owned `--home-student-id-left` to the greater of its existing 8% anchor and the actual stage left edge plus stage padding; then measure the ID for handbook centering. Clear both positioning variables on portrait mobile and cleanup. Keep the match entry fixed and verify equal side gaps at multiple desktop widths.

Bright School is the default player theme. Its entry map is:

1. `themes/bright-school/base.css`
2. `themes/bright-school/gallery-polish.css`
3. `themes/bright-school/surface-contracts.css`
4. `themes/bright-school/component-repairs.css`
5. `themes/bright-school/qa-guard.css`

`surface-contracts.css` replaces the old broad fallback cleanup stack. It may reset inherited HUD effects only through explicit owner selectors and known surface contracts. It must not reintroduce purge/firewall naming, broad substring selectors, or all-element theme resets.

When an owner must override `backdrop-filter`, declare `-webkit-backdrop-filter` first and the standard `backdrop-filter` second. Lightning CSS may collapse adjacent prefixed/unprefixed declarations during production minification; the standard declaration must be the retained winner so Chromium does not fall back to an earlier shared blur. Any such production-sensitive contract must be asserted against built `dist/assets/*.css` through `npm run check:built-css`, not only against source text.

### Final mobile home Header/menu owner

The portrait Bright School home Header has two structural owners: the theme-level composition in `themes/bright-school/mobile/home-shell/top-strip-menu.css`, followed by the final post-theme guard in `mobile-adaptive/bright-school-overrides/home-header-menu.css`. The final owner must repeat the `brand mascot actions` grid, hide the desktop `.topbar-actions`, preserve the independent 44px toggle column, and reset the expanded panel to `left: auto; right: 0` with its bounded full width. This prevents generic 44px touch-target rules from turning the expanded menu into an off-screen or single-column strip.

```css
/* Wrong: the panel can inherit the toggle's 44px geometry or expand off-screen. */
.home-mobile-menu-panel { right: 0; }

/* Correct: the final Bright School mobile owner clears the opposite inset and locks all width bounds. */
.home-screen .home-mobile-menu-panel {
  left: auto !important;
  right: 0 !important;
  width: min(148px, calc(100vw - 28px)) !important;
  min-width: min(148px, calc(100vw - 28px)) !important;
  max-width: min(148px, calc(100vw - 28px)) !important;
}
```

Header browser QA must use the real `.home-screen` ancestor and the complete desktop action row plus all mobile-menu buttons. A reduced mock containing only one action button cannot reveal the cascade failure seen in the real page. Contract tests must assert the final owner import, hidden desktop action row, cleared left inset, right alignment, bounded panel width, and 44px toggle column.

### Mobile modal shadow and clipping contract

Portrait modal backdrops are the containing block for both the dialog and its visible shadow. Use `inset: 0` plus safe-area-aware backdrop padding, size the dialog to `width: 100%` of that padded content box, and subtract the same vertical padding from its `max-height`. The right and bottom padding must reserve the largest owned hard-shadow bleed; do not use `100vw` for the child because a root scrollbar can make viewport width wider than the actual content box.

```css
/* Wrong: the dialog can include the root scrollbar width and place its shadow outside the viewport. */
.modal-backdrop { padding: 10px; }
.modal { width: calc(100vw - 20px); }

/* Correct: the padded backdrop owns safe areas and asymmetric shadow clearance. */
.modal-backdrop {
  inset: 0;
  padding: calc(10px + env(safe-area-inset-top))
    calc(12px + env(safe-area-inset-right))
    calc(14px + env(safe-area-inset-bottom))
    calc(10px + env(safe-area-inset-left));
}
.modal {
  width: 100%;
  max-width: 100%;
  max-height: calc(100dvh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
}
```

The final post-theme owner is `src/styles/mobile-adaptive/modal-shadow-gutters.css`. New ordinary or nested player dialogs with an exterior shadow must join this explicit selector family or prove that their component owner reserves equivalent bleed. Contract tests must lock the final import, `inset: 0`, percentage child sizing, safe-area padding, height subtraction, and the absence of viewport-width child sizing. Browser QA must cover 360x800, 390x844, and 412x915 with zero document-level horizontal overflow and a still-scrollable over-height dialog.

### Bright School handbook unobtained-roster contract

Unobtained handbook cards use three explicit owners after `handbook-decoration.css`: `handbook-unobtained.css` centers the existing portrait/name content and owns the medium-light grayscale CRT surface, `handbook-hidden-intel.css` owns the square question-mark `NO SIGNAL` monitor, and `handbook-signal-motion.css` owns all fault keyframes plus the reduced-motion still. The state is strictly achromatic: do not use Bright School pink, blue, other chromatic accents, dark terminal-style fills, or persistent scanline/grid overlays. The resting surface uses a restrained 10%-to-27% ink mix and the portrait uses `brightness(0.9)`; sync tears and content displacement occur only in short stepped bursts. Keep the real hidden character name out of the DOM, expose the placeholder as one `role="img"` labelled `暂无情报`, and do not restore secondary availability copy.

Portrait rules in `mobile/house-profile/character-grid-cards.css` must preserve the visible `暂无情报` label. Its selector must be at least as specific as the existing `.house-modal .character-card.portrait-card > strong` hide rule; a shorter `.house-modal .hidden-intel-card > .hidden-intel-label` selector loses even with `!important`. `HouseModal.test.js` must lock the accessible copy, absence of `暂不可获取`, all three owner imports, centered grid contract, achromatic token contract, reduced-motion coverage, and the specificity-bearing mobile selector. Browser QA at 390x844 must confirm equal card/monitor/label centers and zero document-level horizontal overflow.

### Visual mask, shadow, and scrollbar ownership

Player modal content uses `mobile-adaptive/modal-control-gutters.css` after the exterior modal gutters. Keep native overflow ownership intact while hiding scrollbar chrome inside player modal backdrops. Narrow settings, friend, warehouse, watch, ranking and handbook scroll content reserves explicit top/right/bottom/left padding for button transforms and hard shadows. Verify the final content row at maximum scroll and while pressed; do not fix clipping by deleting shadows or disabling scrolling. Handbook decoration cards are 80px squares with 10px padding and diagonal black/white preview stones; selection and pending state remain native ARIA/disabled attributes, without visible status text or checkmarks. The decoration tab omits the former heading/reset row and extra top separator. Always render default black/white stones as the first chip; it calls the existing empty-ID reset action, stays selected when no decoration is equipped, and remains available without owned decorations.

When an image needs rounded cropping plus an exterior shadow, the crop belongs to an inner mask and the shadow belongs to that mask or an unclipped outer compositor. Badges and other decorations remain siblings of the mask so they are not clipped. Do not put `overflow: hidden`, the image, and external decorations on the same owner.

Scrollbar styling must be attached to a semantic shell and, where necessary, its root `html`/`body` state. Never style scrollbars through a bare global `*` selector: terminal/HUD cyan, Bright School paper pink/blue, and admin neutral gray-blue are independent visual contracts. An outer panel with `overflow: hidden` must also reserve explicit right/bottom shadow gutter and subtract that gutter from its scrollable children rather than removing or weakening the shadow.

CSS/DOM contract tests must assert the avatar mask structure, visible outer overflow, themed scrollbar scope, absence of a bare universal scrollbar rule, and the admin panel gutter/max-height relationship.

## Selector Rules

### Home hanging student ID

The card is now a direct child of `.home-main-panel`, positioned absolutely at the left part of the board's top edge. Always reset `grid-area: auto !important` on `.home-student-id-zone`: inherited `grid-area: player` creates an implicit grid containing block and shrinks/moves the absolute card to the far right. Keep responsive width on the board via `--home-hanging-id-width`, and reserve its hanging clearance in the stage rows. The pin is decorative and non-interactive. All card hardware and edges use the same hand-painted style as the handbook.

`PlayerPlaque` now renders `.home-student-id` with the complete transparent metal-hook card asset. Keep live portrait and username overlays in the narrow right column, with the name below the portrait; do not restore full-width content, ranks or achievement equipment. Use the shared costume/effect-aware portrait resolver. `mobile-adaptive/home-student-id.css` owns the final stage layout and clears inherited button and zone chrome with the full duplicated Bright School specificity. Assert actual computed background/border/shadow in browser QA: a shorter `.app-shell` selector loses to theme button rules even with `!important`. Preserve resume click/keyboard/disabled behavior and verify portrait mobile widths of 360, 390 and 412px without horizontal overflow.

Allowed patterns:

- Explicit owner selectors such as `.settings-modal-content`, `.announcement-list-row`, `.lock-character-card`, `.store-owned-tag`.
- Scoped theme selectors under `.app-shell.player-theme-enabled.theme-bright-school`.
- Duplicated Bright School specificity only for late override layers that must beat earlier `!important` rules.
- Board and skill selectors owned by their domain files, not by generic theme resets.

Forbidden patterns:

- Broad theme substring fallbacks such as `[class*="panel"]`, `[class*="card"]`, `[class*="item"]`, `[class*="row"]`, `[class*="dock"]`, `[class*="setting"]`, `[class*="lock"]`, `[class*="decor"]`, or `[class*="owned"]`.
- Theme-scoped `*` resets for `box-shadow`, `text-shadow`, `filter`, `transform`, backgrounds, or pseudo-elements.
- Generic room `button`, `img`, `svg`, `span`, or pseudo-element resets that can catch board points, stones, Pixi canvases, skill overlays, or final mobile controls.
- Empty compatibility files kept only as a fallback hook.

If an inherited HUD artifact still leaks through, add the smallest explicit selector in the owning domain or `surface-contracts/` file, then add or update a CSS contract test that checks both the intended rule and the forbidden broad fallback absence.

## Protected Surfaces

### Original handbook with left tabs

Keep the original handbook window and card owners. The generated book/card artwork and `handbook-book.css` / `handbook-character-cards.css` overrides were reverted at the user's request. Retain `WindowBookmarkTabs` only: active character and decoration panel roots must remain direct children of `HouseModal` so original scrolling and direct-child decoration cleanup selectors still match. Do not wrap them in an illustrated page or impose new column counts. Exclude the corruption archive from normal tabs; keep details and sortie voice lifecycle unchanged. Verify both tabs, keyboard navigation and content reachability on desktop and portrait phones.

Treat these as high-risk during cleanup:

- `src/styles/room/board/**`
- `src/styles/themes/bright-school/effects/**`
- Pixi canvas hosts such as `.board-effects-canvas`
- Board point buttons, SVG grid, stones, scoring marks, row slash, protocol marks, and targeting previews
- `src/styles/mobile-adaptive/**`
- Bright School portrait room/mobile guard layers

Do not migrate or restyle these surfaces unless the task explicitly targets them and includes visual or stability verification.

## Debt And Expansion Contracts

`src/styles/cssLayerInventory.js` owns the current CSS cleanup contracts.

- `CSS_DEBT_BASELINE` is the current all-`src/styles` non-growth baseline for CSS file count, bytes, `!important`, hardcoded hex values, media-query files, reduced-motion files, and high z-index files. It includes the current hidden player-window scrollbar, mobile music shop card, left-aligned replay-time, story-player padding, the theme-owned desktop Zahira raster/header treatment and final-mobile portrait raster selector, the final `bright-school-overrides/auth-login-lockup.css` split, the exact-asset open-starlight rune-ink Semantic Ignition owner with its persistent rim, separated open-center left-to-right filaments/contour streams, and paired right-tail streaks, the costume system's import-only shared entry with separate storefront/detail/motion files plus wardrobe/Bright School/final-mobile owners, the six-file mailbox owner set for its text-only list, completion dimming, independent attachment stage, portaled item detail, and desktop/portrait safety, plus Sigrika's bounded corruption-completion owners for deterministic static marks, the home/handbook surfaces, the isolated desktop/portrait duel action, and its Bright School late-theme guard. These bounded splits keep presentation ownership explicit; later cleanup should reduce these counts or document why another contract update is necessary. Do not treat the baseline as permission to add visual drift.
- `CSS_Z_INDEX_CONTRACT` registers the existing high z-index overlays. New values at or above `1000` must be registered there or replaced by an existing named layer, preferably a local token such as `--room-floating-z`.
- `CSS_MOTION_CONTRACT` records the current timing token sources and reduced-motion families. Motion-heavy CSS should animate `transform` and `opacity` where possible and keep `prefers-reduced-motion` coverage beside the owning family.
- `CSS_BREAKPOINT_CONTRACT` registers the current responsive media-query families. New breakpoint families need a desktop and mobile rationale plus contract-test registration.

### Lifecycle And Informative Motion Exceptions

The selected global toast is the upper-left paper drawer owned by `commerce/warehouse-toast/toast-stack.css`. Both its title and body use `--font-window-title` (existing LXGW Marker Gothic). Component-specific rules must beat the repeated Bright School generic text and button selectors; verify the computed font, semantic icon color and transparent borderless close control with the complete stylesheet. Keep `showToast(message, tone)` and the five-item newest-first queue intact. The default hold is 2600ms, then a 400ms leftward exit. Hover and keyboard focus preserve the remaining hold time; manual dismiss and unmount must not duplicate or leak callbacks. `FeedbackModals.dom.test.jsx` covers callback replacement, Strict Mode, overlapping pause reasons, manual dismissal and removal cleanup. Portrait 320/390px must wrap long copy without horizontal page overflow.

Exclude `.toast-lifetime > span` as well as `.toast` from the blanket reduced-motion selectors in the shared theme effect owner, the Bright School mobile motion owner and final `mobile-adaptive/reduced-motion.css`. Desktop coverage alone misses both portrait resets. Its linear `scaleX()` animation remains an informative duration indicator; translation is removed from the toast itself. Do not add a fade-to-zero lifetime keyframe that hides the message before React starts its exit phase.

The Bright School blanket reduced-motion owner must not force lifecycle-managed feedback or informative countdown progress to its final state after 1ms. Exclude the exact element from the blanket selector, then give the component a scoped fallback: toasts keep their authored lifetime and use an opacity-only exit transition, while timed request progress keeps its server-derived linear duration and uses left-origin `scaleX()` instead of width.

```css
/* Wrong: the toast becomes invisible immediately and the countdown jumps to empty. */
.theme-bright-school * { animation-duration: 1ms !important; }
@keyframes request-progress { to { width: 0; } }

/* Correct: exact exceptions retain information without layout animation. */
.theme-bright-school *:not(.toast):not(.room-request-toast-progress span) {
  animation-duration: 1ms !important;
}
.toast { transition: opacity 400ms ease, transform 400ms ease; }
@keyframes request-progress { to { transform: scaleX(0); } }
```

Required regression assertions: the toast exit state is transition-driven rather than keyframe-driven, reduced motion removes its translation while preserving the 3-second lifecycle, request progress owns `transform-origin: left center`, and no request-progress keyframe contains `width`.

### Component-Scoped Reveal Motion

Short reveal motion must belong to the element whose state or hierarchy changed, never to an unrelated page or modal shell. Chat and tutorial-record popovers stay mounted in an inert, `aria-hidden` closed state and use a retargetable 160ms opacity/transform transition so rapid open/close input can reverse naturally. Skill-trait popovers derive `transform-origin` and entry direction from `data-placement` plus `--skill-trait-arrow-x`. Mobile's generic press layer transitions only transform and necessary colors; paint-heavy filter or box-shadow feedback remains opt-in at the component owner.

Story reply choices, achievement toasts, result reward tiles, and settings tab panels are the approved component-level reveal additions from this audit. Their motion is bounded to 150-220ms, uses only opacity/transform, caps stagger at 120ms, and removes translation plus stagger under `prefers-reduced-motion`. Result reward keyframes live in the focused `modals/result-reward-motion.css` owner so `result-modal.css` stays below the 6000-byte concrete-file guard. Contract tests must prove selector scope, durations, stagger caps, reduced-motion behavior, and that ordinary toast/modal surfaces are not animated by these component owners.

The desktop window-entry family is owned by `modals/window-entry-motion.css` under `screen and (min-width: 769px)`. It targets only explicit player-window roots: ordinary windows use a 260ms 16px/0.96 entrance, data windows and nested details use 200ms restrained variants, and information-center master/reader panes use 220ms directional entrances delayed by 40ms and 70ms. Use individual `translate` and `scale` properties so Bright School's static `transform: none !important` anti-bleed winner cannot erase keyframes; retain that guard. Every entry uses `backwards` fill, never `both` or `forwards`: settled shells must release transform components so nested fixed backdrops remain viewport-relative. Story, character-opening and recruitment cinematics remain outside this family. The 2026-10-05 user-requested fluidity audit supersedes the earlier desktop reduced-motion exception: ordinary windows, nested details and portal fallbacks now disable entrance animation under `prefers-reduced-motion: reduce` without delaying content or focus.

Ordinary phone sheet keyframes likewise use individual `translate`/`scale`, with their reduced-motion bypass beside the existing owners. Fine-pointer lift belongs only to enabled actionable controls; static dossier/data rows, native/ARIA disabled and busy controls do not move. Keep paint and geometry selectors separate from hover motion in late theme guards, preserve authored artwork rotations, and verify computed winners with full application CSS. Never add a blanket lift or universal transform reset to board, skill, cinematic or corruption surfaces. The mobile home and room menus use bounded opacity/translate reveals with immediate input and reduced-motion stills.

```css
/* Wrong: Bright School's important anti-bleed transform wins over this keyframe. */
@keyframes modal-in { from { transform: translateY(16px) scale(0.96); } }

/* Wrong: the settled shell keeps transform components and traps fixed descendants. */
.modal-window { animation: modal-in 260ms cubic-bezier(0.16, 1, 0.3, 1) both; }

/* Correct: independent transform components preserve the static anti-bleed rule. */
@keyframes modal-in {
  from { translate: 0 16px; scale: 0.96; }
  to { translate: 0; scale: 1; }
}

.modal-window {
  animation: modal-in 260ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
}
```

## Tailwind Route

Tailwind v4 is installed only as a low-intrusion utility layer through `src/styles/tailwind.css`.

- The full staged execution plan is `.trellis/tasks/07-01-tailwind-migration-roadmap/tailwind-full-migration-plan.md`; read it before starting any broad Tailwind migration or protected-surface work.
- Keep the `tw:` prefix.
- Keep preflight disabled.
- Keep `src/styles/tailwind.css` import-only. Project semantic tokens live in `src/styles/tailwind/tokens.css` through `@theme inline` and must reference existing CSS variables or stable Sigrika values instead of inventing a second palette. Because preflight is omitted through individual Tailwind imports, keep `source("../")` on the `utilities.css` import so `src/` JSX pilot classes generate actual `tw:` utility CSS.
- Phase 1: baseline, contracts, and token scaffold only; do not migrate existing JSX or UI surfaces.
- Phase 2: pilot `tw:` utilities only in new low-risk surfaces or isolated admin/tooling UI.
- Current Phase 2 pilot: `src/admin/AdminAudit.jsx` uses the `AdminTableScroll` wrapper backed by the `ScrollArea` primitive for the admin-only audit table shell, replacing `.audit-table-wrap` overflow CSS without touching player-facing surfaces.
- Phase 3: build UI primitives before broad feature migration.
- Current Phase 3 primitives: `src/ui/primitives/ScrollArea.jsx` centralizes `tw:max-w-full` and `tw:overflow-x-auto`; `src/admin/adminComponents.jsx` wraps it as `AdminTableScroll` for all admin table shells while `.admin-table-wrap` still owns margin, border, radius, and background. `src/ui/primitives/Badge.jsx` centralizes visually equivalent `tw:inline-flex`, `tw:items-center`, and `tw:justify-center`; `src/ui/primitives/EmptyState.jsx` centralizes `tw:text-center`, `tw:px-3`, and `tw:py-6` for admin table empty cells through `AdminTableEmpty`; and `src/ui/primitives/Button.jsx` centralizes only action alignment utilities through `AdminActionButton` while existing admin CSS still owns `.primary-action`, `.secondary-action`, and `.danger-action` visuals. Feature components should consume these primitives or local wrappers instead of owning repeated raw utility strings.
- Phase 4: migrate repeated modal/list/card/form internals one domain at a time.
- Current Phase 4 pilot: `src/modals/modalComponents.jsx` wraps `Button` as `ModalActionButton`; the same modal domain now provides `InformationCenterLayout` for the announcement/mailbox desktop master-detail and mobile list-detail structure on top of `ModalDialog`. `src/styles/modals/information-center.css` owns neutral structure, while announcement/mailbox files own content visuals and `src/styles/mobile-adaptive/information-center.css` owns final post-theme safe-area and pane transitions. This does not authorize migrating unrelated player modals, action visuals, commerce cards, or gameplay controls.
- Phase 5: migrate home, lobby, and commerce main-flow non-gameplay layouts after primitives are stable.
- Current Phase 5 pilot: `src/home/homeComponents.jsx` wraps `Button` as `HomeActionButton`; `src/home/HomeScreen.jsx` uses it only for the match-mode picker cancel action. This moves only action alignment utilities through the primitive layer; existing home/modal/mobile CSS still owns match-mode layout, option buttons, spacing, artboard behavior, decorative imagery, colors, borders, shadows, typography, and responsive safety. Do not migrate home entry cards, home utility entries, player plaque art, match-mode option buttons, commerce cards, or gameplay controls from this pilot without focused desktop/mobile tests and visual checks.
- Phase 6: tokenise Bright School so theme CSS becomes variables plus explicit owner repairs.
- Phase 7: reduce final mobile safety layers only after matching desktop/mobile component ownership exists.
- Current Phase 6 pilot: `src/styles/tailwind/tokens.css` exposes Bright School paper, clean surface, ink, border, accent, and paper-shadow variables as semantic Tailwind tokens. Bright School value ownership stays in `src/styles/themes/bright-school/surface-contracts/final-root-surfaces.css` and `src/styles/themes/bright-school/quality-base/refinement-foundation.css`; do not move owner selectors or change visual values as part of this token scaffold.
- Current Phase 7 pilot: `src/styles/cssLayerInventory.js` only records the `mobile-adaptive` final guard reduction candidate. `mobile-adaptive.css` remains the final post-theme guard until replacement component ownership has phone portrait, small landscape, narrow desktop, and regular desktop coverage.
- Board, room, skill presentation, Bright School final mobile safety, and Pixi-related CSS stay CSS-entry owned until they have dedicated visual regression coverage.

## Verification

After changing CSS architecture, run the focused static contracts:

```bash
npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js src/styles/hudComponents.test.js
npm run build
npm run check:built-css
```

For room, board, skill, mobile, or broad theme changes, also run:

```bash
npm run verify:battle-fixes
npm run verify:stability -- tests/stability/skill-effects.spec.js
```

Run `npm run docs:system-design` whenever CSS architecture, theme structure, or technical-debt guidance changes.

### Portrait battle shadow and tooltip boundaries

Mobile player tap tooltips portal to the nearest `.app-shell`, preserving theme variables and `--room-floating-z`; never keep them beneath clipped player slots. Their own selector must work outside `.mobile-room-screen`. Choose the viewport half with more room and bound scroll height by available space. `mobile-adaptive/mobile-room-shadow-gutters.css` reserves right/bottom viewport and tab-panel bleed, permits board shadow overflow, and lets the dock size from its bounded scrolling panel instead of clipping it with a second maximum height. Verify 360x800, 390x844 and 412x915, including long tooltips, final scroll rows and unchanged document width.

### Empty records and guided actions

For both profile contexts, empty character records retain the `.profile-character-section` card shell and add `.profile-character-empty` for a compact centered label instead of the header/table/scroller. The empty frame stretches through the remaining body height, with its borderless empty-state content nested inside. Use a growing flex panel for narrow social/bookmark body scrollers; populated table scrolling stays unchanged.

`mobile-adaptive/guided-actions.css` owns soft gold paper fills, 3px campus-weight borders, restrained shadows, left-aligned copy and trailing chevrons, with a masked localized animated edge highlight for enabled story-footer and tutorial action buttons. Exclude native and ARIA disabled controls. Keep the pseudo-element content/display explicit to beat room resets; reduced-motion selectors must match the enabled selector specificity. Preserve long-choice wrapping, board target rings and skip/close semantics. Check computed pseudo content and reduced-motion animation, not animation-name alone.

Guided story/tutorial option groups use equal-height grid tracks on desktop. At 768px and below, use one full-width column with natural row heights. Preserve wrapping rather than clamping the longest response.

Story modal grids reserve an `auto` final action track rather than a fractional track: wrapped guided buttons must not overflow into bottom padding. Bound option lists with `min(34dvh, 260px)` and scroll within their padded area, including desktop.

Story continue/finish controls keep width: 100% without a fixed maximum width, filling the same footer as the choices.

Story and battle continue/continue-now controls share the 18px outline Play glyph with aria-hidden. Explicit continue choices use it too; ordinary replies retain MessageCircle.

### Ranked/friendly match badges
Opening labels and room-code tags share match-classification-tag and the late rank-progress.css owner. The room code needs the Bright School room-header-scoped selector to beat existing important paper tint rules. Rated uses a pale pink/red mix; friendly uses mint; both retain ink text and textual accessible classification. The 2026-10-01 CSS baseline adds 2313 normalized bytes, four important declarations in one existing file, and eight existing-palette/result-color occurrences for the requested record summary, replay circle and match badges.

Room member rows use three unequal columns: stone (20px), name (1.6fr), and rank (minmax(4em, 1fr)); all contents align left. Spectators retain the empty stone cell for column alignment. Portrait paper-player metadata restores the existing color-badge in column 1, username in column 2 and rank in column 3; do not add duplicate stone markers or re-hide the badge through older mobile rules. The bounded follow-up adds 485 CSS bytes and seven important overrides in the existing portrait owner.

The approved unequal three-column member-row refinement adds 86 normalized CSS bytes in the existing owner, without new colors or important declarations.

### Portrait board geometry
Keep board-stage and board-wrap square through width plus aspect-ratio, with height:auto. Use explicit minmax(0,1fr) tracks on the board slot and stage: min(100%,size) inside auto intrinsic grid tracks can collapse the board. Test both ordinary 320-900px portrait widths and a constrained 280px parent. Team portraits use the approved staggered-paper B design: disable the ordinary arched backing and use three separate diagonal paper masks in fixed lineup order. Mobile team rows are 108px high with 88–108px wide, 96px high artwork; single portraits keep their original geometry. Keep images upright inside masks; only finished slots become grayscale, and hidden slots never resolve an image.

Team portrait presentation lives in room/team-portraits.css, imported immediately after team-match.css. The split keeps each concrete file below 6000 bytes. Diagonal masks replace the rejected main-plus-thumbnails design without changing board geometry.

Selected compact A mobile layout lives in battle-paper-player-mobile.css: avatar left, four compact rows right (identity, clock, three statistics, skill), separate cards with 4px gaps and no rotation. Identity colors follow stone color; only active clock becomes yellow; overclock is pink; skill uses character accent gradient. Keep TimeBar progress and warning semantics. Board width is viewport-led, not reduced by player strip height.

Compact mobile cards now use two rows, with the avatar spanning both. Identity and timer share the upper grid area with explicit 60/40 widths excluding the 4px gap; statistics and skill share the lower area. Keep stat labels and values inline. Skill presentation lives in battle-paper-skill-mobile.css to keep each owner below 6000 bytes.

The final `readable-type-battle.css` owner must retain the identity's single stone/name/rank row with right-aligned rank and the statistic label/value row. Typography adjustments must not replace these with stacked rows. Statistic cards reserve 5px horizontal padding (4px at <=360px); use content-sized minimum grid columns so three-digit values cannot consume that inset. At 360px and below, statistics receive 70% of the lower row and use 12px values to contain three digits; the skill card retains the remaining 30%. Header title and controls share one row, including development tools. The optional test-tool group scrolls within a fluid 32–100px lane; coordinate/exit/menu remain visible. Contain scoreboard metadata and player tracks within their title column, using ellipsis on narrow screens. The icon-only coordinate toggle precedes exit in `.room-header-quick-actions`, a nowrap flex group on mobile and `display: contents` on desktop, where the existing utility toolbar remains. The ordinary portrait popup is 128px wide with only message/settings actions; center each icon/label pair without wrapping. Coordinate controls must retain the existing ordinary/corrupted theme states after moving outside the popup. Ordinary portrait header/action controls and the dock use the identity card's 1px/2px mixed-ink shadow via `--battle-control-shadow`; pressing compresses it with matching displacement, and reduced motion removes displacement through `--battle-control-press`. Check the production fixture at 320/360/390/492px plus desktop; protect the separate skill-button state owner from restoring a heavier shadow. Existing scoreboard black/white literals express the stone turn and are intentional.

Mobile identity stone-color overrides must exclude .has-nameplate names and their ancestors. Nameplate text-fill uses currentColor so the nameplate palette and text-shadow remain authoritative. Verify actual UserIdentity markup with decorated and plain names; plain text fixture names cannot validate this contract.

BattleUserIdentity measures untransformed content and scales the whole mobile identity uniformly. Do not set independent width/height overrides on nameplate artwork; full names remain single-line without ellipsis.

A 4px mobile timer track must reset legacy 2px borders to zero; otherwise border-box content height becomes zero despite correct inline progress width. Verify rendered fill height and width ratios across changing main/byo-yomi values, not merely display:block.

Battle identities temporarily disable nameplates through UserIdentity showNameplate=false. battle-info-typography.css uses the existing LXGW title face for player/header/action/replay/chat/result numeric content, including portaled tap tooltips and chat. Board coordinate and stone-number selectors stay outside this owner. Preserve regular mobile numeric weights.

### Leaderboard podium
The approved leaderboard uses the scoped `leaderboard-podium-modal` shell and three bounded final owners: `leaderboard-podium.css`, `leaderboard-podium-winners.css`, and `leaderboard-podium-mobile.css`. Do not reintroduce legacy `.leaderboard-row` overrides or a selected-first-place detail strip. Use only the first three server-ordered players for the gold/silver/bronze podium, with unique 1/2/3 positions and explicit second/first/third grid columns; remaining equal-score players start in the list at fourth. Mobile rows group placement with avatar, identity with compact shared rank progress, and rate with wins. Full records remain desktop-only; capture mode keeps record portrait/snapshot and captures. The personal row is outside the scroll container. Real equipped UserIdentity assets have fixed minimum widths: fit the complete identity to its slot, preserving aspect ratio, and verify both decorated and plain names at 320px. Test against production CSS, not only the isolated design sample.

### Approved warm-paper profile rollout

`profile-paper-cards.css`, `profile-paper-actions.css` and `profile-paper-mobile.css` own the selected opaque card treatment after the existing profile geometry and window paper owners. Keep the body scroller bounded; do not copy prototype-only unbounded modal sizing. Use WindowBookmarkTabs directly, preserving panel IDs, pending guards and keyboard behavior. Its 3px right clip is scoped to dossiers and preserves the continuous 2px window border. The 12px cards, asymmetric hero/record corners and 9px controls intentionally follow the approved sample. Social actions remain in one compact bottom-right row at all widths. Other themes keep inline mode tabs and their existing surfaces.

Profile clipping follow-up: retain 8px top, 10px right, 12px bottom and 6px left body padding for card shadows and focus/press painting. The character section owns `overflow-x: auto` and `overflow-y: hidden`; do not let legacy visible overflow defeat rounded clipping or allow wide tables to extend into the body scroller. Clear negative table-header margins. The identity card shares the other cards' short shadow; only the avatar frame and mask have no shadow. Likes expose a live numeric count and a minimum 54px adaptive control; the footer preserves a single compact row on narrow phones.

Identity sizing and release availability follow [Profile Folder Contract](../backend/profile-folder-contract.md). Both contexts follow the original resume's 160px minimum (164px desktop content height, 160px mobile). Do not enlarge the resume to match the old social card. Desktop rank values center independently of their heading; mobile retains the original wrapping left-heading/right-value flex row, including the left-aligned wrapped value at 320px. Phone replay matches the 34px identity controls. The recent-ten label stays at the far left: desktop positions it independently of centered markers; mobile keeps a left-aligned full label row above them. Verify 0/3/10 centered results and both contexts in a browser. Do not remove the hero shadow from the shared semantic-card selector.

### LXGW effective-size acceptance (2026-10-21)

Use the four bounded `mobile-adaptive/readable-type-*.css` owners after `text-readability.css` for the approved size tiers: detail prose 16px, functional labels 14px, metadata 13px and constrained battle labels 12px. Scope overrides to actual component owners, including nested text nodes; do not resize WuWa or IRIS. Profile statistic labels use 13px without enlarging identity cards. Phone player metadata puts the name above rank within the existing 48px ticket. Narrow clocks wrap the Chinese label without reducing WuWa digits. Development header tools wrap to a separate row when present.

Shop product cards retain their pre-remediation layout, dimensions, scaling and typography at the user's request; do not apply the general size tiers or scale compensation to those cards. Check effective pixels after all ancestor transforms, not just computed font-size, when validating other scaled surfaces. Registration keeps a fixed 38px username-label row for 14px two-line feedback and 8px form gaps; remove the old 68% hint-width cap, retain baseline alignment, and keep the 35px scrollable server-feedback region inside the existing 48px footer. Test errors as well as idle forms at 320/390/1440px.
