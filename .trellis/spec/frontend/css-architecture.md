# CSS Architecture

> Project-specific contracts for SigrikaGo stylesheet work.

## Scope

Use this guide before changing `src/styles/**`, player theme CSS, HUD compatibility CSS, mobile safety layers, or CSS contract tests. The current goal is depollution and maintainability without visual redesign.

## Layer Order

`src/styles.css` is the only global CSS entry imported by React. Keep it as an import map:

1. Shared foundation and domain entries such as `base.css`, `lobby.css`, `room.css`, `modals.css`, `commerce-settings.css`, and responsive/mobile entries.
2. Terminal/HUD compatibility entries.
3. `hud-components.css`.
4. `tailwind.css` as a prefixed utility layer.
5. `themes.css`.

`src/styles/themes.css` keeps theme styles after HUD compatibility and imports `mobile-adaptive.css` last. Do not move `mobile-adaptive.css` earlier; it is the final phone, portrait, landscape, and narrow-desktop safety layer.

## Bright School Contract

### Portrait social-profile records

Self and social dossiers share the compact record presentation: no visible character-record or recent-ten heading, centered single-row recent results, and an accessible icon-only replay button in the total-games summary. Shared record selectors target `.profile-resume-view`, not only `.profile-resume-view-self`; context-specific identity actions and scroll ownership stay separate. Lock both surfaces with DOM tests so a self-profile polish cannot silently leave social details on the old markup.

At widths up to 768px, `.user-profile-modal .profile-resume-view-social` owns vertical body scrolling. The social record panel and character section use natural block height; `.profile-character-table-scroll` has automatic height, no maximum height, and visible overflow inside that body scroller. Do not compress it into a residual `minmax(0,1fr)` row: identity, social actions, mode tabs and the recent-results summary can consume all available height. Verify the last record is reachable at 360x640 with and without title stickers. Preserve self-resume and desktop scrolling contracts.

### Hanging student ID and handbook spacing

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

Player modal content uses `mobile-adaptive/modal-control-gutters.css` after the exterior modal gutters. Keep native overflow ownership intact while hiding scrollbar chrome inside player modal backdrops. Narrow settings, friend, warehouse, watch, ranking and handbook scroll content reserves explicit top/right/bottom/left padding for button transforms and hard shadows. Verify the final content row at maximum scroll and while pressed; do not fix clipping by deleting shadows or disabling scrolling. Handbook decoration cards are 80px squares with 10px padding and diagonal black/white preview stones; selection and pending state remain native ARIA/disabled attributes, without visible status text or checkmarks.

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

The product-approved desktop window-entry pass is a separate shell-level family owned by `modals/window-entry-motion.css` under `screen and (min-width: 769px)`. It targets only explicit player-window roots: ordinary windows use a 260ms 16px/0.96 entrance, data windows and nested details use 200ms restrained variants, and information-center master/reader panes use 220ms directional entrances delayed by 40ms and 70ms. Use the individual `translate` and `scale` transform properties so Bright School's intentional static `transform: none !important` anti-bleed winner cannot erase the keyframes; do not remove that anti-bleed contract globally. Every entry uses `backwards` fill, never `both` or `forwards`: delayed panes still receive their first frame, while settled window shells release the individual transform components so nested `position: fixed` backdrops remain viewport-relative. Story, character-opening, recruitment-cinematic, and mobile-sheet owners remain outside this family. Per the explicit product direction for this pass, this owner intentionally has no `prefers-reduced-motion` branch; do not generalize that exception to other motion owners.

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

For both profile contexts, empty character records retain the `.profile-character-section` card shell and add `.profile-character-empty` for a compact centered label instead of the header/table/scroller. The empty record panel uses natural rows; populated table scrolling stays unchanged.

`mobile-adaptive/guided-actions.css` owns soft gold paper fills, 3px campus-weight borders, restrained shadows, left-aligned copy and trailing chevrons, with a masked localized animated edge highlight for enabled story-footer and tutorial action buttons. Exclude native and ARIA disabled controls. Keep the pseudo-element content/display explicit to beat room resets; reduced-motion selectors must match the enabled selector specificity. Preserve long-choice wrapping, board target rings and skip/close semantics. Check computed pseudo content and reduced-motion animation, not animation-name alone.

Guided story/tutorial option groups use equal-height grid tracks on desktop. At 768px and below, use one full-width column with natural row heights. Preserve wrapping rather than clamping the longest response.

Story modal grids reserve an `auto` final action track rather than a fractional track: wrapped guided buttons must not overflow into bottom padding. Bound option lists with `min(34dvh, 260px)` and scroll within their padded area, including desktop.

Story continue/finish controls keep width: 100% without a fixed maximum width, filling the same footer as the choices.

Story and battle continue/continue-now controls share the 18px outline Play glyph with aria-hidden. Explicit continue choices use it too; ordinary replies retain MessageCircle.
