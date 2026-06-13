# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

<!--
Document your project's quality standards here.

Questions to answer:
- What patterns are forbidden?
- What linting rules do you enforce?
- What are your testing requirements?
- What code review standards apply?
-->

(To be filled by the team)

---

## Forbidden Patterns

<!-- Patterns that should never be used and why -->

(To be filled by the team)

---

## Required Patterns

<!-- Patterns that must always be used -->

(To be filled by the team)

---

## Testing Requirements

### Startup preload, build chunking, and handoff check contracts

#### 1. Scope / Trigger
- Trigger: any change to login/startup preload behavior, runtime asset manifests, Vite build chunking, or project handoff verification commands.
- Startup preload is user-visible performance infrastructure; it must keep first-screen assets prioritized without forcing every optional BGM/voice/shop asset to block home entry.

#### 2. Signatures
- `loginPreloadAssets()` returns grouped assets: `criticalImages`, `deferredImages`, `images`, `criticalAudio`, `deferredAudio`, and `audio`.
- `preloadLoginAssets(assets, { concurrency, loadImage, loadAudio, loadEffectAudio, onProgress })` waits for critical groups, starts deferred groups in the background, and caps concurrent loaders.
- `npm run check` is the local handoff gate and should run unit tests, Vite build, production config validation with explicit sample env, and `docs:system-design`.
- `npm run check:production` remains the strict production-env validator and must not silently inject sample secrets or origins.
- `vite.config.js` manually chunks React, Socket.IO client code, and Pixi into `react-vendor`, `realtime-vendor`, and `pixi-vendor` respectively. Do not add a catch-all `vendor` chunk unless the build is checked for circular chunk warnings.

#### 3. Contracts
- Critical images include character portraits and home entry/background imagery needed for the first home render.
- Critical audio includes common board/UI effect sounds that are decoded for immediate interaction feedback.
- Deferred media includes shop/effect previews, stone decoration images, result/match sounds, BGM tracks, character skill voices, and system voices.
- Preload progress represents critical preload completion; deferred assets must not keep users trapped on the preload screen.
- Preload failures remain non-blocking for both critical and deferred groups.
- The grouped asset API must keep `images` and `audio` flattened arrays for compatibility with tests and existing callers.
- Production entry JS should stay split from heavy runtime libraries. The Pixi chunk may be larger than Vite's default 500 KB warning because it is lazy-loaded and prewarmed only for skill-enabled boards; the configured warning limit should remain a documented exception, not a way to hide a growing entry chunk.

#### 4. Validation & Error Matrix
- Missing grouped fields but legacy `images`/`audio` provided -> treat all legacy assets as critical.
- Empty critical groups -> call `onProgress(1)` and still start deferred work if present.
- Invalid or zero concurrency -> fall back to one worker.
- Loader rejection -> swallow the failure and continue remaining preload work.
- Production env missing real secrets/origins -> `npm run check:production` fails; `npm run check` may use explicit sample env for local validation.

#### 5. Good/Base/Bad Cases
- Good: Login reaches home after current portraits, home art, and UI/board SFX are ready while BGM and voice assets keep loading in the background.
- Good: React and Socket.IO runtime code are cached in stable vendor chunks, while Pixi stays in a lazy `pixi-vendor` chunk outside the initial room entry path.
- Base: Older tests or helpers that pass only `images` and `audio` still work.
- Bad: Awaiting every configured music and voice file before home entry.
- Bad: Making `check:production` pass by mutating production defaults instead of keeping sample env limited to the aggregate `check` command.

#### 6. Tests Required
- Asset grouping tests must assert representative first-screen assets are critical and representative music/voice/shop assets are deferred.
- Preload behavior tests must assert critical completion resolves the awaited promise and deferred work is concurrency-limited.
- Script contract tests must assert `npm run check` includes tests, build, production config validation, docs generation, and explicit sample production env.
- Vite build config tests must assert manual chunk grouping, the absence of a catch-all vendor chunk, and the intentional Pixi warning limit.
- Run `npm run check` before handoff when changing preload or verification commands.

#### 7. Wrong vs Correct

Wrong:

```js
await Promise.all([...images, ...audio].map(preloadEverything));
```

This blocks the home screen on optional music, voice, shop, and effect-preview assets.

Correct:

```js
await preloadLoginAssets(loginPreloadAssets({ characters }), { onProgress });
```

`preloadLoginAssets` waits for critical groups and starts deferred groups with a concurrency cap.

### Board point and interaction feedback performance contracts

#### 1. Scope / Trigger
- Trigger: any change to `src/room/Board.jsx` point rendering, point event handling, scoring/neutral point interactions, or `src/app/InteractionFeedback.jsx` unavailable feedback animation.
- These paths sit on high-frequency user interactions; they must reduce unnecessary renders and avoid layout-thrashing reads without freezing current event behavior.

#### 2. Signatures
- `arePointButtonPropsEqual(previous, next)` is the point-level React memo comparator for board intersections.
- Point buttons receive stable refs such as `handlersRef` and `pointerTypeRef`; visible state and capability booleans remain ordinary props.
- `triggerUnavailableShake(target)` restarts `ui-unavailable-shake` without reading layout metrics such as `offsetWidth`.

#### 3. Contracts
- Point memo comparison may ignore event function identity only when the rendered button reads the latest handlers through a stable ref object.
- Comparator inputs must include visible point state, board size, marker/decoration classes, move number state, scoring mark state, and interaction capability flags such as `hasScoringPoint`.
- Do not rely on `game` object identity inside a point button; derive per-point display props in `Board` and pass only the point's slice.
- Unavailable feedback may remove and re-add the shake class on the next animation frame; it must not force a synchronous layout read to restart CSS animation.
- Neutral point marking remains phase-gated by an explicit capability prop such as `canMarkNeutral`.

#### 4. Validation & Error Matrix
- Handler function changes but the same stable handler ref is passed -> point button may stay memoized and must still call the latest handler from `handlersRef.current`.
- Scoring handler availability changes -> point button must re-render because pointer/click semantics change.
- Point stone, mark, decoration, move number, preview class, or confirmation class changes -> point button must re-render.
- Browser lacks `requestAnimationFrame` -> unavailable feedback may fall back to a timer instead of forcing layout.

#### 5. Good/Base/Bad Cases
- Good: A timer tick or parent handler recreation does not re-render all board intersections, while a new click handler stored in `handlersRef.current` is still used.
- Base: A changed point object for one intersection re-renders that point and preserves other memoized points.
- Bad: Ignoring handler identity while the point button directly closes over stale `onPoint`, `onScoringPoint`, or `onNeutral` props.
- Bad: Restarting disabled feedback by reading `target.offsetWidth`.

#### 6. Tests Required
- Board comparator tests must assert handler-ref content changes stay memoized and visible/capability changes re-render.
- Interaction feedback tests must assert source behavior does not use `offsetWidth` and uses an async restart mechanism such as `requestAnimationFrame`.
- Run targeted tests for `src/room/Board.test.js` and `src/app/InteractionFeedback.test.js`, then run the project `check` gate before handoff.

#### 7. Wrong vs Correct

Wrong:

```jsx
const MemoPointButton = memo(PointButton, () => true);

function PointButton({ onPoint, point }) {
  return <button onClick={() => onPoint(point)} />;
}
```

This can keep a stale click closure after the parent changes game interaction behavior.

Correct:

```jsx
const handlersRef = useRef({ onPoint });
handlersRef.current = { onPoint };

function PointButton({ handlersRef, point }) {
  return <button onClick={() => handlersRef.current.onPoint(point)} />;
}
```

The memoized button avoids handler-identity churn while still calling the latest handler.

### CSS Contract Ownership

When a visual contract is asserted by static CSS tests, keep one source test responsible for exact sizing values and let broader theme tests assert presence/scope instead of duplicating the same literals.

Required assertion points:

- Component or feature tests that read the source CSS file should own exact layout values such as `grid-template-columns`, fixed column widths, and minimum stat-panel widths.
- Broad theme/HUD tests should assert that the relevant scoped rule, polish layer, and semantic safety rules still exist, but should avoid keeping a second stale copy of feature-specific sizing values.
- If a broad test must inspect a scoped rule, extract the specific selector block first and assert only the values that belong to that test's ownership boundary.
- When changing a visual contract, update the source CSS, the owning feature test, and any broad guard that intentionally references the same selector.

Wrong:

```js
expect(themesCss).toContain("grid-template-columns: 76px minmax(120px, 1fr) 94px !important");
```

This duplicates a component layout contract in a broad HUD test, so the test can drift when the feature test and source CSS move together.

Correct:

```js
const plaqueBlock = cssBlockForSelector(themesCss, ".home-player-plaque.tactical-id-card");

expect(plaqueBlock).toContain("grid-template-columns: 76px minmax(116px, 1fr) minmax(164px, max-content) !important");
expect(themesCss).toContain(".home-player-row.tactical-id-row::before");
```

The feature-level test still owns the exact layout, while the broader guard confirms the themed selector and paperclip polish remain present.

### CSS Domain Entry Ownership

Large top-level CSS files should become import-only domain entries before they accumulate unrelated feature rules. `src/styles/base.css` owns shared foundation import order and delegates concrete rules to `src/styles/base/`; `src/styles/room.css` owns live-room import order and delegates concrete rules to `src/styles/room/`; `src/styles/room-terminal.css` owns the Startorch battlefield terminal skin import order and delegates concrete rules to `src/styles/room-terminal/`; `src/styles/modals.css` owns shared modal import order and delegates concrete rules to `src/styles/modals/`; `src/styles/mobile-modals.css` owns mobile modal safety order and delegates concrete rules to `src/styles/mobile-modals/`; `src/styles/commerce-settings.css` owns the commerce/social/warehouse import order and delegates concrete rules to `src/styles/commerce/`; `src/styles/commerce/shop-settings.css` owns the shared shop/settings/mobile commerce sub-entry order and delegates concrete rules to `src/styles/commerce/shop-settings/`; `src/styles/responsive.css` owns shared breakpoint order and delegates concrete rules to `src/styles/responsive/`; `src/styles/mobile-room.css` owns shared mobile battle-room order and delegates concrete rules to `src/styles/mobile-room/`; `src/styles/hud-components.css` owns shared HUD compatibility order and delegates concrete rules to `src/styles/hud-components/`; `src/styles/themes/bright-school/base.css` owns early Bright School foundation order and delegates concrete rules to `src/styles/themes/bright-school/base/`; `src/styles/themes/bright-school/contrast-purge.css` owns early Bright School emergency readability reset order and delegates concrete rules to `src/styles/themes/bright-school/contrast-purge/`; `src/styles/themes/bright-school/home.css` owns Bright School lobby import order and delegates concrete rules to `src/styles/themes/bright-school/home/`; `src/styles/themes/bright-school/commerce.css` does the same for Bright School commerce overlays through `src/styles/themes/bright-school/commerce/`; `src/styles/themes/bright-school/mobile.css` owns Bright School portrait mobile order and delegates concrete rules to `src/styles/themes/bright-school/mobile/`; `src/styles/themes/bright-school/mobile/room.css` owns Bright School portrait battle-room order and delegates concrete rules to `src/styles/themes/bright-school/mobile/room/`; `src/styles/themes/bright-school/component-repairs.css` owns late Bright School component repair order and delegates concrete rules to `src/styles/themes/bright-school/component-repairs/`; `src/styles/themes/bright-school/quality-base.css` owns Bright School audit/refinement order and delegates concrete rules to `src/styles/themes/bright-school/quality-base/`; `src/styles/themes/bright-school/firewall.css` owns anti-HUD bleed reset order and delegates concrete rules to `src/styles/themes/bright-school/firewall/`; `src/styles/mobile-adaptive.css` owns final mobile safety-layer order and delegates concrete rules to `src/styles/mobile-adaptive/`; `src/styles/mobile-adaptive/bright-school-overrides.css` owns the final Bright School mobile guard order and delegates concrete rules to `src/styles/mobile-adaptive/bright-school-overrides/`.

Required assertion points:

- `src/styles/styleContract.test.js` owns the allowed nested style directories and the `base.css` / `room.css` / `room-terminal.css` / `modals.css` / `mobile-modals.css` / `commerce-settings.css` / `commerce/shop-settings.css` / `responsive.css` / `mobile-room.css` / `hud-components.css` import order.
- `src/styles/styleContract.test.js` also owns the `mobile-adaptive.css` import order and the nested `bright-school-overrides.css` import order because these entries are the final safety layers after theme imports.
- `src/styles/themeContract.test.js` owns the Bright School base, contrast-purge, home, commerce, mobile, mobile room, component repair, quality-base, and firewall import order.
- Feature tests that need concrete CSS, such as gacha modal coverage, should read the CSS import tree instead of asserting that rules live directly in the entry file.
- New top-level CSS domains should start as import-only entries with an explicit directory and a style contract test update.

### Native number input spinner contract

When using numeric form controls, keep the markup as `type="number"` so browser validation, min/max constraints, and mobile numeric keyboards still work, but hide the native `+1/-1` spinner UI in shared base CSS.

Required assertion points:

- `src/styles/base.css` should own the global spinner reset, not per-component CSS.
- Keep `input[type="number"] { appearance: textfield; -moz-appearance: textfield; }` for standard/Firefox behavior.
- Keep both `input[type="number"]::-webkit-outer-spin-button` and `input[type="number"]::-webkit-inner-spin-button` with `-webkit-appearance: none` for Chromium/WebKit.
- Static coverage belongs in `src/styles/styleContract.test.js` so style entry refactors cannot drop the contract.

Wrong:

```jsx
<input type="text" inputMode="numeric" value={quantity} />
```

This loses native numeric validation and min/max semantics just to remove the spinner.

Correct:

```css
input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
```

### Mobile battle layout contracts

When changing the mobile room or battle layout, update static layout tests in `src/room/RoomScreen.test.js` to lock the CSS contracts that keep the board playable.

Required assertion points:

- The mobile room shell stays fixed to `100dvh` with `overflow: hidden`; do not rely on page scrolling for normal play.
- Player strips use a bounded custom property such as `--mobile-room-player-strip-height` and grid rows reference that property, so opponent/self cards cannot grow into the board.
- Portrait player strips should keep the avatar column fixed and large enough for readable art, give identity/capture metadata the flexible middle column, and keep the timer/skill column bounded with visible row gaps; shared mobile CSS, `mobile-adaptive.css`, and Bright School overrides must use the same player-info column contract and Bright School cards must remain flat without heavy card shadows. Mobile player metadata should stay on one row with the larger username on the left and rank/rating tags on the right; rank/rating pills must vertically center their text with selector-specific CSS. The small color dot may be hidden because portrait color styling already carries side identity, and Bright School black portrait frames must use `#2b2b2b`.
- Mobile replay step indicators should center the numeric move text horizontally. Hide decorative replay icons in the compact replay counter if they offset the `current/max` text.
- Player info keeps the portrait/result badge column present across both rows (`"portrait meta time"` / `"portrait captures skill"`) and hides overflow inside the strip instead of spilling over the board.
- The board stage keeps `aspect-ratio: 1`, is centered in the board viewport, and sizes from `--mobile-room-board-size`.
- Board stone visual jitter is mode-aware. Spark mode stones may use up to 1px deterministic offset, but standard 19-line stones must use a maximum 0.5px offset on both desktop and mobile; the logic should live in the board offset helper so all responsive layouts share the same values.
- The bottom dock has a capped panel height; operation hints inside `#mobile-room-panel-actions` must be bounded so action controls remain reachable on 375px/393px portrait screens.
- Collapsed mobile chat badges should count only player-authored chat messages (`type === "chat"`), not system notices or skill/disconnect messages.
- Mobile leaderboard rows should be compact cards rather than cramped tables. Use rank/avatar/player/score lanes, left-align the username/rank block, show rating as the primary right-side value, and use a right metrics lane with explicit win/loss/draw chips above a small win-rate stat. Give the metrics lane its own `record` and `rate` grid rows instead of stacking both elements in the same grid area, and make the pinned current-user row follow the same rhythm instead of becoming a large separate panel. When the mobile heading is hidden, the table grid must use `grid-template-rows: minmax(0, 1fr) auto` so the pinned row is auto-height; do not keep the desktop `minmax(220px, 1fr)` row because it creates an empty "我的排名" panel.
- Mobile replay lists are ordinary card flows, not leaderboard tables with a pinned current-user footer. When the mobile replay heading is hidden, the replay table must use `grid-auto-rows: auto`, `align-content: start`, and no explicit two-track `grid-template-rows`, so the first replay cards cannot overlap.
- Mobile menu buttons with short Chinese labels should keep icon and text on one line. Use a fixed icon column plus a `max-content` label column, and pair `white-space: nowrap` with `word-break: keep-all`; do not use a compressible `minmax(0, 1fr)` text column for two-character labels such as 留言, 设置, or 退出.
- Mobile nested record dialogs, including the house character-record dialog, must be clamped to the viewport and scroll internally. Character record rows should use compact avatar/name/record/rate columns, and the record text must stay on one line with `white-space: nowrap`, `word-break: keep-all`, and a non-compressing `max-content` record column so win/loss/draw text cannot wrap mid-stat.
- Mobile player-info explanations should support touch as well as desktop hover. Removal, overclock, and skill labels should open a tap-position tooltip on mobile/coarse pointers; the tooltip must use viewport-contained fixed width with normal wrapping and emergency word breaks, clamp within the viewport, flip below taps near the top edge, and cap height with internal scrolling so explanation text cannot overflow off-screen.
- Theme overrides, especially Bright School mobile rules with `!important`, must mirror the shared mobile room contract rather than redefining a conflicting layout.
- Battle-room tags and buttons should stay visually flat on mobile. Header tags, timer chips, capture chips, player labels, menu buttons, dock tabs, action buttons, replay buttons, and chat controls should use border-only treatment without `box-shadow`, `filter: drop-shadow(...)`, or `text-shadow`. Bright School control-shadow cleanup must use selectors specific enough to beat older `.app-shell... .captures span` / `.skill-chip` `!important` rules; a low-specificity `:where(...)` reset alone is not sufficient. Do not use a generic room `button` reset that catches `.point`; board point buttons and stone/current-move visuals are gameplay affordances and must stay separately controlled by board styles.
- Phase-aware `decision-bar` controls are not the same layout as the normal action grid. Mobile dead-stone confirmation must keep a compact copy column and a two-button `decision-actions` grid; shared mobile CSS, `mobile-adaptive.css`, and Bright School mobile overrides must all preserve this special layout so confirm/reset buttons do not stack awkwardly inside 375px/393px portrait docks.
- Scoring board marks carry semantic color and shape separately. `territory-mark.black/white` draws owner-colored crosses for black/white empty territory, while `dead-mark.black/white` draws owner-colored circles for white/black dead stones; dead-stone marks must not inherit the territory cross pseudo-elements.

Wrong:

```css
.mobile-room-screen .mobile-room-viewport {
  grid-template-rows: auto minmax(0, 1fr) auto auto;
}
```

This lets long player strips or action hints steal board space unpredictably.

Correct:

```css
.mobile-room-screen {
  --mobile-room-player-strip-height: clamp(58px, 8.6dvh, 68px);
}

.mobile-room-screen .mobile-room-viewport {
  grid-template-rows:
    minmax(0, var(--mobile-room-player-strip-height))
    minmax(0, 1fr)
    minmax(0, var(--mobile-room-player-strip-height))
    auto;
}

.mobile-room-screen .board-stage {
  width: var(--mobile-room-board-size);
  aspect-ratio: 1;
}
```

Before finishing mobile battle UI work, run:

```bash
npm test -- src/room/RoomScreen.test.js src/room/ActionBar.test.js
```

For broader confidence after shared CSS changes, also run `npm test` and `npm run build`.

### Room control layout contracts

When changing desktop room headers, replay bars, or player side panels, update static layout tests in `src/room/RoomScreen.test.js` to lock shared room UI contracts.

Required assertion points:

- Desktop room header controls should use a grid or equivalent right-aligned layout so message/settings/move/coordinate buttons stay grouped against the room-exit action instead of drifting toward the center.
- Room exit actions should use the shared light-blue treatment across desktop and mobile; theme layers that reset button backgrounds must mirror that treatment.
- Do not duplicate room exit actions beside desktop chat when the header or replay/action bar already provides an exit path.
- Replay step counters should center their `current/max` text and any icon content.
- Desktop room floating panels, including chat popovers, skill detail panels, hover/click stat tooltips, and room member action popovers, must use the shared `--room-floating-z` contract instead of fixed cross-surface z-index values. Opening, hovering, focusing, or clicking one of these panels should bring that surface to the front.
- Keep player cards and skill wrappers overflow-visible so dynamically raised skill panels can escape the side panel without clipping.
- Room member action popovers must keep their fixed-position anchor variables and use `--room-floating-z` in both base CSS and Bright School theme overrides.
- Capture/removal/overclock chips should share stable heights so skill-only counters do not look shorter or taller than captures.

### Modal and Tab Visual State Contracts

When adding or restyling modal tabs, including game-mode tabs in resume, leaderboard, replay, or watch-list surfaces, keep selected state visually explicit in both base CSS and the active theme override.

Required assertion points:

- Tab buttons with `.active`, `aria-selected="true"`, or equivalent selected state must have a distinct background color, not only a border or text-color change.
- Theme layers that globally reset `button` backgrounds, especially Bright School rules with `!important`, must include matching selected-tab overrides after the reset.
- Mobile modal fixes that must survive Bright School and shared responsive rules should also be mirrored in the final `mobile-adaptive.css` safety layer, because it is imported after theme files.
- Moving a modal action between header/body sections should be covered by a static markup order assertion when the order matters to the user workflow.
- Match-mode picker cancel actions must keep explicit vertical spacing from the mode option group in base CSS and the final mobile safety layer, so the escape action never visually attaches to the last mode option on desktop or mobile.
- Home image entries should not expose rules or matchmaking status through hover/focus text popups. Keep those details in click-open modals or mode pickers so desktop hover and mobile touch behavior stay consistent.

### Modal Close Button Contracts

Window close buttons should share one relative size and top-right placement contract across desktop, mobile, base CSS, and Bright School overrides.

Required assertion points:

- Modal close buttons use `--modal-close-size` with a 44px fallback and `--modal-close-inset` with a 12px fallback for the button box and top/right offset.
- `.modal-backdrop .close-button` and `.nested-modal-backdrop .close-button` are absolutely positioned at the same top-right inset with `z-index: 20`.
- Watch-list and other toolbar close buttons may remain in the header action group when sibling controls such as refresh buttons exist; they must be the rightmost same-size close target and must not overlay sibling controls.
- Resume header close buttons may remain grouped with the coin capsule so the capsule can sit immediately to their left, but the `.resume-header-actions` group must be anchored to the header's top-right corner on desktop and mobile instead of flowing beside the title. The title should reserve right-side space so the fixed action group cannot overlap it. The close button must keep the same close-button size and touch target, and the coin capsule should use the same `--modal-close-size` minimum height.
- Mobile and Bright School overrides must reference the same variables instead of hard-coding separate `10px`, `36px`, or other one-off close-button values.

Wrong:

```css
.watch-list-modal .inline-close {
  position: absolute;
  right: 12px;
}
```

This can cover sibling header controls such as refresh buttons instead of reserving a real layout slot.

Correct:

```css
.watch-list-actions .inline-close {
  position: static;
  flex: 0 0 auto;
  width: var(--modal-close-size, 44px);
  height: var(--modal-close-size, 44px);
}
```

### Home Layout Contracts

Desktop home footer text is part of the HUD, not the scrollable stage content.

Required assertion points:

- Desktop `.home-footer-strip` must remain fixed to the viewport bottom-right in the final theme safety layer, because the home screen itself can scroll vertically on shorter desktop windows.
- The desktop final-layer rule should use the same `clamp(12px, 2vw, 24px)` right inset and `clamp(8px, 1.4vw, 16px)` bottom inset as `home-terminal.css`.
- Mobile may keep `.home-footer-strip` in normal document flow, but the static mobile override must stay inside the `max-width: 768px` mobile safety layer.
- The desktop footer should keep `pointer-events: none` so it cannot intercept clicks near the lower-right lobby content.

Wrong:

```css
.home-footer-strip {
  position: static;
}
```

This makes the desktop copyright strip travel with the scrollable home content.

Correct:

```css
@media (min-width: 769px) {
  .home-screen.home-terminal-screen > .home-footer-strip {
    position: fixed !important;
    bottom: clamp(8px, 1.4vw, 16px) !important;
  }
}
```

### Mobile Profile Record Layout Contracts

When displaying record summaries inside compact mobile profile cards, split the total game count from the win/loss/draw count so both pieces remain readable.

Required assertion points:

- Profile record cards should render separate elements for total games and win/loss/draw counts, with a desktop separator that can be hidden on mobile.
- Nested character-record rows should use the same two-part structure for the record column.
- Mobile Bright School rules and the final `mobile-adaptive.css` guard should set the record wrapper to a two-row grid, hide the separator, and keep each line `white-space: nowrap` with `word-break: keep-all`.
- Card-level selectors such as `.profile-resume-stats > span` must target direct stat cards only; do not use `.profile-resume-stats span` when nested record-line spans exist.
- Recent rank result markers must render below the record/rating/rank stat row, not inside one stat card. Keep marker chips wrapping from old to new so desktop and mobile can show all current-window results without clipping.
- In resume/profile modals, `.profile-grid.top-stats-bar` is the outer wrapper for stat cards plus recent-result markers and must stay `grid-template-columns: 1fr` in base, mobile, Bright School mobile, and final `mobile-adaptive.css` layers. The inner `.profile-resume-stats` grid must keep all three stat cards on one row with `repeat(3, minmax(0, 1fr))`; on mobile, split only the record card value into total games and win/loss/draw lines.
- In the `履历` modal, character records for the selected mode are embedded below the recent-result marker row as `.resume-character-records`. Do not reopen the old nested `CharacterRecordsDialog` from the stat card; keep the stat cards as summary data and the character list as an internally scrolling section.

Wrong:

```jsx
<span>{user.record}</span>
```

This can collapse `29局 · 15胜10负4和` into one clipped line on narrow mobile cards.

Correct:

```jsx
<b className="profile-record-lines">
  <span className="profile-record-total">29局</span>
  <span className="profile-record-separator"> · </span>
  <span className="profile-record-breakdown">15胜10负4和</span>
</b>
```

### Bright School Home Responsive Contracts

The Bright School home layout has three distinct responsive modes. Keep them explicit so medium desktop windows do not inherit the large scrapbook offsets.

Required assertion points:

- Base terminal layout must not force a fixed minimum viewport width; `.home-screen` and `.home-grid-featured` should keep `min-width: 0`.
- Large desktop can use the decorative scrapbook composition, but 701px-1180px widths and low-height desktop windows must be protected by the final `mobile-adaptive.css` guard.
- The narrow desktop guard should switch the home stage to named CSS grid areas (`player`, `manual`, `utility`, `match`) and reset player/manual/match/utility regions to `position: static`.
- Below the narrower fallback threshold, use a single-column grid so utility cards and the manual entry scroll vertically instead of overlapping.
- Home plaque stats must be in a shrinkable grid column with `min-width: 0`; avoid fixed pixel stats columns on mobile because long usernames need the remaining space.

Wrong:

```css
.home-screen {
  min-width: 1180px;
}
```

This preserves a desktop artboard inside a small browser and causes player plaques, buttons, and manual art to overlap.

Correct:

```css
.home-screen,
.home-grid-featured {
  min-width: 0;
}

@media (min-width: 701px) and (max-width: 1180px) {
  .home-stage {
    grid-template-areas:
      "player manual"
      "utility manual"
      "match match";
  }
}
```

### Character Item Effect Badge Contracts

When a character-specific item effect is active in `user.itemEffects`, the house manual character card should render the item's icon as a small badge on the corresponding character card across desktop and mobile.

Required assertion points:

- Derive card badges from `itemEffects` in a shared helper, rather than duplicating checks in JSX.
- Badge metadata must include the real item icon path, an accessible `alt`, and a `title` matching the item effect.
- Badge CSS must use selectors specific enough to beat generic `.character-card img` portrait sizing and Bright School mobile portrait overrides.
- Mobile badge dimensions should remain compact and stable; add assertions for the mobile selector and size when changing character-card layout.

Wrong:

```css
.character-item-effect-icon {
  width: 24px;
}
```

This can be overridden by `.character-card img` and stretch the badge to portrait size.

Correct:

```css
.house-modal .character-card.portrait-card .character-item-effect-icon {
  width: 24px;
  height: 24px;
}
```

### Skill targeting contracts

Keep visual target preview separate from board-click release confirmation. No-target active skills such as Baconbits `random-blast` must keep `canPreviewSkillTarget` false so the board does not show a fake target marker, but `skillUsesBoardConfirmation` must still let a valid board point confirm and send the skill action. Do not reuse the preview helper as the only click-eligibility gate for skills.

Before finishing skill targeting changes, run:

```bash
npm test -- src/shared/gameSkills.test.js src/room/actions/useRoomPointActions.test.js src/room/RoomScreen.test.js src/shared/boardView.test.js
```

---

## Code Review Checklist

<!-- What reviewers should check -->

(To be filled by the team)
