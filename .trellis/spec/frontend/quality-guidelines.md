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
- `preloadLoginAssets(assets, { concurrency, loadImage, loadAudio, loadEffectAudio, onProgress, taskTimeoutMs })` waits for critical groups, starts deferred groups in the background, caps concurrent loaders, and bounds each loader with a timeout.
- `useStartupPreload({ token, ... })` must not receive a transient Socket.IO `socket` instance or include one in its dependency list.
- `connectGameSocket({ socketBase, token, ... })` creates the game Socket.IO client with explicit reconnect settings: `reconnection: true`, `reconnectionAttempts: Infinity`, `reconnectionDelay: 500`, `reconnectionDelayMax: 3000`, and `timeout: 6000`.
- `npm run check` is the local handoff gate and should run unit tests, Vite build, production config validation with explicit sample env, and `docs:system-design`.
- `npm run check:production` remains the strict production-env validator and must not silently inject sample secrets or origins.
- `vite.config.js` manually chunks React, Socket.IO client code, and Pixi into `react-vendor`, `realtime-vendor`, and `pixi-vendor` respectively. Do not add a catch-all `vendor` chunk unless the build is checked for circular chunk warnings.
- `vite.config.js` configures the dev `/socket.io` websocket proxy with an error handler that keeps expected backend-watch restart disconnects quiet while still warning on unexpected proxy errors.

#### 3. Contracts
- Frontend API calls through `api()` must have a bounded request timeout. Startup begins on the `preloading` view before `/api/auth/refresh` completes, so a hung auth refresh or catalog/settings request must reject and enter existing recovery flow instead of leaving the app on the preload screen forever.
- Critical images include character portraits and home entry/background imagery needed for the first home render.
- Critical audio includes common board/UI effect sounds that are decoded for immediate interaction feedback.
- Deferred media includes shop/effect previews, stone decoration images, result/match sounds, BGM tracks, character skill voices, and system voices.
- Preload progress represents critical preload completion; deferred assets must not keep users trapped on the preload screen.
- Preload failures and hung loaders remain non-blocking for both critical and deferred groups; timed-out tasks count as completed preload work so startup can recover after reconnect or server restart.
- Startup preload must be independent from transient socket object identity. Token/session cleanup can close sockets through the socket lifecycle hook after state changes; preloading should continue once for the confirmed token instead of restarting when a mobile WebSocket reconnects or a socket instance changes.
- The game socket should fail its initial connection attempt quickly enough for mobile recovery feedback and Socket.IO retry logic to take over. Do not rely on Socket.IO's default long handshake timeout for this app shell path.
- The grouped asset API must keep `images` and `audio` flattened arrays for compatibility with tests and existing callers.
- Production entry JS should stay split from heavy runtime libraries. The Pixi chunk may be larger than Vite's default 500 KB warning because it is lazy-loaded and prewarmed only for skill-enabled boards; the configured warning limit should remain a documented exception, not a way to hide a growing entry chunk.
- Dev proxy `ECONNRESET` and `ECONNREFUSED` errors from `/socket.io` are expected while `dev:server` restarts; do not remove the proxy error handler unless the replacement keeps those disconnects from spamming the client terminal.

#### 4. Validation & Error Matrix
- API request never settles -> abort after the request timeout and reject with a user-readable timeout error.
- Missing grouped fields but legacy `images`/`audio` provided -> treat all legacy assets as critical.
- Empty critical groups -> call `onProgress(1)` and still start deferred work if present.
- Invalid or zero concurrency -> fall back to one worker.
- Loader rejection -> swallow the failure and continue remaining preload work.
- Loader never settles -> treat it like a non-blocking preload failure after the per-task timeout and continue remaining preload work.
- Socket instance changes while token preload is in progress -> do not cancel or restart `useStartupPreload`.
- Mobile WebSocket handshake stalls -> Socket.IO connection attempt times out after 6 seconds and retries with the configured reconnect delays.
- Production env missing real secrets/origins -> `npm run check:production` fails; `npm run check` may use explicit sample env for local validation.

#### 5. Good/Base/Bad Cases
- Good: Login reaches home after current portraits, home art, and UI/board SFX are ready while BGM and voice assets keep loading in the background.
- Good: A mobile client with a flaky `/socket.io` WebSocket keeps the asset preload flow stable while Socket.IO retries the realtime connection.
- Good: React and Socket.IO runtime code are cached in stable vendor chunks, while Pixi stays in a lazy `pixi-vendor` chunk outside the initial room entry path.
- Base: Older tests or helpers that pass only `images` and `audio` still work.
- Bad: Awaiting every configured music and voice file before home entry.
- Bad: Making `check:production` pass by mutating production defaults instead of keeping sample env limited to the aggregate `check` command.

#### 6. Tests Required
- API client tests must assert a hung request is aborted and rejected instead of staying pending forever.
- Asset grouping tests must assert representative first-screen assets are critical and representative music/voice/shop assets are deferred.
- Preload behavior tests must assert critical completion resolves the awaited promise and deferred work is concurrency-limited.
- Preload behavior tests must assert a hung critical loader cannot keep login preload pending forever.
- App wiring tests must assert startup preload is not passed a `socket` prop.
- Game socket tests must assert the mobile recovery reconnect and 6-second handshake timeout options.
- Script contract tests must assert `npm run check` includes tests, build, production config validation, docs generation, and explicit sample production env.
- Vite build config tests must assert manual chunk grouping, the absence of a catch-all vendor chunk, the intentional Pixi warning limit, and quiet handling for expected dev websocket proxy disconnects.
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

Wrong:

```jsx
useStartupPreload({ token, socket });
```

This lets a transient realtime connection object restart login asset preload on mobile reconnects.

Correct:

```jsx
useStartupPreload({ token });
connectGameSocket({ socketBase, token });
```

The socket lifecycle hook owns realtime reconnects while startup preload remains tied to the confirmed token.

### Board point and interaction feedback performance contracts

#### 1. Scope / Trigger
- Trigger: any change to `src/room/Board.jsx` point rendering, point event handling, scoring/neutral point interactions, or `src/app/InteractionFeedback.jsx` unavailable feedback animation.
- These paths sit on high-frequency user interactions; they must reduce unnecessary renders and avoid layout-thrashing reads without freezing current event behavior.

#### 2. Signatures
- `arePointButtonPropsEqual(previous, next)` is the point-level React memo comparator for board intersections.
- Point buttons receive stable refs such as `handlersRef` and `pointerTypeRef`; visible state and capability booleans remain ordinary props.
- `triggerUnavailableShake(target)` restarts `ui-unavailable-shake` without reading layout metrics such as `offsetWidth`.
- `lastMarkedAction(history)` is the canonical source for the board's latest placed-stone marker.

#### 3. Contracts
- Point memo comparison may ignore event function identity only when the rendered button reads the latest handlers through a stable ref object.
- Comparator inputs must include visible point state, board size, marker/decoration classes, move number state, scoring mark state, and interaction capability flags such as `hasScoringPoint`.
- Do not rely on `game` object identity inside a point button; derive per-point display props in `Board` and pass only the point's slice.
- Unavailable feedback may remove and re-add the shake class on the next animation frame; it must not force a synchronous layout read to restart CSS animation.
- Neutral point marking remains phase-gated by an explicit capability prop such as `canMarkNeutral`.
- History entries for skills that place a real stone must be eligible for the latest placed-stone marker. Keep Chisa `liberty-purge` covered through `lastMarkedAction(history)` instead of treating only ordinary moves as markable placements.

#### 4. Validation & Error Matrix
- Handler function changes but the same stable handler ref is passed -> point button may stay memoized and must still call the latest handler from `handlersRef.current`.
- Scoring handler availability changes -> point button must re-render because pointer/click semantics change.
- Point stone, mark, decoration, move number, preview class, or confirmation class changes -> point button must re-render.
- Browser lacks `requestAnimationFrame` -> unavailable feedback may fall back to a timer instead of forcing layout.
- A skill history entry with `effectType: "liberty-purge"` and `placedId`/`id` after an ordinary move -> latest marker must move to the skill placement point.

#### 5. Good/Base/Bad Cases
- Good: A timer tick or parent handler recreation does not re-render all board intersections, while a new click handler stored in `handlersRef.current` is still used.
- Base: A changed point object for one intersection re-renders that point and preserves other memoized points.
- Bad: Ignoring handler identity while the point button directly closes over stale `onPoint`, `onScoringPoint`, or `onNeutral` props.
- Bad: Restarting disabled feedback by reading `target.offsetWidth`.

#### 6. Tests Required
- Board comparator tests must assert handler-ref content changes stay memoized and visible/capability changes re-render.
- Board view tests must assert Chisa `liberty-purge` placement becomes the latest marked action after an ordinary move.
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
- Broad theme/HUD tests should assert that the relevant scoped rule, polish layer, and semantic safety rules still exist, but should avoid keeping a second stale copy of feature-specific sizing values. Bright School mobile domain tests own both `mobile.css` and `mobile/home-shell.css` import order so sub-entry splits remain stable.
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

Large top-level CSS files should become import-only domain entries before they accumulate unrelated feature rules. `src/styles/base.css` owns shared foundation import order and delegates concrete rules to `src/styles/base/`; `src/styles/admin.css` owns admin console import order and delegates concrete rules to `src/styles/admin/`; `src/styles/lobby.css` owns shared lobby, house, profile, match, and watch-list import order and delegates concrete rules to `src/styles/lobby/`; `src/styles/room.css` owns live-room import order and delegates concrete rules to `src/styles/room/`; `src/styles/room/players-timers-skills.css` owns the player/timer/skill sub-entry order and delegates side layout, player card, capture tooltip, timer, skill chip, mobile tap tooltip, and color badge rules to `src/styles/room/players-timers-skills/`, while `src/styles/room/board.css` owns the shared board sub-entry order and delegates concrete board rules to `src/styles/room/board/`; `src/styles/room-terminal.css` owns the Startorch battlefield terminal skin import order and delegates concrete rules to `src/styles/room-terminal/`; `src/styles/modals.css` owns shared modal import order and delegates concrete rules to `src/styles/modals/`, while `src/styles/modals/replay-mode-resume.css` owns the replay/mode/resume/achievement/personalization sub-entry order and delegates concrete rules to `src/styles/modals/replay-mode-resume/`; `src/styles/mobile-modals.css` owns mobile modal safety order and delegates concrete rules to `src/styles/mobile-modals/`; `src/styles/commerce-settings.css` owns the commerce/social/warehouse import order and delegates concrete rules to `src/styles/commerce/`; `src/styles/commerce/shop-settings.css` owns the shared shop/settings/mobile commerce sub-entry order and delegates concrete rules to `src/styles/commerce/shop-settings/`; `src/styles/responsive.css` owns shared breakpoint order and delegates concrete rules to `src/styles/responsive/`; `src/styles/mobile-home.css` owns shared mobile lobby order and delegates concrete rules to `src/styles/mobile-home/`; `src/styles/mobile-room.css` owns shared mobile battle-room order and delegates concrete rules to `src/styles/mobile-room/`; `src/styles/hud-components.css` owns shared HUD compatibility order and delegates concrete rules to `src/styles/hud-components/`; `src/styles/themes/bright-school/base.css` owns early Bright School foundation order and delegates concrete rules to `src/styles/themes/bright-school/base/`; `src/styles/themes/bright-school/contrast-purge.css` owns early Bright School emergency readability reset order and delegates concrete rules to `src/styles/themes/bright-school/contrast-purge/`; `src/styles/themes/bright-school/radical-purge.css` owns early Bright School emergency cleanup order for home controls, handbook/profile surfaces, character detail, commerce/social lists, and room action controls and delegates concrete rules to `src/styles/themes/bright-school/radical-purge/`; `src/styles/themes/bright-school/specificity-overrides.css` owns early Bright School high-specificity anti-bleed order for global reset, panel shells, forms, settings panels, character details, buttons, scrollbars, and addendum notes and delegates concrete rules to `src/styles/themes/bright-school/specificity-overrides/`; `src/styles/themes/bright-school/home.css` owns Bright School lobby import order and delegates concrete rules to `src/styles/themes/bright-school/home/`; `src/styles/themes/bright-school/gallery-polish.css` owns Bright School static gallery parity order for theme tokens, home image entries/art, paper surfaces, chat paper grid, interaction states, and addendum notes and delegates concrete rules to `src/styles/themes/bright-school/gallery-polish/`; `src/styles/themes/bright-school/commerce.css` does the same for Bright School commerce overlays through `src/styles/themes/bright-school/commerce/`; `src/styles/themes/bright-school/commerce/shop.css` owns the Bright School shop modal polish sub-entry order and delegates sidebar/wallet, product-grid, detail-dialog, and responsive rules to `src/styles/themes/bright-school/commerce/shop/`; `src/styles/themes/bright-school/modals.css` owns Bright School handbook, settings, result, room-popover, and modal cleanup order and delegates concrete rules to `src/styles/themes/bright-school/modals/`; `src/styles/themes/bright-school/effects.css` owns Bright School selected-control depth, skill action, board targeting, board marks, keyframes, and reduced-motion order and delegates concrete rules to `src/styles/themes/bright-school/effects/`; `src/styles/themes/bright-school/room.css` owns Bright School battle-room readability order for header/exit controls, player status, skill floating panels, player name controls, side tags, board coordinates, and flat control cleanup and delegates concrete rules to `src/styles/themes/bright-school/room/`; `src/styles/themes/bright-school/mobile.css` owns Bright School portrait mobile order and delegates concrete rules to `src/styles/themes/bright-school/mobile/`; `src/styles/themes/bright-school/mobile/home-shell.css` owns the Bright School portrait home shell sub-entry order and delegates concrete shell, top-strip/menu, stage, player plaque, entry/utility, and footer rules to `src/styles/themes/bright-school/mobile/home-shell/`; `src/styles/themes/bright-school/mobile/commerce-warehouse.css` owns the Bright School portrait commerce and warehouse sub-entry order and delegates shop layout, warehouse shell, and warehouse item rules to `src/styles/themes/bright-school/mobile/commerce-warehouse/`; `src/styles/themes/bright-school/mobile/room.css` owns Bright School portrait battle-room order and delegates concrete rules to `src/styles/themes/bright-school/mobile/room/`; `src/styles/themes/bright-school/component-repairs.css` owns late Bright School component repair order and delegates concrete rules to `src/styles/themes/bright-school/component-repairs/`; `src/styles/themes/bright-school/quality-base.css` owns Bright School audit/refinement order and delegates concrete rules to `src/styles/themes/bright-school/quality-base/`; `src/styles/themes/bright-school/firewall.css` owns anti-HUD bleed reset order and delegates concrete rules to `src/styles/themes/bright-school/firewall/`; `src/styles/mobile-adaptive.css` owns final mobile safety-layer order and delegates concrete rules to `src/styles/mobile-adaptive/`; `src/styles/mobile-adaptive/bright-school-overrides.css` owns the final Bright School mobile guard order and delegates concrete rules to `src/styles/mobile-adaptive/bright-school-overrides/`; `src/styles/mobile-adaptive/bright-school-portrait.css` owns the final Bright School portrait phone guard order and delegates concrete rules to `src/styles/mobile-adaptive/bright-school-portrait/`.

Required assertion points:

- `src/styles/styleContract.test.js` owns the allowed nested style directories and the `base.css` / `admin.css` / `lobby.css` / `room.css` / `room/players-timers-skills.css` / `room/board.css` / `room-terminal.css` / `modals.css` / `modals/replay-mode-resume.css` / `mobile-modals.css` / `commerce-settings.css` / `commerce/shop-settings.css` / `responsive.css` / `mobile-home.css` / `mobile-room.css` / `hud-components.css` import order.
- `src/styles/styleContract.test.js` also owns the `mobile-adaptive.css` import order plus the nested `bright-school-overrides.css` and `bright-school-portrait.css` import orders because these entries are the final safety layers after theme imports.
- `src/styles/themeContract.test.js` owns the Bright School base, contrast-purge, radical-purge, specificity-overrides, home, gallery-polish, commerce, modals, effects, room, mobile, mobile room, component repair, quality-base, and firewall import order.
- Feature tests that need concrete CSS, such as gacha modal coverage, should read the CSS import tree instead of asserting that rules live directly in the entry file.
- New top-level CSS domains should start as import-only entries with an explicit directory and a style contract test update.

### UserIdentity Nameplate Background Contract

Achievement nameplate backgrounds are skins for an auto-sized username tag, not a separate floating layer. `src/shared/UserIdentity.jsx` should render one `.user-identity-name-tag` around `.user-identity-name`; when an equipped nameplate image exists, apply it as that tag's `backgroundImage`. The tag width follows the username text plus padding, keeps transparent default styling and no border, and uses responsive max-width/padding variables so legacy long names cannot break mobile or leaderboard layouts. Parent surfaces such as room player panels and leaderboard cells center or align the whole tag.

Nameplate PNG assets should still be alpha-trimmed before use. Transparent canvas padding changes the apparent center of the art even when the tag model is stable. Use `node scripts/pngTrim.mjs <input.png> [output.png]` for 8-bit RGBA PNG nameplates before wiring them into `AchievementRewardAsset.imageUrl`.

Required assertion points:

- `src/styles/hudComponents.test.js` should assert that the username tag uses `width: auto`, transparent borderless default styling, responsive max-width/padding variables, and that leaderboard `UserIdentity` remains centered without reintroducing a fixed tag width.
- Home player plaques should render nameplates through the nested `UserIdentity` tag, not a full-card plaque background layer. Bright School player plaque grids should keep a nonzero minimum username column so stats panels cannot collapse short names into ellipses, and plaque-scoped `UserIdentity` text must override list-style `text-overflow: ellipsis` so ordinary usernames render in full.
- `scripts/pngTrim.test.js` should cover alpha-bound trimming before relying on the helper for checked-in nameplate assets.

Wrong:

```css
.user-identity.has-nameplate {
  width: calc(10em + 24px);
}
```

This changes what the parent layout centers.

Correct:

```css
.user-identity-name-tag {
  box-sizing: content-box;
  width: auto;
  max-width: var(--user-identity-name-tag-max-width);
  padding-inline: var(--user-identity-name-tag-padding-x);
  background-size: 100% 100%;
}
```

### Web Audio Pause/Resume Contracts

When changing background music, character BGM previews, or shared playback schedules, preserve user-visible playback position across pause/resume.

Required assertion points:

- `src/shared/audioScheduling.js` owns offset-aware schedule calculation for single-loop and intro-loop tracks; callers should pass `offset` into `createPlaybackSchedule()` instead of duplicating modulo math.
- Character BGM preview pause should update its state offset from `context.currentTime - startedAt`, keep that offset through the next play click, and reset only when the selected track id changes.
- Background music paused by a preview should stop current sources, save offset, and reschedule from that offset when the pause request count returns to zero. Do not rely only on `AudioContext.suspend()` if the visible contract is "continue from where it paused".
- `startedAt` should be the scheduled audio start time, not the context time before `BGM_START_DELAY_SECONDS`, so short pause/resume cycles do not accumulate artificial delay.
- Volume changes may adjust gain ramps, but must not change playback identity or reset offsets.

Wrong:

```js
context.suspend();
scheduleBackgroundTrack({ state, track });
```

This can resume by creating a fresh source at the beginning of the track.

Correct:

```js
state.offset += Math.max(0, context.currentTime - state.startedAt);
stopBackgroundPlayers(state);
scheduleBackgroundTrack({ state, track, offset: state.offset });
```

Before finishing audio pause/resume changes, run:

```bash
npm test -- src/shared/audioScheduling.test.js src/audio/CharacterMusicPreview.test.jsx src/audio/playback.test.jsx
```

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
- Battle-room tags and buttons should stay visually flat on mobile. Header tags, timer chips, capture chips, player labels, menu buttons, dock tabs, action buttons, replay buttons, and chat controls should use border-only treatment without `box-shadow`, `filter: drop-shadow(...)`, or `text-shadow`. When a mobile room control is flat, selected/pressed feedback must not use translate/scale offsets; dock tabs such as `.mobile-tab-button` should change background/border color only so the tab bar does not jitter without a shadow model. Bright School control-shadow cleanup must use selectors specific enough to beat older `.app-shell... .captures span` / `.skill-chip` `!important` rules; a low-specificity `:where(...)` reset alone is not sufficient. Do not use a generic room `button` reset that catches `.point`; board point buttons and stone/current-move visuals are gameplay affordances and must stay separately controlled by board styles.
- Board point buttons must explicitly opt out of ordinary button chrome in both shared board CSS and Bright School board guards: keep `appearance: none`, transparent background/background-image, no border/shadow, `min-width/min-height: 0`, and `touch-action: none`. Otherwise 13x13 button surfaces can cover the SVG grid and make the board appear as a blank white square.
- Board grid SVGs also need dedicated survival rules. Keep `.board-lines` as an absolute `display: block` layer with `width/height: 100%`, `max-width/max-height: none`, visible stroke/opacity, and Bright School guard overrides so broad `svg { height: auto; max-width: 100%; }` media resets cannot collapse the grid while DOM effects such as row slash remain visible.
- DOM board effect layers whose class names include broad words such as `row` must explicitly opt out of Bright School generic surface rules with enough specificity to beat `[class*="row"]:not(...) !important`. Keep `.board-row-effects` transparent, borderless, shadowless, and overflow-visible, and keep `.board-row-slash` responsible for only the slash artwork so generic paper panels cannot cover the grid and stones. If the effect uses `::before`/`::after` for highlights or cuts, restore those pseudo-elements with the same scoped specificity because the Bright School generic pseudo-element firewall also matches `[class*="row"]`.
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
- Shared modal backdrops must stack above room `--room-floating-z` surfaces, including the member popover fallback of `140`, so request and confirmation modals dim skill chips, chat controls, and member popovers together.
- Mobile room portrait strips must not show character-chain badges. Duplicate-chain data can stay in the user payload, but `CharacterChainBadge` should render nothing unless the product explicitly re-enables the badge.
- Keep player cards and skill wrappers overflow-visible so dynamically raised skill panels can escape the side panel without clipping.
- Room member action popovers must keep their fixed-position anchor variables and use `--room-floating-z` in both base CSS and Bright School theme overrides.
- Capture/removal/overclock chips should share stable heights so skill-only counters do not look shorter or taller than captures.

### Modal and Tab Visual State Contracts

When adding or restyling modal tabs, including game-mode tabs in resume, leaderboard, replay, or watch-list surfaces, keep selected state visually explicit in both base CSS and the active theme override.

Required assertion points:

- Tab buttons with `.active`, `aria-selected="true"`, or equivalent selected state must have a distinct background color, not only a border or text-color change.
- Theme layers that globally reset `button` backgrounds, especially Bright School rules with `!important`, must include matching selected-tab overrides after the reset.
- Personalization equipment buttons have two different visual states: `.equipped` is the saved, currently effective asset and should use the same pink selected background as achievement/resume tabs; `.trying` is a draft try-on state that has not been saved and should use a light green background. If the draft matches the saved asset, show the saved `.equipped` treatment rather than green.
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

The Bright School home layout has four distinct responsive modes. Keep them explicit so medium desktop windows do not inherit the large scrapbook offsets, and so micro desktop windows preserve content before changing composition.

Required assertion points:

- Base terminal layout must not force a fixed minimum viewport width; `.home-screen` and `.home-grid-featured` should keep `min-width: 0`.
- Large desktop starts at 1181px. It can use the three-column composition, but should not create horizontal page scroll.
- The 1181px-1500px middle desktop band must reserve enough left-column width for the fixed-structure Bright School player plaque; prefer reducing column gaps and secondary-column width before shrinking plaque text below readability.
- Bright School player plaque names must stay inside the middle identity column. Do not use `width: max-content` or visible overflow on plaque identity children if that lets the username cover `.plaque-stats`; use bounded width plus the shared `--user-identity-fit-font-size` scaling instead.
- Compact desktop is 1024px-1180px and should switch the home stage to named CSS grid areas (`player`, `manual`, `utility`, `match`) while staying inside the viewport.
- Micro desktop is 701px-1023px. It should use a controlled minimum home stage width, currently `960px`, with horizontal scroll localized to `.home-main-panel`; do not shrink core entries until their contents become unreadable.
- The final `mobile-adaptive/home-narrow-desktop.css` layer owns compact and micro desktop safety after theme overrides. It must reset player/manual/match/utility regions to `position: static` and remove decorative transforms that can create invisible hit boxes or overlaps.
- Footer chrome should be fixed only on wide and tall desktop windows. Compact, micro, and low-height desktop windows should keep the footer in normal flow so it cannot cover core entries.
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

@media (min-width: 1024px) and (max-width: 1180px) {
  .home-stage {
    grid-template-areas:
      "player manual"
      "nav manual"
      "match match";
  }
}

@media (min-width: 701px) and (max-width: 1023px) {
  .home-main-panel {
    overflow-x: auto;
  }

  .home-stage {
    width: 960px;
    min-width: 960px;
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
