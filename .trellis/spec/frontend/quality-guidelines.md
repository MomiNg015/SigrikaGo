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

### Character Detail BGM Preview Interaction Contract

#### 1. Scope / Trigger
- Trigger: any change to `src/audio/CharacterMusicPreview.jsx`, `.character-music-*` CSS, Bright School character detail music overrides, or ordinary/derived skill BGM selection.
- The player sits in a compact modal heading, so interaction feedback must stay immediate and layout-stable even when first-use audio decoding is slow.

#### 2. Signatures
- `CharacterMusicPreview({ characterId, slots, audioSettings, onTrackChange })` renders `.character-music-player`; each slot contains `{ id, effectType, label, fallbackTrackId, options, track }`.
- `onTrackChange({ trackId, effectType })` persists the active ordinary- or derived-skill slot.
- Runtime skill BGM metadata uses `{ effectType, musicEffectType, musicTrackId }`: `effectType` owns gameplay presentation, while `musicEffectType` alone selects the ordinary (`""`) or derived (non-empty) music slot.
- Local playback states are `idle`, `loading`, `playing`, and `error`.
- The decorative Rough.js SVG layer renders as `.character-music-sketch` and is `aria-hidden`.

#### 3. Contracts
- Clicking play must enter a visible `loading` state before awaiting WebAudio fetch/decode.
- The global background music pause request must be released when preview startup fails, the selected track changes, or the component unmounts.
- Async preview startup must use an intent/request guard so old decode completions cannot play after a slot change, pause action, or unmount.
- Ordinary skill and every derived `effectType` are independent selection slots. Switching slot or track while playing continues with the new track; switching while idle must not autoplay.
- Pending skill previews must always carry `musicEffectType`; ordinary skills use an explicit empty string even when their gameplay `effectType` is non-empty, while derived skills use their exact derived effect type. Resolved skill history preserves non-empty derived `musicEffectType`; legacy history may infer it only from `musicTrackId` track metadata.
- Track persistence is optimistic but reversible: keep a per-slot request id, ignore stale saves, roll back only the latest rejected save, keep the sheet open, show a player-local error, and expose retry.
- The main title and track-sheet row titles stay single-line. Only measured overflow animates; the main title scrolls one way with start/end pauses, while rows animate only on hover/focus. Reduced motion disables automatic movement and keeps manual horizontal access.
- The track sheet is rendered into the nearest nested/modal backdrop (falling back to the themed app shell), positioned against the trigger without expanding the modal, constrained to the viewport, and limited to about four rows before internal scrolling. This keeps it above the detail modal while retaining theme ancestry. Trigger, outside press, and Escape close it; Escape restores trigger focus.
- Skill slots use tab semantics and keyboard arrow/Home/End navigation. Track choices use listbox/option semantics and retain selection state while the sheet stays open.
- The closed title renders only the current music name. Ordinary/derived skill identity belongs to the open track-sheet tabs and must not be duplicated as a visible marker beside the closed title.
- Rough.js decoration must be generated after mount and outside hover/click handlers. It must be pointer-transparent and must not become the source of layout or hit testing.
- Under Bright School, `.character-music-sketch` contributes only one quiet title underline. The closed player has no outer hand-drawn frame or card shadow; CSS owns a single rounded-square hardware key inside the 44px hit target and product-UI title typography. The 32px key face is transparent at rest, green on hover/focus, and red while pressed; playback glyphs are solid CSS shapes and must not use Lucide play/pause icons.
- Hover and press feedback for the play button must not change layout dimensions. Use transform, color, or opacity changes rather than width, height, border-width, padding, or DOM regeneration.
- Bright School button press feedback models depth instead of scale: hover raises the 44px control by 1px, active lowers it by 2px and shortens the pseudo-element shadow, and the active transform must not include `scale(...)`.
- The theme-wide `final-controls-forms.css` `button:hover`/`button:focus-visible` rule colors the full 44px button and adds a hard shadow. The character-music owner must explicitly keep the real button background, background image, border color, and box shadow transparent/none in hover, focus, and active states so only the inset pseudo-element changes color.
- Mobile and desktop size contracts must be updated together for `.character-music-player` and the surrounding `.character-detail-heading` grid; the mobile playback key remains at least 44px.

#### 4. Validation & Error Matrix
- Slow first decode -> button shows loading state immediately and does not look inert.
- Startup failure -> release background pause request, enter local error state, and expose retry.
- Track changes while startup is pending -> old completion is ignored and stopped.
- Latest save fails -> active slot rolls back, local error remains retryable, and other slots stay untouched.
- Older save settles after a newer save -> stale response cannot replace the newer selection or user payload.
- Derived slot selected -> request includes its exact non-empty `effectType`; ordinary slot uses an empty value.
- Ordinary runtime preview with gameplay `effectType: "flip-stone"` or `"liberty-purge"` -> resolve `musicSelections.skill[characterId]`, not a derived slot.
- Bright School active -> themed hover/active rules keep transform-only feedback.
- Reduced motion -> no automatic title animation; text remains horizontally reachable.
- Portrait mobile -> final mobile safety layer preserves the same non-overlap grid contract as the theme layer.

#### 5. Good/Base/Bad Cases
- Good: set local state to `loading`, request background pause, await playback, then set `playing` only if the current intent still wants playback.
- Good: persist `{ trackId, effectType }` and reconcile only when that slot's request id is still current.
- Good: render only the current music name in the closed title and keep `普通技·技能名` / `派生技·技能名` in the open tab strip.
- Good: let the surrounding Bright School grid/paper surface carry the campus context, while the closed control uses one transparent rounded-square hardware key that turns green on hover and red on press.
- Base: characters without derived BGM render one slot and no tab strip; characters with one track render a non-sheet title.
- Bad: waiting for `decodeAudioData()` before updating visible state.
- Bad: storing derived selection in `musicSelections.skill[characterId]`, filtering only by character, or closing the sheet after every selection.
- Bad: using runtime gameplay `effectType` directly as the music slot discriminator, because every ordinary active skill also has a non-empty gameplay effect type.
- Bad: using an infinite CSS marquee without measuring overflow or honoring `prefers-reduced-motion`.
- Bad: running Rough.js drawing or replacing SVG children inside hover, focus, active, or click handlers.
- Bad: rendering `shortLabel`, `普通技`, `派生技`, or the skill name beside the closed music title, because it duplicates the track-sheet tabs and reduces marquee space.
- Bad: enclosing the compact player in a bowed Rough.js rectangle, adding a second Rough.js ring around the solid key, or using the display title font for track data; together these make the control read like a novelty widget instead of a dependable player.

#### 6. Tests Required
- `src/audio/CharacterMusicPreview.test.jsx` asserts the sketch layer, CSS playback glyph, accessible state hooks, and marker-free closed title without Lucide playback icons.
- `src/audio/CharacterMusicPreview.dom.test.jsx` asserts tab semantics, slot switching, sheet persistence after selection, save rollback, and retry.
- `src/modals/HouseModal.test.js` or focused style tests assert slot construction, desktop/mobile size hooks, state selectors, pointer-transparent sketch styling, and transform-only feedback.
- `src/shared/musicLibrary.test.js`, `server/roomSkillResolution.test.js`, `server/musicSelection.test.js`, and `server/playerRoutes.test.js` cover realistic ordinary gameplay effect types, pending/history metadata, ordinary/derived slot separation, legacy history fallback, and request forwarding.
- Run the focused suites and `npm run build` after changing this surface or its Rough.js module boundary.

#### 7. Wrong vs Correct

Wrong:

```jsx
onTrackChange(trackId); // derived slot identity is lost
```

Correct:

```jsx
onTrackChange({ trackId, effectType: activeSlot.effectType });
```

Wrong:

```js
resolveSkillMusicTrack({ effectType: skillPreview.effectType });
```

Correct:

```js
resolveSkillMusicTrack({ effectType: skillPreview.musicEffectType });
```

### Login mascot asset contract

The login title mascot is a login-owned presentation asset, not the shared character portrait consumed by profiles, loading screens, character lists, or battles.

Required assertion points:

- `AuthScreen` must reference `/assets/login-sigrika-mascot.webp` directly and must not read `CHARACTERS.sigrika.portrait` for the title lockup.
- Keep `public/assets/login-sigrika-mascot.png` and the runtime WebP on the same transparent 640x640 canvas. When artwork changes, measure non-zero-alpha bounds, crop transparent edges only, scale uniformly, and center the result; do not stretch width and height independently.
- The title `h1` must use the semantic `.text-window-title` hook so the final typography layer resolves it to `var(--font-window-title)` (霞鹜漫黑) even after Bright School owner overrides.
- The mascot is a pointer-transparent absolute decoration over the card's top-left corner, while `.brand-lockup` keeps the title copy in its original column. Desktop uses an equal 240x240 CSS box rotated `-6deg`; the final `bright-school-overrides/auth-login-lockup.css` owner gives portrait phone equal `clamp(140px, 39vw, 148px)` dimensions and a contained left offset so it cannot create page-level horizontal overflow.
- `AuthScreen.test.js` must assert the dedicated WebP URL, reject the shared portrait URL, verify the retained PNG/WebP signatures, keep the runtime WebP smaller than its PNG source, and cover the desktop/mobile equal-dimension and rotation contracts.

Correct:

```jsx
<img src="/assets/login-sigrika-mascot.webp" alt="西格莉卡" />
```

Wrong:

```jsx
<img src={CHARACTERS.sigrika.portrait} alt="西格莉卡" />
```

### Social action disabled-state contract

Friend-list action rows, room member popovers, profile relation actions, and other user/social action menus must render unavailable actions as native disabled controls, not as active-looking inert buttons.

Required assertion points:

- Use a real `disabled` attribute for actions that cannot run, including unavailable direct-message entries while the feature is not implemented.
- Keep click handlers guarded when the action depends on mutable user state, such as online/offline match requests or friend/blacklist relation changes.
- Add base and active-theme `button:disabled` CSS when high-specificity theme layers style the same action buttons with `!important`; disabled actions must stay gray and use `cursor: not-allowed` on desktop and mobile.
- Static markup tests should assert the disabled attribute for unavailable social actions, and style-contract tests should assert the disabled selector exists in every theme layer that can override the button.

Wrong:

```jsx
<button type="button">Direct message</button>
```

This looks actionable even when the feature is unavailable.

Correct:

```jsx
<button type="button" disabled>Direct message</button>
```

### Home utility unavailable-entry contract

Temporarily unavailable home utility entries must look and behave unavailable on both desktop and mobile, even when a theme layer restyles the utility dock.

Required assertion points:

- Keep the entry in the home utility dock only when product discovery still matters; otherwise remove it entirely. If it remains visible, render it as a native `disabled` button.
- Rename the visible label to the product-facing future feature name, not the unavailable internal implementation name. For example, a hidden gacha implementation can surface as `Recruitment`.
- Add a focused base CSS file for shared disabled utility-entry treatment when the existing home layout file is already oversized.
- Add active-theme disabled selectors when theme files style `.utility-entry`, hover, focus, or active states with high specificity or `!important`; the disabled rule must preserve a gray background, gray text/border, `cursor: not-allowed`, no press transform, and no action-looking shadow.
- Mobile touch feedback selectors must use `:active:not(:disabled)` for `.utility-entry` so disabled home actions cannot receive a pressed visual state.
- Tests should assert the disabled markup, the product-facing label, base disabled CSS, active-theme disabled CSS, and the mobile `:not(:disabled)` touch selector.

Wrong:

```jsx
<button className="home-entry utility-entry" onClick={openFeature}>Gacha</button>
```

This still looks and behaves like an available action.

Correct:

```jsx
<button className="home-entry utility-entry recruitment-entry" disabled title="Recruitment unavailable">
  <strong>Recruitment</strong>
</button>
```

### Profile social action CSS split contract

Profile like/report styling must stay split across focused CSS files so the style-contract oversized-file guard stays useful.

Required assertion points:

- Base desktop profile like/report rules live in `src/styles/modals/profile-social-actions.css`, imported by `src/styles/modals.css` immediately after `nested-profile.css`.
- Mobile profile like/report overrides live in `src/styles/mobile-adaptive/mobile-profile-social-actions.css`, imported by `src/styles/mobile-adaptive.css` immediately after `mobile-profile-records.css`.
- Broad profile layout rules such as hero grid, record rows, footer actions, and social action buttons should not all accumulate in one CSS file. If a focused rule set pushes a known debt file over its byte limit, split it into a named import-only domain file and update `styleContract.test.js`.
- Update `docs/system-design.md` and `docs/system-design/06-ui-theme-mobile.md` when adding or renaming CSS domain entries.

Wrong:

```css
/* Appending all new profile button and dialog rules to nested-profile.css */
.profile-social-actions { ... }
.profile-report-dialog textarea { ... }
```

Correct:

```css
@import "./modals/nested-profile.css";
@import "./modals/profile-social-actions.css";
```

---

## Testing Requirements

### CSS import-only style contract tests

When a test asserts concrete CSS rules from an entry that may contain `@import`, use `readCssWithImports()` instead of reading the entry file directly. CSS cleanup keeps domain entries import-only, so raw `readFileSync()` on an entry such as `themes/theme-components.css`, `themes/shared.css`, `room.css`, or `mobile-adaptive.css` only sees import directives and can fail even when the effective CSS is correct.

Required assertion points:

- Use `src/styles/cssTestUtils.js` `readCssWithImports()` for cross-entry CSS rule assertions outside files that already define an equivalent local helper.
- Raw `readFileSync()` is still fine when the test intentionally asserts an entry is import-only or checks exact import order.
- After splitting an entry into child CSS files, update dependent tests to preserve the same effective-rule assertions through import expansion instead of moving concrete rules back into the entry.

### Admin route CSS isolation contract

Admin screens are a light production tool surface, not a Startorch terminal surface. When admin markup reuses generic shared classes such as `.primary-action`, `.secondary-action`, `.danger-action`, `.close-button`, `.modal-backdrop`, `.confirm-modal`, ordinary `input`/`textarea`/`select`, or setting-named containers, the effective `src/styles/admin.css` import tree must keep `.admin-screen`-scoped resets that beat global terminal/HUD rules.

Required assertion points:

- Keep action, danger, and close-button admin rules specific enough to reset `clip-path`, dark/neon backgrounds, `text-shadow`, `filter`, and terminal skew/cut styling.
- Keep admin heading, settings-grid, and form-control rules specific enough to reset global HUD input and setting-surface hardening, including dark backgrounds, green borders, pseudo-elements, neon text treatment, and terminal focus/caret colors.
- Keep announcement confirmation modal/backdrop rules specific enough to clear terminal modal pseudo-elements, scanline/dark backdrops, and neon text treatment.
- Add or update a focused admin test that reads `src/styles/admin.css` with `readCssWithImports()` whenever the admin polish or announcement confirmation rules change.

### Startup preload, build chunking, and handoff check contracts

#### 1. Scope / Trigger
- Trigger: any change to login/startup preload behavior, runtime asset manifests, Vite build chunking, project handoff verification commands, or the GitHub Actions CI quality gate.
- Startup preload is user-visible performance infrastructure. It must block only on the selected character, immediately visible home shell, interaction audio, and reachable home BGM; secondary accessible shop/inventory/character/battle/voice media stays in the bounded deferred queue, while inaccessible resources such as unpurchased music audio remain excluded.

#### 2. Signatures
- `loginPreloadAssets()` returns grouped assets: `criticalImages`, `deferredImages`, `images`, `criticalAudio`, `deferredAudio`, and `audio`.
- `battlePreloadAssets({ room, characters, tracks, user, skillVoices, systemVoices })` returns the same grouped shape and resolves battle/skill tracks from the current user's ownership and selections.
- `preloadLoginAssets(assets, { concurrency, loadImage, loadAudio, loadEffectAudio, onProgress, onSkipped, taskTimeoutMs })` waits for critical groups, starts deferred groups in the background when callers provide them, caps concurrent loaders, bounds each loader with a timeout, and reports timed-out or failed sources through `onSkipped`.
- `retrySkippedPreloadAssets(skippedAssets, { concurrency, retryDelaysMs, taskTimeoutMs })` retries skipped login or battle resources after the target screen has been entered.
- `useStartupPreload({ token, ... })` must not receive a transient Socket.IO `socket` instance or include one in its dependency list.
- `connectGameSocket({ socketBase, token, ... })` creates the game Socket.IO client with explicit reconnect settings: `reconnection: true`, `reconnectionAttempts: Infinity`, `reconnectionDelay: 500`, `reconnectionDelayMax: 3000`, and `timeout: 6000`. It installs handlers before `connect()`, then immediately queues one `room:resume` emit in addition to the normal `connect` listener so polling/websocket timing cannot make room recovery depend on a single client event callback.
- `npm run check` is the local handoff gate and should run unit tests, Vite build, production config validation with explicit sample env, and `docs:system-design`.
- `npm run check:production` remains the strict production-env validator and must not silently inject sample secrets or origins.
- `.github/workflows/ci.yml` is the hosted quality gate for pull requests and pushes to `master`. It should use Node 22, `npm ci`, `npm test`, `npm run build`, explicit sample-env production config validation, and `npm run docs:system-design`.
- `vite.config.js` manually chunks React, Socket.IO client code, and Pixi into `react-vendor`, `realtime-vendor`, and `pixi-vendor` respectively. Do not add a catch-all `vendor` chunk unless the build is checked for circular chunk warnings.
- `vite.config.js` keeps `pixi.js` and `pixi.js/unsafe-eval` in `optimizeDeps.exclude` for the dev server, and keeps Pixi nested runtime dependencies such as `pixi.js > @xmldom/xmldom`, `pixi.js > eventemitter3`, `pixi.js > gifuct-js`, and `pixi.js > ismobilejs` in `optimizeDeps.include`. Pixi lazily imports renderer modules such as WebGLRenderer; pre-optimizing the Pixi entries can leave browsers holding immutable stale `.vite/deps` renderer chunk URLs after the optimizer graph changes, while failing to optimize these nested CommonJS/conditional-export dependencies makes Pixi source modules load raw entries without the default or named exports they import.
- `vite.config.js` configures the dev `/socket.io` websocket proxy with an error handler that keeps expected backend-watch restart disconnects quiet while still warning on unexpected proxy errors.

#### 3. Contracts
- Frontend API calls through `api()` must have a bounded request timeout. Startup begins on the `preloading` view before `/api/auth/refresh` completes, so a hung auth refresh or catalog/settings request must reject and enter existing recovery flow instead of leaving the app on the preload screen forever.
- Critical login images include only the selected character portrait and `RUNTIME_IMAGE_ASSETS.home`. Other owned character portraits, shop/recruitment/inventory/equipment images, and stone decorations remain accessible through `images` but belong to `deferredImages`.
- Critical login audio includes `RUNTIME_AUDIO_ASSETS.interaction` plus reachable home BGM candidates because home playback chooses among them. Match/result sounds, battle/skill tracks, and character/system voices remain accessible through `audio` but belong to `deferredAudio`. Unpurchased music product audio must not be preloaded.
- Deferred work starts only after critical completion and remains concurrency-limited. Moving an asset to deferred must not remove it from the flattened compatibility arrays.
- Battle preload must derive assets from the current room, players, mode, and current user. It blocks on both player portraits, the one resolved battle track, one resolved track per relevant base/derived skill slot, required voice candidates, and mode-specific effect images; it must not preload every configured battle track or every purchasable alternative for a slot. Modes with `skillEnabled=false` must skip skill BGM, skill voices, and skill effect images.
- Preload progress represents completion of the blocking manifest. Timed-out tasks count as completed preload work for the current pass, are reported through `onSkipped`, and should be retried after entry with lower concurrency.
- `AssetPreloadScreen` owns one normalized `--preload-progress` value for both fill and endpoint mascot. Keep the bar at 16px, the mascot height at exactly three times the bar height with `width: auto`, and reserve half a mascot at both horizontal ends so 0% and 100% remain fully visible on narrow screens. Grow the light-to-deep orange gradient with `scaleX()` and move/rotate the mascot from the same value. Movement above one percentage point suppresses the idle hop for 600ms; unchanged or one-point progress hops vertically in place. Reduced-motion keeps the current endpoint but removes interpolation, rotation, and hopping. Theme-wide media and meter rules must preserve this owner contract instead of stretching the mascot or replacing the gradient.
- Startup preload must be independent from transient socket object identity. Token/session cleanup can close sockets through the socket lifecycle hook after state changes; preloading should continue once for the confirmed token instead of restarting when a mobile WebSocket reconnects or a socket instance changes.
- The game socket should fail its initial connection attempt quickly enough for mobile recovery feedback and Socket.IO retry logic to take over. Do not rely on Socket.IO's default long handshake timeout for this app shell path.
- Room resume is idempotent. Do not remove the immediate queued `room:resume` from `connectGameSocket()` just because the installed `connect` listener also emits one; the immediate emit covers browser/mobile transport cases where the app shell otherwise waits on one event edge.
- The grouped asset API must keep `images` and `audio` flattened arrays for compatibility with tests and existing callers.
- Production entry JS should stay split from heavy runtime libraries. The Pixi chunk may be larger than Vite's default 500 KB warning because it is lazy-loaded and prewarmed only for skill-enabled boards; the configured warning limit should remain a documented exception, not a way to hide a growing entry chunk.
- The hosted CI workflow must mirror the local handoff gate instead of introducing a separate, weaker validation path. If `npm run check` changes, update `.github/workflows/ci.yml` and system-design docs in the same change.
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
- CI workflow omits docs generation or production config validation -> invalid, because documentation drift and deploy config regressions can merge even when tests pass.
- Selected battle/skill track is unavailable or not owned -> use the existing music-library fallback for that slot; never preload an arbitrary inaccessible alternative.

#### 5. Good/Base/Bad Cases
- Good: Login reaches home after the selected portrait, home art, UI/board SFX, and reachable home BGM are ready while shop, inventory, battle tracks, and voices load in the background.
- Good: Match preload fetches the user's selected battle track and the resolved skill-slot tracks for the two room characters, not the whole music catalog.
- Good: A mobile client with a flaky `/socket.io` WebSocket keeps the asset preload flow stable while Socket.IO retries the realtime connection.
- Good: React and Socket.IO runtime code are cached in stable vendor chunks, while Pixi stays in a lazy `pixi-vendor` chunk outside the initial room entry path.
- Good: CI runs the same core quality surfaces as local handoff so pull requests catch tests, build, production config, and system-design docs regressions before merge.
- Base: Older tests or helpers that pass only `images` and `audio` still work.
- Bad: Awaiting every configured music and voice file before home entry.
- Bad: Making `check:production` pass by mutating production defaults instead of keeping sample env limited to the aggregate `check` command.
- Bad: CI runs only `npm test`, because build, docs, and production config drift can still merge.

#### 6. Tests Required
- API client tests must assert a hung request is aborted and rejected instead of staying pending forever.
- Asset grouping tests must assert the selected portrait/home shell/home BGM are critical; secondary owned portraits, shop/inventory/equipment, battle/skill music, and voices are deferred; inaccessible unpurchased music audio is excluded.
- Battle grouping tests must assert selected battle music replaces the default candidate, derived skill slots remain covered, both room portraits are present, and no-skill modes omit skill-only resources.
- Preload behavior tests must assert critical completion resolves the awaited promise and deferred work is concurrency-limited.
- Preload behavior tests must assert skipped/timeout assets are reported and can be retried in the background.
- Preload behavior tests must assert a hung critical loader cannot keep login preload pending forever.
- `AssetPreloadScreen` tests must assert the shared normalized progress value, accessible progressbar state, 16px/3x aspect-preserving size contract, orange gradient, clockwise endpoint rotation, meaningful/near-idle movement threshold, 600ms idle hop transition, reduced-motion fallback, and late-theme exclusions that protect the mascot and fill.
- App wiring tests must assert startup preload is not passed a `socket` prop.
- Game socket tests must assert the mobile recovery reconnect and 6-second handshake timeout options.
- Game socket tests must assert handlers install before `connect()` and that an immediate `room:resume` is queued after connecting.
- Script contract tests must assert `npm run check` includes tests, build, production config validation, docs generation, and explicit sample production env.
- Workflow review must assert `.github/workflows/ci.yml` keeps the hosted CI commands aligned with the local handoff gate when either command list changes.
- Vite build config tests must assert manual chunk grouping, the absence of a catch-all vendor chunk, the intentional Pixi warning limit, Pixi dev optimizer exclusions, and quiet handling for expected dev websocket proxy disconnects.
- Run `npm run check` before handoff when changing preload or verification commands.

#### 7. Wrong vs Correct

Wrong:

```js
await Promise.all([...images, ...audio].map(preloadEverything));
```

This either over-fetches inaccessible resources or lacks per-asset timeout/retry reporting.

Correct:

```js
const skipped = [];
await preloadLoginAssets(loginPreloadAssets({ characters, user, shopItems, inventoryItems, tracks }), {
  onProgress,
  onSkipped: (src) => skipped.push(src)
});
retrySkippedPreloadAssets(skipped, { concurrency: 2 });
```

`loginPreloadAssets` splits the current user's accessible manifest into a small home-critical tier and a bounded deferred tier, while `preloadLoginAssets` bounds each asset and reports skipped sources for background retry.

Wrong:

```yaml
- run: npm test
```

Correct:

```yaml
- run: npm test
- run: npm run build
- run: node -e "process.env.JWT_SECRET='12345678901234567890123456789012';process.env.PUBLIC_ORIGIN='https://sigrika.example';import('./scripts/check-production-config.mjs')"
- run: npm run docs:system-design
```

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
- `useRoomPointActions()` returns `useCallback`-stable `handlePoint`, `handleScoringPoint`, and `handleBoardSurface` callbacks.
- `areChatBoxPropsEqual(previous, next)` is the chat widget comparator for avoiding room-clock rerenders.
- `areRoomPeopleListPropsEqual(previous, next)` is the member-list comparator for avoiding room-clock rerenders.
- `areOperationHintPropsEqual(previous, next)` is the action-hint comparator for avoiding room-clock rerenders.
- `areActionBarPropsEqual(previous, next)` is the room action comparator for avoiding countdown or clock-only rerenders while keeping button availability and decision bars live.
- `timedRoomRequestEffectKey(room, userId)` is the request-toast effect dependency key; it must ignore clock-only player time changes while changing for request phase, deadline, requester, acceptance, or displayed request copy changes.
- `triggerUnavailableShake(target)` restarts `ui-unavailable-shake` without reading layout metrics such as `offsetWidth`.
- `lastMarkedAction(history)` is the canonical source for the board's latest placed-stone marker.

#### 3. Contracts
- Point memo comparison may ignore event function identity only when the rendered button reads the latest handlers through a stable ref object.
- Board-level memo comparison must not ignore handler identity if `handlersRef.current` is updated inside the board render. Handler changes should re-render the board shell to refresh the ref, while point buttons can still stay memoized because their `handlersRef` object identity is stable.
- `useRoomPointActions()` callback dependencies should track click semantics, not whole room/player objects. Depend on fields such as `phase`, `role`, `pendingSkill`, and current player color instead of the full `displayRoom` or `me` object so room clock ticks do not churn board click handlers.
- `RoomBattleStage` must pass named stable callbacks into `Board`; do not use inline handlers for board point props such as `onNeutral`, because board-level memo comparison treats handler identity as the signal that `handlersRef.current` needs refreshing.
- `ChatBox` should ignore player `time` changes from `room:clock` while still rerendering for room code changes, chat array changes, player metadata that affects chat names such as user id or character id, and `presentation` changes between desktop floating and mobile embedded modes.
- `RoomPeopleList` should ignore player `time` changes from `room:clock` while still rerendering for room code changes, player connection state, spectator membership, and user display metadata used by `roomPeople()`.
- `OperationHint` should ignore player `time` changes from `room:clock` while still rerendering for action-relevant fields: room code, phase, turn, winner, current user id, scoring reference, draw request reference, and color-to-user mappings.
- `RoomBattleStage` must also pass stable floating-layer callbacks into memoized room widgets such as `ChatBox`; inline `onFloatingLayerRequest` callbacks defeat memo comparison during parent renders.
- `ActionBar` should ignore player `time` changes and unused timed-request payloads while still rerendering for role, mode, phase, turn ownership, skill state, skill uses, decision locks, opponent connectivity, scoring reference, replay step, and every rendered callback identity.
- `RoomBattleStage` must pass named stable callbacks into `ActionBar` for test tools and scoring decisions; inline action dispatchers defeat `areActionBarPropsEqual()` during parent renders.
- `RoomScreen` should pass stable confirmation and header-toggle callbacks into room composition; close-countdown timer state belongs in `RoomCloseCountdown` under `RoomHeader` so a finished-room countdown does not re-run the whole room screen or recreate pass/resign/exit and coordinate/move toggle handlers.
- Timed room request toast logic should depend on `timedRoomRequestEffectKey(room, userId)`, not the whole `room` object, so `room:clock` player-time churn does not rerun draw/counting/result request state effects.
- Comparator inputs must include visible point state, board size, marker/decoration classes, move number state, scoring mark state, and interaction capability flags such as `hasScoringPoint`.
- Do not rely on `game` object identity inside a point button; derive per-point display props in `Board` and pass only the point's slice.
- Unavailable feedback may remove and re-add the shake class on the next animation frame; it must not force a synchronous layout read to restart CSS animation.
- Neutral point marking remains phase-gated by an explicit capability prop such as `canMarkNeutral`.
- History entries for skills that place a real stone must be eligible for the latest placed-stone marker. Keep Chisa `liberty-purge` covered through `lastMarkedAction(history)` instead of treating only ordinary moves as markable placements.

#### 4. Validation & Error Matrix
- Handler function changes -> board shell re-renders to refresh `handlersRef.current`; the same stable handler ref is passed to point buttons, so point buttons may stay memoized and must still call the latest handler.
- Player timer object changes while the current player color and click semantics stay the same -> `useRoomPointActions()` should keep point handler identities stable.
- Parent room render with unchanged scoring callback -> `RoomBattleStage` should pass the same `onNeutral` handler identity into `Board`.
- Room clock tick changes only player `time` -> `ChatBox` should stay memoized.
- Chat content, chat-name player metadata, or floating/embedded presentation changes -> `ChatBox` must rerender.
- Room clock tick changes only player `time` -> `RoomPeopleList` should stay memoized.
- Player connected state, username/rank/rating, achievement display metadata, or spectator list changes -> `RoomPeopleList` must rerender.
- Room clock tick changes only player `time` -> `OperationHint` should stay memoized.
- Phase, turn, winner, scoring/draw request, or active-player user mapping changes -> `OperationHint` must rerender.
- Room clock or close-countdown tick changes only player `time` or header timer text -> `ActionBar` should stay memoized, and the close countdown tick should be local to the header.
- Room clock tick changes only player `time` while draw/counting/result request fields are unchanged -> timed request toast effects should not rerun.
- Skill uses, pending-skill active state, scoring confirmation reference, replay step, or rendered action callback identity changes -> `ActionBar` must rerender.
- Scoring handler availability changes -> point button must re-render because pointer/click semantics change.
- Point stone, mark, decoration, move number, preview class, or confirmation class changes -> point button must re-render.
- Browser lacks `requestAnimationFrame` -> unavailable feedback may fall back to a timer instead of forcing layout.
- A skill history entry with `effectType: "liberty-purge"` and `placedId`/`id` after an ordinary move -> latest marker must move to the skill placement point.

#### 5. Good/Base/Bad Cases
- Good: A timer tick or parent handler recreation does not re-render all board intersections, while a new click handler stored in `handlersRef.current` is still used.
- Good: Room clock ticks can replace player time objects without making `useRoomPointActions()` return new point handlers.
- Good: `const handleNeutralPoint = useCallback(...)` is passed as `onNeutral={handleNeutralPoint}`.
- Good: `ChatBox` compares `room.chat` and chat display metadata, not the full `room.players[*].time` object.
- Good: `RoomPeopleList` compares the `roomPeople()` source fields, not full player objects.
- Good: `OperationHint` compares the action hint inputs, not full player timer objects.
- Good: `ActionBar` compares the action-control inputs and rendered callback identities, not full player timer objects or unused request deadlines.
- Base: A changed point object for one intersection re-renders that point and preserves other memoized points.
- Bad: Ignoring handler identity while the point button directly closes over stale `onPoint`, `onScoringPoint`, or `onNeutral` props.
- Bad: Restarting disabled feedback by reading `target.offsetWidth`.

#### 6. Tests Required
- Board comparator tests must assert handler-ref content changes stay memoized and visible/capability changes re-render.
- Board comparator tests must assert handler identity changes re-render the board shell, so the stable handler ref cannot become stale.
- Point-action tests must assert `useRoomPointActions()` keeps handlers callback-stable and narrows player dependencies to current color instead of the whole player object.
- Room screen source tests must assert `RoomBattleStage` passes a stable neutral-point handler into `Board`.
- Chat tests must assert `areChatBoxPropsEqual()` ignores clock-only player time changes and rerenders on chat content, chat-name metadata, or presentation changes; embedded-chat DOM tests must keep an unsent draft while its mounted tab panel is hidden and shown again.
- Room people tests must assert `areRoomPeopleListPropsEqual()` ignores clock-only player time changes and rerenders on member visibility metadata changes.
- Operation hint tests must assert `areOperationHintPropsEqual()` ignores clock-only player time changes and rerenders on action-relevant room changes.
- Action bar tests must assert `areActionBarPropsEqual()` ignores clock-only player time changes, rerenders on skill/scoring changes, and source-guards stable `RoomBattleStage` callbacks.
- Room screen source tests must assert memoized room widgets receive stable floating-layer callbacks.
- Room screen source tests must assert finished-room close countdown timing is local to `RoomHeader` / `RoomCloseCountdown`, not top-level `RoomScreen` state.
- Timed request toast tests must assert `timedRoomRequestEffectKey()` is stable across clock-only player time changes and changes when request deadlines or result-review acceptance changes.
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
- Broad theme/HUD tests should assert that the relevant scoped rule, polish layer, and semantic safety rules still exist, but should avoid keeping a second stale copy of feature-specific sizing values. Bright School mobile domain tests own `mobile.css`, `mobile/home-shell.css`, `mobile/commerce-warehouse.css`, `mobile/lists-settings.css`, and `mobile/room.css` import order so sub-entry splits remain stable.
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
expect(plaqueBlock).toContain('url("/assets/home/student-id-nameplate.webp")');
```

The feature-level test still owns the exact layout, while the broader guard confirms the themed selector and generated shell asset remain present.

### CSS Domain Entry Ownership

Large top-level CSS files should become import-only domain entries before they accumulate unrelated feature rules. The detailed layer contract lives in `css-architecture.md`; keep this file focused on test ownership and feature-specific quality rules. Current high-level ownership is: shared domain entries delegate concrete rules to matching folders under `src/styles/`; route-only entries such as `admin.css` and `room/tutorial-battle-screen.css` are imported by their lazy owner components; Bright School uses `base.css`, `gallery-polish.css`, `surface-contracts.css`, `component-repairs.css`, and `qa-guard.css`; and `mobile-adaptive.css` remains the final post-theme safety layer.

Route-only domains should not stay in `src/styles.css` just because they are top-level entries. `src/styles/admin.css` is imported by lazy `src/admin/AdminConsole.jsx`, and `src/styles/room/tutorial-battle-screen.css` is imported by lazy `src/tutorial/TutorialBattleScreen.jsx`; `src/styles/cssLayerInventory.js` records these in `CSS_LAZY_ROUTE_STYLE_ENTRIES`. Keep final cross-route safety rules global only when they intentionally run after themes/HUD, such as `src/styles/mobile-adaptive/admin-fullscreen.css`.

Required assertion points:

- `src/styles/styleContract.test.js` owns the allowed nested style directories and the `base.css` / `admin.css` / `lobby.css` / `room.css` / `room/players-timers-skills.css` / `room/board.css` / `room-terminal.css` / `modals.css` / `modals/replay-mode-resume.css` / `modals/terminal-system.css` / `mobile-modals.css` / `commerce-settings.css` / `commerce/gacha.css` / `commerce/social-profile.css` / `commerce/shop-settings.css` / `commerce/terminal-polish.css` / `responsive.css` / `mobile-home.css` / `mobile-room.css` / `mobile-room/base-shell-dock.css` / `hud-components.css` / `hud-components/hud-hardening.css` import order.
- `src/styles/styleContract.test.js` also owns the `mobile-adaptive.css` import order plus the nested `mobile-room-portrait.css`, `home-narrow-desktop.css`, `bright-school-overrides.css`, `bright-school-overrides/profile-house-records.css`, and `bright-school-portrait.css` import orders because these entries are the final safety layers after theme imports.
- `src/styles/themeContract.test.js` owns the Bright School base, gallery polish, surface contract, home, home student-id-card, commerce, modals, effects, room, mobile, mobile house/profile, mobile room, component repair, and quality guard import order.
- Feature tests that need concrete CSS, such as gacha modal coverage, should read the CSS import tree instead of asserting that rules live directly in the entry file.
- New top-level CSS domains should start as import-only entries with an explicit directory and a style contract test update.
- Route-only CSS entries must be removed from `src/styles.css` or shared domain entries, imported by their lazy owner component, recorded in `CSS_LAZY_ROUTE_STYLE_ENTRIES`, and covered by `src/styles/cssLayerInventory.test.js`.
- `src/styles/styleContract.test.js` enforces the general CSS architecture guard: any CSS file containing `@import` must stay import-only, and files at or above the 6000-byte guard threshold must be either split or kept within the known-debt byte baseline recorded in the test.

### UserIdentity Nameplate Background Contract

#### 1. Scope / Trigger

- Trigger: changing `src/shared/UserIdentity.jsx`, nameplate reward assets, `hud-components/user-identity/**`, or a surface that sizes equipped usernames.
- Achievement nameplates are fixed-ratio username skins shared by home, room, leaderboard, social, profile, watch, personalization, and result surfaces.

#### 2. Signatures

- `UserIdentity({ user, name, className = "", compact = false, showNameplate = true })` keeps its public props stable.
- Equipped asset payloads remain `{ id, imageUrl, name?, text? }` under `user.achievementEquipmentAssets.nameplate`; no effect-specific API field is required.
- An equipped image nameplate renders `data-nameplate-id`, `.user-identity-nameplate-background`, an `aria-hidden` `.user-identity-nameplate-effect`, and `.user-identity-name` inside `.user-identity-name-tag`.

#### 3. Contracts

- Generic image nameplates use the shared `96px x 25.6px` (`3.75:1`) slot and remain static. Scene-owned `--user-nameplate-scale` scales width, height, safe padding, and font together.
- Bespoke presentation is selected only by exact `data-nameplate-id`. Keep its shell and motion in asset-owned files under `hud-components/user-identity/`; do not add effect branches to every consumer or add a backend field for code-owned effects.
- Asset owners may replace base width, height, asymmetric safe padding, font size, and text color, but must continue deriving final dimensions from `--user-nameplate-scale`.
- Background, effect, and text have stable local stacking. Effect nodes are `aria-hidden`, `pointer-events: none`, and must not affect layout.
- Continuous motion changes only `transform` and `opacity`; the same asset-owned motion file must provide `prefers-reduced-motion` static fallback.
- Parent surfaces align the whole `UserIdentity`. They must not stretch the nameplate to parent width or introduce per-username font scaling. Legal usernames render in full; legacy overlong names use the existing ellipsis fallback.
- Nameplate PNGs remain alpha-trimmed and should use a stable `3.75:1` delivery canvas. Transparent padding may reserve safe glow bleed, but must be measured because it changes apparent art size. Use `node scripts/pngTrim.mjs <input.png> [output.png]` before final resampling.

#### 4. Validation & Error Matrix

- Missing `imageUrl` or `showNameplate={false}` -> render no nameplate layers or asset-ID hook.
- Image asset without a bespoke owner -> render the generic static `96px x 25.6px` fallback.
- Bespoke asset on phone/compact/room surfaces -> inherit the existing scene scale; do not add a parallel breakpoint-specific size system.
- Legacy overlong username -> ellipsis inside the text safe area; never overlap the embedded core, independent badge, or adjacent stats.
- Reduced-motion preference -> no running keyframe animation; retain a readable static highlight.

#### 5. Good / Base / Bad Cases

- Good: an exact asset-ID selector overrides base geometry and owns its effect while every consumer keeps rendering the same `UserIdentity` component.
- Base: an admin-created image-only nameplate needs no code and uses the static generic background layer.
- Bad: changing the shared base size to fit one decorated asset, branching on the asset ID in each page, or baking usernames into the raster.
- Bad: relying on visible overflow for core readability; protected home/mobile surfaces may clip the tag, so the essential shell and text must fit the fixed slot.

#### 6. Tests Required

- `src/shared/UserIdentity.test.jsx` asserts asset ID, background/effect/text layers, `aria-hidden`, ordinary asset fallback, title + independent badge coexistence, and no username-length font variable.
- `src/styles/hudComponents.test.js` asserts generic `96px x 25.6px`, bespoke geometry, pointer transparency, keyframe durations, and reduced-motion coverage.
- `src/home/HomeScreen.test.jsx` asserts the equipped built-in asset hook plus checked-in PNG dimensions and transparent corners.
- `src/styles/styleContract.test.js` and `src/styles/cssLayerInventory.test.js` own import order, file-size boundaries, motion registration, and measured debt baselines.
- Browser QA covers legal half-width/CJK names, a legacy overlong name, title + badge coexistence, ordinary fallback, compact scaling, and no horizontal overflow at desktop, narrow desktop, and portrait phone widths.

#### 7. Wrong vs Correct

Wrong:

```css
.user-identity.has-nameplate {
  --user-nameplate-base-width: 120px;
}
```

This changes every nameplate to accommodate one asset.

Correct:

```css
.user-identity[data-nameplate-id="reward-sigrika-spark-100-wins-nameplate"] {
  --user-nameplate-base-width: 120px;
  --user-nameplate-base-height: 32px;
  --user-nameplate-padding-left: calc(34px * var(--user-nameplate-scale));
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

- The mobile room shell stays fixed to `100dvh` with `overflow: hidden`; ordinary action/member panels must fit without page scrolling, and the board remains derived from viewport units.
- Player strips use a bounded custom property such as `--mobile-room-player-strip-height` and grid rows reference that property, so opponent/self cards cannot grow into the board.
- Portrait player strips should keep the avatar column fixed and large enough for readable art, give identity/capture metadata the flexible middle column, and keep the timer/skill column bounded with visible row gaps; shared mobile CSS, `mobile-adaptive.css`, and Bright School overrides must use the same player-info column contract and Bright School cards must remain flat without heavy card shadows. Mobile player metadata should keep a legal 8-half-width username on one line at the normal scene font size, with rank/rating tags on the right; the username and equipped title/badge/nameplate must never ellipsize, marquee, horizontally scroll, or shrink. Representative legacy overlong names may wrap with `overflow-wrap: anywhere`, and secondary tags must yield before the username is truncated. Rank/rating pills must vertically center their text with selector-specific CSS. The small color dot may be hidden because portrait color styling already carries side identity, and Bright School black portrait frames must use `#2b2b2b`.
- Normal room timers keep the shared `TimeBar` layout contract. Do not add tutorial-specific centering overrides to `.digital-timer`, `.timer-digits`, or `.timer-track`; shared room CSS, mobile room CSS, and Bright School overrides should preserve the existing grid alignment, baseline digit alignment, and track sizing for both normal games and tutorial games.
- Mobile replay/spectator controls use a seven-slot row in both portrait and landscape: first, minus five, previous, move count, next, plus five, and last. The move-count slot is icon-free, uses the same row height as the buttons, and centers its single-line semantic label horizontally and vertically. Record replay uses `current/max`; live spectator mode uses `实时 · N手`; spectator history uses `回看 current/max`. The last icon keeps `title` / `aria-label` text such as `回到实时` without rendering that copy visibly.
- Player info keeps the portrait/result badge column present across both rows (`"portrait meta time"` / `"portrait captures skill"`) and hides ordinary overflow inside the strip instead of spilling over the board. The outer card is passive; when viewpoint switching is available, only the portrait is a real `button` with `aria-pressed`, and interactive stat explanations are real buttons independent of viewpoint switching.
- The board stage keeps `aspect-ratio: 1`, is centered in the board viewport, and sizes from `--mobile-room-board-size`.
- Board stone visual jitter is mode-aware. Spark mode stones may use up to 1px deterministic offset, but standard 19-line stones must use a maximum 0.5px offset on both desktop and mobile; the logic should live in the board offset helper so all responsive layouts share the same values.
- The bottom dock keeps compact natural-height action/member content; operation hints inside `#mobile-room-panel-actions` must remain bounded so action controls stay reachable on 375px/393px portrait screens.
- Ordinary live rooms, spectator views, and record replays must not render a chat button, chat tab, chat panel, chat input, or client `chat:send` wiring. Backend chat events and stored room chat data may remain for compatibility, but `RoomScreen` must not expose a user-facing path to send or read them.
- Battle tutorials may opt into `showTutorialLog` as a separate readonly `剧情记录` surface because scripted NPC/player replies are teaching history rather than public chat. The tutorial record never renders a send input, uses compact message metadata, and is the only production `RoomBattleStage` path that composes `ChatBox`.
- On desktop, the player operation hint belongs in the right room column directly below the self player panel, replacing the former floating chat-control location. Do not leave a duplicate hint under the opponent/member column.
- `roomViewStatusFor()` remains the single mapping for replay control mode, following-live state, and active black/white viewpoint. Do not render its mode/viewpoint label in `RoomHeader`; viewpoint switching is already owned by the portrait buttons and the replay bar already exposes live/history progress.
- Mobile leaderboard rows should be compact cards rather than cramped tables. Use rank/avatar/player/score lanes, left-align the username/rank block, show rating as the primary right-side value, and use a right metrics lane with explicit win/loss/draw chips above a small win-rate stat. Give the metrics lane its own `record` and `rate` grid rows instead of stacking both elements in the same grid area, and make the pinned current-user row follow the same rhythm instead of becoming a large separate panel. When the mobile heading is hidden, the table grid must use `grid-template-rows: minmax(0, 1fr) auto` so the pinned row is auto-height; do not keep the desktop `minmax(220px, 1fr)` row because it creates an empty "我的排名" panel.
- Mobile replay lists are ordinary card flows, not leaderboard tables with a pinned current-user footer. When the mobile replay heading is hidden, the replay table must use `grid-auto-rows: auto`, `align-content: start`, and no explicit two-track `grid-template-rows`, so the first replay cards cannot overlap.
- Mobile menu buttons with short Chinese labels should keep icon and text on one line. Use a fixed icon column plus a `max-content` label column, and pair `white-space: nowrap` with `word-break: keep-all`; do not use a compressible `minmax(0, 1fr)` text column for two-character labels such as 留言, 设置, or 退出.
- Mobile modal controls with short Chinese labels, including settings tabs and match-mode status chips, should stay on one line with `white-space: nowrap`, `word-break: keep-all`, and enough fixed/minimum inline space for the full label. For match mode rules, render semantic line wrappers instead of relying on arbitrary text wrapping: line one is board size plus time, line two is komi/rules, and tests should assert the first line does not end with a separator dot. Match-mode option buttons must keep the status/count chip pinned to the far right edge of the button, not merely right-align the text inside the chip; use a stretched two-column grid plus `justify-self: end` and `margin-left: auto` on the chip.
- Mobile nested record dialogs, including the house character-record dialog, must be clamped to the viewport and scroll internally. Character record rows should use compact avatar/name plus total/win/loss/draw/win-rate stat columns; each stat column must stay on one line with `white-space: nowrap`, `word-break: keep-all`, tabular numbers, and right-aligned cell content so repeated rows read as an aligned table without vertical dividers.
- Mobile player-info explanations should support touch as well as desktop hover. Removal, overclock, and skill labels should open a tap-position tooltip on mobile/coarse pointers; the tooltip must use viewport-contained fixed width with normal wrapping and emergency word breaks, clamp within the viewport, flip below taps near the top edge, and cap height with internal scrolling so explanation text cannot overflow off-screen.
- Theme overrides, especially Bright School mobile rules with `!important`, must mirror the shared mobile room contract rather than redefining a conflicting layout.
- Components that intentionally opt out of paper/card chrome need explicit owner selectors in the owning domain or final safety layer. Do not add broad Bright School substring guards; target a real class such as `.asset-preload-panel`, repeat explicit classes only when needed to beat earlier `!important` rules, and add a `styleContract.test.js` assertion so later theme cleanup cannot reintroduce a solid middle panel background.
- Battle-room tags and buttons should stay visually flat on mobile. Header tags, timer chips, capture chips, player labels, menu buttons, dock tabs, action buttons, replay buttons, and chat controls should use border-only treatment without `box-shadow`, `filter: drop-shadow(...)`, or `text-shadow`. When a mobile room control is flat, selected/pressed feedback must not use translate/scale offsets; dock tabs such as `.mobile-tab-button` should change background/border color only so the tab bar does not jitter without a shadow model. Bright School control-shadow cleanup must use selectors specific enough to beat older `.app-shell... .captures span` / `.skill-chip` `!important` rules; a low-specificity `:where(...)` reset alone is not sufficient. Do not use a generic room `button` reset that catches `.point`; board point buttons and stone/current-move visuals are gameplay affordances and must stay separately controlled by board styles.
- Board point buttons must explicitly opt out of ordinary button chrome in both shared board CSS and Bright School board guards: keep `appearance: none`, transparent background/background-image, no border/shadow, `min-width/min-height: 0`, and `touch-action: none`. Otherwise 13x13 button surfaces can cover the SVG grid and make the board appear as a blank white square.
- Board grid SVGs also need dedicated survival rules. Keep `.board-lines` as an absolute `display: block` layer with `width/height: 100%`, `max-width/max-height: none`, visible stroke/opacity, and Bright School guard overrides so broad `svg { height: auto; max-width: 100%; }` media resets cannot collapse the grid while DOM effects such as row slash remain visible.
- DOM board effect layers must explicitly opt out of ordinary surface chrome through board-owned selectors. Keep `.board-row-effects` transparent, borderless, shadowless, and overflow-visible, and keep `.board-row-slash` responsible for only the slash artwork so paper panels cannot cover the grid and stones. If the effect uses `::before`/`::after` for highlights or cuts, restore those pseudo-elements with the same scoped specificity in a board or Bright School board guard file.
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
  --mobile-room-dock-panel-height: clamp(82px, 16dvh, 132px);
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
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

Static room layout tests must assert the absence of ordinary chat composition and `chat:send` client wiring, the readonly tutorial-record opt-in, desktop hint placement, compact portrait/landscape dock ceilings, and fixed `100dvh` overflow ownership in shared, Bright School, and final mobile safety owners.

Before finishing mobile battle UI work, run:

```bash
npm test -- src/room/RoomScreen.test.js src/room/ActionBar.test.js
```

For broader confidence after shared CSS changes, also run `npm test` and `npm run build`.

### Mobile room root-back contracts

#### 1. Scope / Trigger
- Trigger: changing `useRootBackExitGuard`, App/AppRoutes room routing, `RoomScreen` exit confirmation, replay exit, or spectator leave behavior.

#### 2. Signatures
- `App` owns the monotonic `roomBackRequestId` and increments it when root back occurs while `view === "room"` and a room snapshot is loaded.
- `AppRoutes` forwards that value as `RoomScreen.mobileBackRequestId`.
- `RoomScreen.requestExitConfirm()` remains the single owner for both the visible leave control and forwarded mobile root-back requests.

#### 3. Contracts
- A functional top overlay consumes mobile back before the room or app root handler.
- Replay and spectator room views call the existing `onBack` path immediately; their navigation plan clears/leaves the room as already defined by `planRoomBackNavigation()`.
- An unfinished player game opens the existing “是否认输并退出房间？” confirmation; confirmation sends `resign` and then runs `onBack`, while cancellation keeps the room mounted.
- Login, preload, home, and admin root back continue to show the application exit confirmation.
- Do not duplicate role/phase/replay branching in `App`; forward an intent to the room owner instead.

#### 4. Validation & Error Matrix
- Room view with no restored room snapshot -> keep the app-level exit guard behavior until recovery completes.
- Replay room -> one back request returns home without a resign confirmation.
- Live spectator -> one back request leaves the watched room and returns home.
- Active player before `finished` -> show resign-and-exit confirmation without navigating immediately.
- Finished player review -> return home directly through the existing room exit path.

#### 5. Good/Base/Bad Cases
- Good: App increments a request id and `RoomScreen` responds only when the id changes.
- Base: clicking the room leave button still calls the same `requestExitConfirm()` callback.
- Bad: root back in every view calls `setShowExitConfirm(true)`, because this replaces room semantics with “退出游戏”.
- Bad: App reimplements `role === "player"` and phase checks separately from `RoomScreen`.

#### 6. Tests Required
- `src/app/modalDismissal.test.js` asserts room root back increments and forwards the request id while non-room views retain the app exit modal.
- `src/room/RoomScreen.test.js` asserts request-id changes invoke `requestExitConfirm` and keep the resign confirmation copy.
- `src/app/roomNavigation.test.js` covers replay, spectator, finished review, and active-player navigation plans.

#### 7. Wrong vs Correct

Wrong:

```jsx
useRootBackExitGuard({ onRequestExit: () => setShowExitConfirm(true) });
```

Correct:

```jsx
useRootBackExitGuard({ onRequestExit: requestRootBack });
// requestRootBack increments roomBackRequestId for a loaded room;
// RoomScreen invokes its existing requestExitConfirm when that id changes.
```

### Room control layout contracts

When changing desktop room headers, replay bars, or player side panels, update static layout tests in `src/room/RoomScreen.test.js` to lock shared room UI contracts.

Required assertion points:

- Desktop room header controls should use a grid or equivalent right-aligned layout so message/settings/move/coordinate buttons stay grouped against the room-exit action instead of drifting toward the center.
- Room exit actions should use the shared light-blue treatment across desktop and mobile; theme layers that reset button backgrounds must mirror that treatment.
- Do not duplicate room exit actions beside desktop chat when the header or replay/action bar already provides an exit path.
- Replay bars in record and spectator modes share the same seven controls: first, minus five, previous, centered icon-free move count, next, plus five, and last. Five-move controls must clamp to `0..replayMax` and disable at the corresponding endpoint; test both modes in `src/room/ActionBar.test.js`.
- The last replay control remains a pure icon button. Spectator history uses `title="回到实时"` and `aria-label="回到实时"`, but must not add visible copy that changes the grid width.
- `RoomHeader` must not render replay/live mode or viewpoint subtitle copy. Keep the room code, participants, move count, close countdown, utility controls, and exit action unchanged.
- Desktop room floating panels, including chat popovers, skill detail panels, hover/click stat tooltips, and room member action popovers, must use the shared `--room-floating-z` contract instead of fixed cross-surface z-index values. Opening, hovering, focusing, or clicking one of these panels should bring that surface to the front.
- `ROOM_FLOATING_LAYER_BASE_Z` must equal the highest ordinary room fallback (`140`), and only the latest interacted room surface receives `ROOM_FLOATING_LAYER_BASE_Z + 1` (`141`). Replacing the active-layer map instead of incrementing an unbounded counter makes the first promotion greater than every untouched chat/skill/member fallback and keeps every later promotion below the shared modal-backdrop layer (`160`). A lower base is invalid because untouched surfaces retain their larger CSS fallback; an unbounded counter is invalid because repeated interactions can eventually climb above modal backdrops.
- Mobile room floating panels, including the folded room menu, chat widget, chat popover, and any dock that contains an open chat popover, must mirror the `--room-floating-z` contract in base CSS, Bright School overrides, and the final `mobile-adaptive.css` safety layer. Modal-backdrop suppressors may lower those room controls while a real modal is open, but ordinary room panels must not cover the most recently opened floating surface.
- Mobile home folded menu surfaces use `--home-floating-z` on `.home-top-strip`, `.home-mobile-menu`, and `.home-mobile-menu-panel` so the menu stays above the home main panel in both base and Bright School portrait rules.
- Shared modal backdrops must stack above room `--room-floating-z` surfaces, including the member popover fallback of `140`, so request and confirmation modals dim skill chips, chat controls, and member popovers together.
- Timed room request toasts for draw, counting, and result-confirmation flows must render through a `document.body` portal in browser environments and keep a non-document fallback for static rendering tests. Do not leave these fixed-position request toasts as children of `.mobile-room-screen`, because mobile board sizing uses viewport-derived grid constraints and the extra child can reintroduce visible board shifts.
- Disconnected room players should use a portrait-background state such as `.disconnected-portrait`, not an overlaid text badge. Keep the cue on the portrait wrapper so desktop and mobile player strips stay the same size and the board/action layout is not affected by connection-state copy.
- Mobile room portrait strips must not show character-chain badges. Duplicate-chain data can stay in the user payload, but `CharacterChainBadge` should render nothing unless the product explicitly re-enables the badge.
- Keep player cards and skill wrappers overflow-visible so dynamically raised skill panels can escape the side panel without clipping.
- Room member action popovers must keep their fixed-position anchor variables and use `--room-floating-z` in both base CSS and Bright School theme overrides. Render member actions and their follow-up profile/confirmation overlays through a portal into the nearest `.app-shell` (with a `document.body` fallback), so mobile dock scrolling and `overflow: hidden` cannot clip them; click-away logic must treat both the member list and the portaled action surface as inside targets.
- `src/room/RoomPeopleList.dom.test.jsx` must render the list inside a clipped mobile dock, open a member row, assert the action surface belongs to `.app-shell` rather than the dock, keep it open for pointer events inside the portal, and close it for an outside pointer event.
- Capture/removal/overclock chips should share stable heights so skill-only counters do not look shorter or taller than captures.
- Hover/focus optimizations must preserve the visible transform/filter timing. If a home or utility entry already animates `transform`, prefer promoting that existing surface with `will-change: transform` and keep reduced-motion rules beside the owning selector instead of replacing the motion with a different effect.

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

### Mobile profile replay scroll containment contract

#### 1. Scope / Trigger
- Trigger: any change to `UserProfileCard`, `ReplayList`, `.profile-replay-dialog`, `.profile-replay-list-scroll`, `.replay-table`, mobile replay card CSS, or Bright School mobile replay overrides.

#### 2. Signatures
- `UserProfileCard` renders the profile replay modal as `.profile-replay-dialog`.
- `.profile-replay-list-scroll` is the only vertical scroll owner for profile/detail replay history on phones.
- `.profile-replay-dialog .replay-table` is content inside that scroll owner.
- `useReplayPagination({ enabled, endpoint, token })` owns 50-row page state for both resume and profile replay dialogs.

#### 3. Contracts
- Keep `.profile-replay-dialog` as a bounded fixed-height/mobile shell with a fixed title/close area and a `minmax(0, 1fr)` replay-list region.
- Keep `.profile-replay-list-scroll` scrollable with `overflow-y: auto`, `min-height: 0`, and touch momentum support.
- Keep `.profile-replay-dialog .replay-table` non-scrollable with `overflow: visible`, not only `overflow-y: visible`. CSS computes `overflow-y: visible` back to `auto` when the other axis is `hidden`/`auto`, which creates a dead inner scroll container that can intercept touch and wheel chaining.
- Bright School final mobile overrides must repeat the same `overflow: visible !important` and `overscroll-behavior: auto !important` table contract after any generic `.replay-table` mobile scroll rules.
- House nested replay dialogs may keep their own table scroll/card contract; do not use a broad `.replay-table` rule to change profile replay scroll ownership.
- The owning scroll element must forward `onScroll` to the pagination hook. Reaching the final 48px loads `nextCursor`; a null cursor renders the completed state and makes no further request.

#### 4. Validation & Error Matrix
- Profile replay history has more rows than the visible mobile list -> swiping on row text or buttons scrolls `.profile-replay-list-scroll`.
- `.profile-replay-dialog .replay-table` computes to `overflow-y: auto` with no scroll range -> invalid, because it can swallow scroll gestures before the outer list receives them.
- Bright School portrait active -> same scroll owner contract as base mobile.
- First page shorter than the full history -> scrolling to the bottom appends older records without replacing or duplicating the first page.

#### 5. Good/Base/Bad Cases
- Good: `.profile-replay-dialog .replay-table { overflow: visible; overscroll-behavior: auto; }`
- Base: `.profile-replay-list-scroll` owns the scrollbar and scrollTop changes while `.replay-table` remains at scrollTop `0`.
- Bad: `.profile-replay-dialog .replay-table { overflow-x: hidden; overflow-y: visible; }`
- Bad: a generic `.replay-table { overflow-y: auto; overscroll-behavior: contain; }` rule that also matches profile replay after the profile-specific override.

#### 6. Tests Required
- `src/modals/ReplayList.test.jsx` should assert the final mobile CSS contains the profile replay table `overflow: visible` contract for both base and Bright School final layers.
- `src/modals/useReplayPagination.dom.test.jsx` should assert initial loading, cursor URL encoding, bottom detection, append semantics, and terminal `nextCursor = null`.
- For browser-level regression checks, render a mobile Bright School profile replay fixture and verify wheel/touch scrolling changes `.profile-replay-list-scroll.scrollTop` while `.profile-replay-dialog .replay-table.scrollTop` stays `0`.

#### 7. Wrong vs Correct

Wrong:

```css
.profile-replay-dialog .replay-table {
  overflow-x: hidden;
  overflow-y: visible;
}
```

Correct:

```css
.profile-replay-dialog .profile-replay-list-scroll {
  overflow-y: auto;
}

.profile-replay-dialog .replay-table {
  overflow: visible;
  overscroll-behavior: auto;
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
- Character-record rows should not collapse total/win/loss/draw into one combined text cell. Use separate total, win, loss, draw, and win-rate columns, and right-align those stat cells in desktop, mobile, and Bright School override layers.
- Mobile Bright School rules and the final `mobile-adaptive.css` guard should set the record wrapper to a two-row grid, hide the separator, and keep each line `white-space: nowrap` with `word-break: keep-all`.
- Card-level selectors such as `.profile-resume-stats > span` must target direct stat cards only; do not use `.profile-resume-stats span` when nested record-line spans exist.
- Recent rank result markers must render below the record/rating/rank stat row, not inside one stat card. On mobile profile and resume modals, the ten-result marker set must stay on one marker row; use a ten-column grid plus `clamp()` marker/font sizing instead of `flex-wrap` so wins/losses shrink before wrapping. Empty-state text such as `暂无` must span the marker grid, stay centered, and use a wider responsive chip than a single win/loss marker so the text cannot overflow its border.
- In resume/profile modals, `.profile-grid.top-stats-bar` is the outer wrapper for stat cards plus recent-result markers and must stay `grid-template-columns: 1fr` in base, mobile, Bright School mobile, and final `mobile-adaptive.css` layers. On desktop resume modals, keep this wrapper `overflow: visible` so rating/rank `.stat-tip` popovers can escape the stat row; the embedded `.resume-character-records` section owns its own internal scroll/clip behavior. The inner `.profile-resume-stats` grid must keep all three stat cards on one row with `repeat(3, minmax(0, 1fr))`; on mobile, split only the record card value into total games and win/loss/draw lines.
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
- Bright School player plaque names must stay inside the middle identity column. Equipped nameplates use the shared fixed `3.75:1` slot and scene-owned `--user-nameplate-scale`; do not use parent-width stretching, visible overflow, or per-username `--user-identity-fit-font-size` scaling if that lets the username cover `.plaque-stats`.
- Generated Bright School home player plaque art must remain a shell/background asset. Avatar art, `UserIdentity`, username text, mode icons, ranks, and labels stay rendered by React DOM/CSS rather than baked into the raster image.
- The generated plaque shell background must draw from `border-box` rather than the default padding box so the full outer frame, holes, sticker, and stats panel art cover the entire clickable card.
- The generated plaque shell must be the only `.home-player-plaque.tactical-id-card` background layer. Do not keep the old pink/green gradient fallback or any browser/theme button background, border, radius, outline, or `box-shadow` frame on the card body; the card body may use the shared home-image `filter: drop-shadow(5px 6px 0 rgba(61, 43, 37, 0.3))` treatment and transform-only hover/focus rotation, with reduced-motion coverage.
- When generated plaque art includes the portrait and stats panel frames, `.plaque-avatar` and `.plaque-stats` must stay transparent content layers with no independent background, border, or box-shadow; otherwise the generated shell gets duplicated by legacy inner cards.
- `.plaque-avatar` must anchor to the generated shell's portrait-frame center through shared center/size variables, and portrait art inside that box must stay horizontally and vertically centered with a stable grid/contain contract in both base theme CSS and final responsive safety layers.
- Legacy `.home-player-row.tactical-id-row::before` / `::after` paperclip pseudo-elements must stay disabled (`content: none` and `display: none`) when the generated shell is active; do not reintroduce a separate clamp layer over the generated art.
- Later Bright School layers such as `modals.css`, `mobile.css`, and the final `mobile-adaptive.css` safety pass must not redefine `.home-player-plaque.tactical-id-card` with a new background that covers the generated shell.
- When generated plaque art changes, feature tests should assert the WebP/PNG asset URLs from the final expanded theme CSS and preserve the avatar/name/stats grid contract on both desktop and mobile layouts.
- Compact desktop is 1024px-1180px and should switch the home stage to named CSS grid areas (`player`, `manual`, `utility`, `match`) while staying inside the viewport.
- Micro desktop is 701px-1023px. It should use a controlled minimum home stage width, currently `960px`, with horizontal scroll localized to `.home-main-panel`; do not shrink core entries until their contents become unreadable.
- The final `mobile-adaptive/home-narrow-desktop.css` layer owns compact and micro desktop safety after theme overrides. It must reset player/manual/match/utility regions to `position: static` and remove decorative transforms that can create invisible hit boxes or overlaps.
- Footer chrome should be fixed only on wide and tall desktop windows. Compact, micro, and low-height desktop windows should keep the footer in normal flow so it cannot cover core entries.
- Home plaque stats must be in a shrinkable grid column with `min-width: 0`; avoid fixed pixel stats columns on mobile because long usernames need the remaining space.
- Phone portrait must remain a usable home layout, not an orientation gate. Below the phone breakpoint, keep `.home-main-panel` visible and stack the stage as `player`, `match`, `manual`, `utility`; do not render or reveal `.home-orientation-guard`.
- Bright School home utility entries may use image-only hand-drawn button art when the image itself contains the icon and title. In that mode, keep native `<button>` semantics and `aria-label`s, render the `<img>` as decorative `.utility-entry-art`, and keep DOM icon/title fallbacks visually hidden instead of visible. Non-image utility entries should still keep recognisable icon and main `<strong>` title content visible so the 2x3 mobile toolbox preserves clear touch targets.
- Bright School image-only home entries and utility buttons rely on `filter: drop-shadow(...)` for the paper depth. Keep `.home-image-entry`, `.match-image-entry`, `.house-manual-entry`, `.home-utility-grid`, and `.utility-entry` overflow-visible on desktop and mobile; `.utility-entry-art` must reserve right/bottom transparent bleed such as `padding: 0 6px 6px 0` so the shadow is not clipped by either the replaced image box or a final mobile safety rule. For the six desktop utility buttons, deterministic tone-scoped `--utility-tilt` values may vary the resting art angle, but `.utility-entry` must remain `transform: none`; apply rest/hover/active transforms only to `.utility-entry-art` and use fixed `grid-auto-rows`. Each tone must also keep a same-direction `--utility-hover-tilt` around `3.8deg` to `4.4deg`, with the shared hover/focus `scale(1.015)` compensation; do not force negative resting tilts across zero to a common positive endpoint because the long raster labels appear to shrink during that path. This prevents transformed overflow from changing the main-panel/background height while preserving stable hit boxes; mobile keeps its existing 2x3 sizing and final interaction overrides.
- Bright School hard-shadow cards and rows inside scroll/clipping owners must reserve trailing and bottom bleed on the list/layout owner instead of weakening the existing shadow. Check both desktop and mobile owner CSS for house manual `.character-list`, leaderboard `.leaderboard-list` plus `.leaderboard-current`, warehouse `.warehouse-grid`, shop `.shop-layout`, and friends `.friends-list` before calling a shadow-clipping fix complete.

Wrong:

```css
.home-screen {
  min-width: 1180px;
}

@media (max-width: 760px) and (orientation: portrait) {
  .home-main-panel {
    display: none;
  }

  .home-orientation-guard {
    display: grid;
  }
}
```

This preserves a desktop artboard inside a small browser and causes player plaques, buttons, and manual art to overlap.

Correct:

```css
.home-screen,
.home-grid-featured {
  min-width: 0;
}

@media (max-width: 760px) and (orientation: portrait) {
  .home-main-panel {
    display: grid;
  }

  .home-stage {
    grid-template-areas:
      "player"
      "match"
      "manual"
      "utility";
  }
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

### Scenario: Zahira shop offer-card density and corner badges

#### 1. Scope / Trigger
- Trigger: changing `ShopItemCard`, `ShopProductStage`, `shopLayout.js`, shop corner badges, or desktop/mobile offer spacing.

#### 2. Signatures
- `getShopItemCategoryLabel(item)` returns the player-facing `部员 / 道具 / 棋子 / 音乐` label.
- `getShopItemQuantityBadge(item)` returns `{ text, ariaLabel }` for eligible consumable badges or `null`.
- `layoutShopCards({ width, height, count, mobile, seed })` returns collision-free card rectangles and a uniform scale.
- `ShopItemCard` renders `.shop-item-detail-trigger` as a native button for image/name/price and keeps `.primary-action` as its sibling purchase button.

#### 3. Contracts
- Every real product card renders a non-interactive category badge in the upper-left corner.
- The upper-right badge is consumable-only: finite stock above one shows remaining quantity, unlimited stock shows `∞`, and `stockQuantity === 1` or non-consumables render no quantity badge.
- Desktop and mobile use the same count-aware topology: five offers use 2+3, four use 2+2, three use 2+1, and one or two stay centered on one row.
- Mobile mode is selected from `window.matchMedia("(max-width: 768px)")`, not product-stage width. The desktop product lane can itself be narrower than 768px.
- Desktop placement confines seeded jitter to balanced row cells and reserves at least 28px before rotation/float safety; it must never shuffle four offers into 1+3 or three offers into arbitrary free placement.
- Final mobile shop CSS must clear the shared modal shell's padding/gap, give header/body the full paper width, and never use negative-margin width compensation. Mobile horizontal gaps stay at 4–5px; vertical geometry reserves the hard shadow while preserving roughly the same visible clearance, and the whole card still scales together.
- Final mobile card CSS must explicitly clear portrait-wide `max-width: 100%` from `.shop-card-scale`, `.shop-card-rotation`, and `.shop-card-float`, and must beat legacy `.shop-item` height/min-height rules with a `.shop-window`-scoped owner selector. Otherwise the child width is scaled twice while the legacy card height overflows the algorithmic slot.
- The offer shell and rendered card share `--shop-card-width` / `--shop-card-height`; the detail trigger owns enlarged media/name/price rows and the purchase action owns a separate fixed bottom row. Do not make the whole article a pseudo-button containing the purchase button.
- The final mobile card owner must restore a full-width `minmax(0, 1fr)` column with stretched grid content, stretch every purchase action to the full card content width, and center `.shop-card-meta-price-only .shop-price` itself; button `width: 100%` is insufficient when a legacy `justify-content: center` rule leaves the grid column shrink-wrapped, while centering only the metadata parent still lets legacy item-category rules right-align the price child.
- The 4–6px seeded float value is the mobile total travel. Desktop may multiply it to an 8–12px total travel inside the transform-only float layer, while mobile resets the effective travel and reduced-motion continues to disable continuous floating.
- Bright School background depth belongs to `.shop-layout.shop-window-body`, not the outer modal or card layers. Keep the pale-blue display wall, mint reception wall, and warm counter as static CSS layers: use low-frequency translucent crayon strokes plus irregular `clip-path` edges, never runtime SVG/noise filters, a repeated diagonal-stripe texture, continuous decorative motion, or a new raster dependency. Desktop keeps the display-wall edge around the 68% product-lane boundary; final mobile overrides the display-wall polygon to a slightly uneven 56% horizontal edge matching the measured product-stage bottom. Both pseudo-elements stay pointer-transparent at `z-index: 0`, below the existing product, mascot, bubble, and wallet layers.

#### 4. Validation & Error Matrix
- Unknown category -> category badge falls back to `商品`.
- Unlimited item (`stockQuantity < 0`) -> `∞` with accessible name `不限量`.
- Limit-one item -> no quantity badge.
- Three items in either layout family -> two top placements plus one centered lower placement.
- Four desktop items -> two balanced rows of two; five desktop items -> two top plus three bottom.
- Desktop viewport with a sub-768px product lane -> still uses the desktop card base and spacing algorithm.
- Portrait mobile with four offers -> computed `.shop-item` bounds remain inside the corresponding placement plus rotation/float/shadow bleed; old minimum heights cannot create row overlap.
- 375x600 with five offers -> the bottom purchase controls remain above the product-stage clip boundary.
- Portrait mobile background -> the display-wall boundary equals the product-stage bottom; the bubble and wallet begin in the reception wall, while the counter remains behind Zahira and does not create horizontal overflow.

#### 5. Good/Base/Bad Cases
- Good: viewport media query selects the layout family while measured stage dimensions size cards inside the shared count-aware topology.
- Base: one or two items remain centered on a single row while desktop cards keep only bounded slot jitter.
- Bad: `size.width <= 760` selects mobile mode, because the normal desktop stage is commonly about 744px wide.
- Bad: a generic mobile modal shell adds padding/gap back to `.shop-window`, or a `width: calc(100% + ...)` plus negative margin attempts to compensate for the lost card width.
- Bad: repeating `不限量` or remaining stock in the card body after the corner badge is present.
- Bad: testing only `layoutShopCards()` rectangles while generic/theme CSS changes the final `.shop-item` width or height.
- Bad: `.shop-item[role="button"]` with a nested purchase `<button>`.

#### 6. Tests Required
- `src/modals/ShopModal.test.js` covers category labels, finite/unlimited/limit-one quantity badges, desktop/mobile 2+3 / 2+2 / 2+1 geometry, mobile card width and visible gap safety, desktop separation, viewport-mode selection, and final CSS owner rules.
- CSS import and size contracts must cover the shared, Bright School, final-mobile window, final card-layout isolation, compact-height, and badge owner files. The final `.shop-window` card selector must occur after the legacy portrait selector in the expanded mobile entry.
- Browser QA must inspect real `.shop-item` rectangles, not only `.shop-card-position`, at 375x812 and 375x600 for three, four, and five offers.
- Background QA must inspect both the rendered composition and computed boundary coordinates at 1440x900 and 375x812; static color-string assertions alone cannot prove that the desktop horizontal split or mobile vertical split aligns with content.

#### 7. Wrong vs Correct

Wrong:

```js
const mobile = stageWidth <= 760;
```

Correct:

```js
const mobile = window.matchMedia("(max-width: 768px)").matches;
const placements = layoutShopCards({ width: stageWidth, height: stageHeight, count, mobile });
```

Wrong:

```jsx
<article role="button" tabIndex={0}>
  <button>购买</button>
</article>
```

Correct:

```jsx
<article className="shop-item">
  <button className="shop-item-detail-trigger">商品图、名称与价格</button>
  <button className="primary-action">购买</button>
</article>
```

### Scenario: Shared Modal Dialog and Lint Boundary

#### 1. Scope / Trigger
- Trigger: adding or changing a modal shell, nested picker, close behavior, keyboard navigation, focus management, or the repository lint baseline.

#### 2. Signatures
- Shared shell: `ModalDialog({ as = "section", labelledBy, ariaLabel, onClose, className, children, ...props })` from `src/modals/modalComponents.jsx`.
- Quality command: `npm run lint`; the full repository gate starts with lint through `npm run check`.

#### 3. Contracts
- Interactive modal surfaces use `ModalDialog` with `role="dialog"`, `aria-modal="true"`, and either `aria-labelledby` or `aria-label`.
- On mount, focus enters the first focusable control (or the dialog); Tab and Shift+Tab remain inside; Escape calls the closest dialog's `onClose`; unmount restores the prior focused element.
- Nested dialogs handle Escape locally and prevent the global dismissal layer from closing the parent in the same event.
- Close and icon-only controls expose an accessible name.
- ESLint uses the flat configuration, React Hooks checks, JSX variable checks, and `jsx-a11y`; intentional backdrop click handling is documented through scoped rule configuration rather than disabling lint wholesale.

#### 4. Validation & Error Matrix
- Missing `aria-labelledby` and `aria-label` -> accessibility lint/review failure.
- Escape in a nested picker -> close only the picker.
- Tab from the last focusable item -> wrap to the first; Shift+Tab from the first -> wrap to the last.
- Modal closes -> restore focus when the opener is still connected.
- Hooks dependency mismatch or undefined JSX identifier -> lint failure.

#### 5. Good/Base/Bad Cases
- Good: a leaderboard modal passes its title id to `labelledBy` and its close button has `aria-label="关闭"`.
- Base: a non-interactive visual wrapper remains a normal element and does not pretend to be a dialog.
- Bad: a clickable `<div>` modal shell with no keyboard focus boundary.
- Bad: adding a second document-level Escape handler inside each modal.

#### 6. Tests Required
- `src/modals/modalComponents.dom.test.jsx` asserts initial focus, forward/backward wrapping, Escape close, and opener focus restoration in jsdom.
- Migrated modal tests assert the shared dialog shell and accessible title/controls.
- `npm run lint`, `npm test`, and `npm run build` must pass before handoff.

#### 7. Wrong vs Correct

Wrong:

```jsx
<div className="modal" onClick={(event) => event.stopPropagation()}>{children}</div>
```

Correct:

```jsx
<ModalDialog className="modal" labelledBy="modal-title" onClose={onClose}>
  <h2 id="modal-title">Title</h2>
  {children}
</ModalDialog>
```
