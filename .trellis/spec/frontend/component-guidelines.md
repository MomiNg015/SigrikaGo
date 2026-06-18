# Component Guidelines

> How components are built in this project.

---

## Overview

<!--
Document your project's component conventions here.

Questions to answer:
- What component patterns do you use?
- How are props defined?
- How do you handle composition?
- What accessibility standards apply?
-->

(To be filled by the team)

---

## Component Structure

<!-- Standard structure of a component file -->

(To be filled by the team)

---

## Props Conventions

<!-- How props should be defined and typed -->

### Scenario: Game Mode UI Contracts

#### 1. Scope / Trigger
- Trigger: any component that starts matchmaking, renders a room, shows leaderboard/watch/history data, or displays duel requests.
- Mode UI is a shared product contract across desktop and mobile, so components must not hard-code mode copy or ordering locally.

#### 2. Signatures
- Import mode facts from `src/shared/gameModes.js`.
- UI mode ids are `spark`, `standard`, and `gomoku`.
- Mode option order must use `modeOrderedEntries()` so `spark` appears before `standard`, then `gomoku` appears after the Go modes.
- Room controls receive `game.skillEnabled !== false` or equivalent normalized mode state.
- Board components receive `game.size` and expose it as `--size` on the shared board wrapper so intersections, labels, star points, and click targets use one board-size source.

#### 3. Contracts
- Home match entry opens a mode picker before emitting `match:join`; it must render every mode returned by `modeOrderedEntries()`.
- Duel requests open the same mode picker before emitting `duel:request`; incoming request UI must show the selected mode title and rules text.
- Mode tabs are required for leaderboard, watch list, profile/detail, and record/history views. These tabs must use each mode's `shortTitle`, stay in one non-wrapping row, and allocate the three current modes across one line.
- Home player plaques render compact mode stat rows from `modeOrderedEntries()`: spark rank/rating first, standard rank/rating second, gomoku rank/rating third. Do not collapse them back into a single global rank/rating pair, and do not show recent-result markers on the plaque.
- No-skill room UI must omit skill action buttons, both player skill labels, skill names, removal labels, and overclock labels. Gomoku additionally hides Go-only pass/counting/dead-stone controls and capture/removal/overclock info chips.
- Standard scoring copy must omit overclock/skill-cost descriptions and use black komi `3.75`.
- Coordinate labels must grid with `repeat(var(--size), minmax(0, 1fr))`; do not leave coordinate rows or columns hard-coded to 13 tracks.

#### 4. Validation & Error Matrix
- Missing `game.mode` -> render as `spark`.
- Missing `game.skillEnabled` -> assume skills enabled for legacy rooms.
- `standard` or `gomoku` with accidental skill state -> UI must still hide skill controls when `skillEnabled === false`.
- Standard board actions on points such as `18,18` must be accepted by the backend because point validation uses the room game's size, not the legacy 13-line default.
- Mobile mode controls -> keep 44px-plus touch targets; mode tabs must not wrap Chinese labels, and tab surfaces should show `五子棋` instead of the longer Gomoku entry copy.

#### 5. Good/Base/Bad Cases
- Good: `ActionBar` receives `skillEnabled={displayRoom.game.skillEnabled !== false}` and conditionally renders the skill button.
- Base: old replay snapshots with no mode continue through spark defaults.
- Bad: checking only `mode === "standard"` in one component while another component uses a separate hard-coded board size or komi.
- Bad: rendering a 19-line board while `.coord-row` still uses `repeat(13, 1fr)`, which makes labels drift away from intersections.

#### 6. Tests Required
- Home mode picker renders every shared mode and per-mode waiting count.
- Match/join socket payload includes selected mode.
- Standard room state renders 19-line board star points and no skill UI; gomoku room state renders the 13-line board with the spark star points, no skill UI, and no Go-only controls.
- Standard room accepts moves at the 19-line edge, gomoku rejects pass/skill actions, and Board CSS tests assert coordinate rows/columns use `var(--size)`.
- Leaderboard/watch/profile-detail/history fetches or filters by selected mode and render three one-line tabs with short labels.
- Home plaque tests assert `plaque-mode-stat-spark`, `plaque-mode-stat-standard`, and `plaque-mode-stat-gomoku` render with mode-specific ratings and stored ranks, while recent result markers stay limited to profile/history detail surfaces.
- Friend duel request payload and incoming banner include mode.

#### 7. Wrong vs Correct

Wrong:

```jsx
<button onClick={startMatch}>开始匹配</button>
```

Correct:

```jsx
{modeOrderedEntries().map(([mode, config]) => (
  <button key={mode} onClick={() => startMatch(mode)}>
    <span>{config.title}</span>
    <small>{config.rulesText}</small>
  </button>
))}
```

### Scenario: Board Skill Presentation Contract

#### 1. Scope / Trigger
- Trigger: any change to active skill preview payloads, room board rendering, skill banners, or board animation layers.
- The board skill presentation spans backend room snapshots, shared timing constants, React board markup, PixiJS canvas effects, ambient board effects, and SFX timing.

#### 2. Signatures
- `game.pendingSkill`: `{ id, characterId, skillName, effectType, targetId, affectedPointIds, markedPointIds, removed, removedByColor, resolvesAt, bannerDurationMs, boardEffectDurationMs }`.
- `SKILL_EFFECT_CATALOG`: shared `effectType` metadata in `src/shared/skillEffectCatalog.js`, including admin labels, default target rules, active/passive classification, board-effect availability, and sound cue timing.
- `BoardSkillEffects`: receives `boardSize={game.size}`, `pendingSkill={game.pendingSkill}`, and optional `audioSettings`.
- `schedulePixiPrewarm({ enabled })` and `loadPixiModule()` live in `src/room/pixiPrewarm.js`; both prewarm and live board effects must share the same Pixi import promise.
- `BOARD_SKILL_EFFECT_RENDERERS` and `playRegisteredBoardSkillEffect()` live in `src/room/boardSkillEffectRegistry.js`; concrete Pixi board animations must register by `effectType` there instead of growing `BoardSkillEffects.jsx`.
- DOM/CSS-only board visuals such as QiuYuan `row-slash` must keep `SKILL_EFFECT_CATALOG[effectType].boardEffect === false`; `BoardSkillEffects` must return `null` for those active previews so no full-board overlay layer or Pixi canvas can cover the grid. Their animation belongs in the dedicated DOM/CSS layer, for example `BoardRowSlashOverlay` plus the `row-slash-strike` keyframes.
- `game.rowEffects`: DOM/CSS row markers shaped as `{ effectType: "row-slash", owner, clearAfterColor, y, id }`; `clearAfterColor` is the color whose next action clears the marker.
- Lynae `spray-stone` history entries carry `randomTargetId`, `transformed`, `immediateRemovals`, and `cleanupRemovals`; replay reconstruction must use the recorded random target instead of calling the live random selection path again.
- ChangLi `double-move` placements persist on board points as `point.skillEffect = "double-move-stone"` plus `point.skillEffectOwner = color`; `Board` renders the class on the point so the stone can carry a persistent DOM/CSS flame halo without creating a full-board effect layer.
- `--board-wood-texture`: shared `.board-wrap` surface background; late theme guard layers must reference the variable instead of duplicating independent board texture stacks.
- `boardPointCenter()` and `pointCenterForHost()` live in `src/room/boardSkillEffectGeometry.js` so component tests and animation renderers share one board-size-aware coordinate contract.
- `BoardAmbientEffects`: receives derived passive state such as active Nabomo color illusion fog and renders non-interactive ongoing board ambience.
- `scheduleBoardSkillEffectSounds({ pendingSkill, durationMs, reducedMotion, audioSettings })` and `clearBoardSkillEffectSoundTimers(timerIds)` live in `src/room/boardSkillEffectSoundScheduler.js`; the React host should call these helpers instead of manually mapping cue timers.
- `playSkillEffectSound(effectType, cue, audioSettings)`: presentation-only SFX helper for `start` and `impact` animation cues.
- `boardPointCenter(pointId, { boardSize, width, height })`: maps a board point id to a pixel center in the current board viewport.

#### 3. Contracts
- `Board` keeps DOM/SVG as the interaction source of truth; PixiJS is presentation-only.
- The effects canvas and ambient layers must use `pointer-events: none` and must not replace point buttons, scoring marks, move numbers, coordinates, or skill targeting classes.
- Board effects start after `bannerDurationMs`, not when the banner first appears.
- Skill-enabled boards may schedule idle Pixi prewarm after the board mounts, but this prewarm must not block board rendering, preload screens, room entry, or standard no-skill rooms.
- Aemeath `hidden-hand` is a full-board effect: green electronic data streams move from the board edge toward the center, flash with white light, then dissipate outward/away without depending on a point-local impact.
- Nabomo `color-illusion-passive` has ongoing low-opacity black/gray cloud ambience while any color illusion passive is active; render it as separate feathered cloud shapes, not as a full rectangular board tint, and keep stones/intersections readable.
- Board SFX must be scheduled from the same board effect timeline, use the existing `sfx` volume channel, and clean up timers with the Pixi overlay.
- Board SFX timer mapping and cleanup belong in `boardSkillEffectSoundScheduler.js`; `BoardSkillEffects.jsx` should not duplicate cue math or timer iteration.
- The backend must derive animation metadata from the already-resolved skill action, not by recomputing skill rules.
- Replay reconstruction is rules execution for historical display, not a new live action. Any skill whose live resolution depends on randomness or pre-resolved metadata, including Lynae `spray-stone` and Baconbits `random-blast`, must replay from the history entry's recorded target ids.
- Admin character options, backend character validation, skill normalization, board target preview, active skill type lists, server fallback skill config, and board skill SFX cue timing must read shared effect metadata from `src/shared/skillEffectCatalog.js` instead of each keeping a local `effectType -> targetRule/label/cue` table.
- Every catalog entry with `boardEffect: true` must have a matching `BOARD_SKILL_EFFECT_RENDERERS` entry; unknown effect types should no-op without touching the Pixi stage.
- Effects that draw their persistent visual through React DOM/CSS, such as a row-wide slash marker stored in `game.rowEffects`, must not be registered as Pixi `boardEffect` entries. A full-size Pixi canvas can become an opaque overlay in some browser/runtime paths and hide the board grid, star points, and stones.
- Persistent point-local visuals such as Mornye `protocol-takeover` and ChangLi `double-move-stone` belong on the existing point/stone DOM nodes. They must remain pointer-transparent and respect reduced motion; do not model them as `BoardSkillEffects` Pixi renderers.
- QiuYuan `row-slash` is visible only until the opponent's next action. Store `clearAfterColor: opponent(owner)` and clear expired row effects from ordinary moves, passes, and turn-consuming skill resolution by action color, not by the row effect owner.
- Board point buttons sit above the SVG grid; shared board CSS and theme guard layers must explicitly keep `.board .point` transparent with no appearance, no border/shadow/background image, zero min-size, and `touch-action: none` so broad button rules cannot cover the grid.
- The board grid SVG must be treated as a gameplay layer, not ordinary media. `.board-lines` must explicitly keep `display: block`, `width/height: 100%`, `max-width/max-height: none`, and theme guard stroke/opacity rules so global `img/svg/canvas` media resets such as `height: auto` cannot collapse or wash out the grid.
- Board surface styling belongs on `.board-wrap` through `--board-wood-texture`. Bright School and other late theme repair layers may force `background: var(--board-wood-texture) !important`, but must not fork a separate board texture because those late layers override the base room surface.
- `prefers-reduced-motion: reduce` must use a short static hit effect without fly-in, scale bursts, explosions, board shake, or explosive SFX.

#### 4. Validation & Error Matrix
- Missing `pendingSkill` -> render no effect but keep the board usable.
- `game.skillEnabled === false` -> keep the board usable and pass `prewarm={false}` so standard boards do not load Pixi early.
- Missing `targetId` -> skip the Pixi effect safely.
- Unknown `effectType` -> keep the overlay inert and preserve the normal skill preview/result flow.
- `boardEffect === false` for a known effect -> render any DOM/CSS overlay separately through its dedicated component; do not render `BoardSkillEffects` markup and do not create a canvas.
- `rowEffects` contains `{ owner: "black", clearAfterColor: "white" }` and white makes any valid action -> remove that row marker from the next game snapshot.
- Muted `sfx` channel -> do not create WebAudio contexts or play board skill SFX.
- Unmounted board / route change during a skill effect -> clear scheduled SFX timers before they fire.
- Active Nabomo passive fog -> board clicks, touch confirmation, score marking, coordinates, and move numbers remain available because the fog is presentation-only.
- Visible square fog boundary -> invalid; the ambient layer must use feathered cloud shapes/masks so it reads as black cloud rather than a rectangular overlay.
- Standard mode with no skills -> no pending skill effect should appear.
- Restored room with `resolvesAt` in the past -> backend resolves immediately through existing pending-skill scheduling.

#### 5. Good/Base/Bad Cases
- Good: Sigrika erase, Danea flip, Aemeath hidden-hand, and Baconbits blast all route from `effectType` supplied by the room snapshot.
- Good: a skill-enabled room prewarms Pixi during browser idle time, and the first actual skill effect reuses that module promise instead of issuing a second dynamic import.
- Good: adding a new effect starts by extending `SKILL_EFFECT_CATALOG`, then wiring concrete rule handlers, server preview metadata, board animation, and tests.
- Good: adding a new board animation updates `BOARD_SKILL_EFFECT_RENDERERS` and its registry test, while `BoardSkillEffects.jsx` remains the lifecycle host.
- Good: QiuYuan `row-slash` renders through `BoardRowSlashOverlay`, omits the full-board `BoardSkillEffects` layer, leaves `BOARD_SKILL_EFFECT_RENDERERS["row-slash"]` undefined, and uses CSS keyframes for the row-wide slash animation.
- Good: ChangLi `double-move` normal placements set `double-move-stone` on both extra-turn stones, and `Board` applies the red flame CSS class directly to each affected stone.
- Good: Danea flip visually reads as transparent bubble formation, purple-black corruption, then pop/flash before the final stone color appears.
- Good: Nabomo fog is driven by active passive state and continues after the passive activation banner/effect has resolved.
- Base: legacy replay skill entries without new visual metadata still replay through the rules layer.
- Bad: using `canPreviewSkillTarget` as the random-blast click eligibility gate; no-target skills must keep preview false while board confirmation remains allowed.
- Bad: calculating the random-blast center on the frontend instead of using backend `pendingSkill.targetId`.
- Bad: setting `boardEffect: true` for a DOM-only row/marker effect just to indicate that it appears on the board; this can mount a blank full-board canvas over the playable board.

#### 6. Tests Required
- Backend tests assert `pendingSkill` metadata for erase-point, flip-stone, and random-blast.
- Shared rules tests assert `erase-point` history includes `effectType`.
- Board tests assert the effects layer renders without removing point buttons.
- Effects tests assert coordinate mapping for 13-line and 19-line boards and reduced-motion timing.
- Registry tests assert every catalog `boardEffect` type has a renderer and unknown effect types no-op safely.
- Component tests assert DOM-only skill visuals render no `board-effects-layer` and do not require a Pixi renderer.
- Shared game tests assert QiuYuan row slash records `clearAfterColor` and clears on the opponent's next ordinary move.
- Board/CSS contract tests assert `.board .point` cannot inherit visible button chrome, `.board-lines` cannot inherit ordinary media sizing, and `row-slash` keeps a dedicated CSS animation.
- Board/CSS contract tests assert protocol-ban and double-move-stone persistent point effects have their expected glow keyframes, while shared game tests assert ChangLi's two extra-turn placements retain `double-move-stone`.
- Board/CSS contract tests assert `.board-wrap` defines `--board-wood-texture` and late Bright School guards reuse that variable.
- Replay tests assert Lynae `spray-stone` uses the history entry's `randomTargetId` so stepping through a replay cannot reroll which ordinary stone became spray.
- Pixi prewarm tests assert disabled mode does not schedule loading, cancellation prevents idle imports, and prewarm/live effect loading share one promise.
- Ambient tests assert active color illusion fog is pointer-transparent and renders without removing board buttons.
- SFX tests assert stable cue points and muted settings avoiding AudioContext creation.
- Scheduler tests assert catalog cue timing, reduced-motion suppression, and timer cleanup.
- Catalog tests assert effect type order, admin options, default target rules, active effect lists, and SFX cues.

#### 7. Wrong vs Correct

Wrong:

```jsx
<canvas className="board" onClick={handlePoint} />
```

Correct:

```jsx
<div className="board">
  <BoardSkillEffects boardSize={game.size} pendingSkill={game.pendingSkill} audioSettings={audioSettings} />
  {game.points.map((point) => <button key={point.id} className="point" />)}
</div>
```

---

### Scenario: Gacha Admin Featured Prizes Contract

#### 1. Scope / Trigger
- Trigger: any change to gacha admin prize editing, gacha pool draft serialization, admin gacha API payloads, or player/admin gacha pool payload projection.
- Featured prizes are cross-layer display hints, not required prize rules. Draw odds and reward settlement must not depend on any featured prize existing.

#### 2. Signatures
- `emptyGachaPoolDraft().featuredPrizeIndexes`: `number[]`, default `[]`.
- `emptyGachaPoolDraft().featuredPrizeIndex`: `null | number`, legacy first-featured compatibility field.
- `buildGachaPoolDraft(pool).featuredPrizeIndexes`: indexes of `pool.featuredPrizeIds` / `pool.featuredPrizes` in `pool.prizes`, falling back to legacy `pool.featuredPrizeId`.
- `gachaPoolDraftToBody(draft).featuredPrizeIndexes`: `number[]`; `featuredPrizeIndex` remains `indexes[0] ?? null`.
- Admin API input `featuredPrizeIndexes`: `number[]`; empty array means clear or keep no featured prizes. `featuredPrizeIndex` is accepted only as a legacy single-value fallback.
- Gacha pool payload `featuredPrizes`: `GachaPrizePayload[]`; `featuredPrize` remains the first item or `null` for older display surfaces.

#### 3. Contracts
- The admin "大奖" control is an independent toggle per prize row, not a required radio group: clicking a selected prize removes only that prize from the featured list.
- New drafts must not silently preselect prize index `0`.
- Draft serialization sends `featuredPrizeIndexes: []` when no featured prize is selected.
- Backend validation must accept an empty array and must reject only indexes outside the prize array.
- Create/update persistence must store all selected prize ids in `featuredPrizeIds` JSON and mirror the first selected id in legacy `featuredPrizeId`; when the array is empty both fields are `null`.
- Player/admin pool payload projection must not invent the first prize as `featuredPrize` or `featuredPrizes[0]` when no featured id is stored.

#### 4. Validation & Error Matrix
- `featuredPrizeIndexes === []` -> valid, no featured prizes.
- `featuredPrizeIndexes` omitted and `featuredPrizeIndex === null` -> normalize to `[]`.
- Any featured index `< 0` -> invalid.
- Any featured index `>= prizes.length` -> invalid.
- Duplicate featured indexes -> normalize to one instance, preserving order.
- `featuredPrizeIds` missing from loaded pool but `featuredPrizeId` exists -> edit draft shows that one legacy featured prize selected.
- Stored featured ids missing from loaded prizes -> ignore missing ids without selecting another prize.

#### 5. Good/Base/Bad Cases
- Good: an admin toggles two "大奖" buttons, saves, and subsequent payloads expose both prize payloads in `featuredPrizes` while `featuredPrize` points to the first selected prize.
- Good: an admin clicks all selected "大奖" buttons again, saves, and subsequent payloads expose `featuredPrizeIds: []`, `featuredPrizeId: null`, `featuredPrizes: []`, and `featuredPrize: null`.
- Base: an existing pool with only a valid `featuredPrizeId` still shows that prize selected in the editor.
- Bad: using `featuredPrizeIndex ?? 0`, `Math.max(0, findIndex(...))`, or `prizes[0]` fallback for featured prize display.
- Bad: treating the "大奖" button as radio semantics where selecting one prize clears every other selected featured prize.

#### 6. Tests Required
- Draft helper tests assert empty and loaded no-featured pools keep `featuredPrizeIndexes: []`.
- Draft helper tests assert multiple stored featured ids serialize as multiple indexes and preserve `featuredPrizeIndex` as the first index.
- Admin component/source tests assert the featured control toggles membership rather than replacing the selected prize.
- Admin management tests assert `featuredPrizeIndexes: []` and multiple indexes validate.
- Gacha payload tests assert `featuredPrizes` returns every stored featured prize and remains empty when no featured id is stored.
- Schema tests assert `GachaPool.featuredPrizeIds` exists in Prisma schema, migration SQL, and startup schema guard.

#### 7. Wrong vs Correct

Wrong:

```js
const featuredPrizeIndex = parseIntValue(input.featuredPrizeIndex ?? 0);
const nextFeaturedPrizeIndexes = [clickedIndex];
const featuredPrize = prizes.find((prize) => prize.id === pool.featuredPrizeId) ?? prizes[0] ?? null;
```

Correct:

```js
const featuredPrizeIndexes = Array.isArray(input.featuredPrizeIndexes) ? input.featuredPrizeIndexes : [];
const nextFeaturedPrizeIndexes = currentIndexes.includes(clickedIndex)
  ? currentIndexes.filter((index) => index !== clickedIndex)
  : [...currentIndexes, clickedIndex];
const featuredPrizes = featuredPrizeIds.map((id) => prizes.find((prize) => prize.id === id)).filter(Boolean);
```

### Scenario: Gacha Result Reward Display Contract

#### 1. Scope / Trigger
- Trigger: any change to gacha draw response payloads, `GachaResultDialog`, gacha reward label helpers, or reward result CSS.
- The draw result is a cross-layer display contract: backend settlement chooses a `GachaPrize`, the immediate response carries display metadata, and the frontend result dialog renders the visual card.

#### 2. Signatures
- Immediate draw reward payload: `{ prizeId, type, targetId, quantity, unlockedQuantity, duplicateQuantity, blueGemsAdded, chainAdded, coinsAdded, name, imageUrl }`.
- `buildGachaRewardDisplay(reward)`: returns `{ name, imageUrl, fallback, detail }`.
- `GACHA_COIN_BAG_IMAGE`: local image path used for coin rewards.
- `GachaResultDialog({ result, onClose })`: adds `.ten-pull` to `.gacha-result-grid` when `result.rewards.length === 10`.

#### 3. Contracts
- Backend draw settlement must copy `prize.name` and `prize.imageUrl` into immediate reward responses; the frontend should not infer player-facing names from `targetId`.
- Coin rewards ignore empty prize images and always render `GACHA_COIN_BAG_IMAGE`.
- Non-coin rewards prefer `reward.name`; when no name exists, fall back to `gachaPrizeTypeLabel(type)`, not raw target ids.
- Reward details preserve quantities and conversions: coins show `<n> 金币`, item stacks show `x<n>`, character duplicates show `角色链 +<n>`, and decoration/music duplicates show `转换 <n> 蓝宝石`.
- Desktop ten-pull result grids use five columns so ten rewards produce two rows; smaller viewports may keep adaptive columns.

#### 4. Validation & Error Matrix
- Missing `name` on a non-coin reward -> show the localized type label.
- Missing `imageUrl` on a non-coin reward -> show the type fallback glyph.
- Coin reward with empty `imageUrl` -> still show the coin-bag image.
- Ten rewards -> add `.ten-pull`; any other count -> keep adaptive grid.

#### 5. Good/Base/Bad Cases
- Good: a reward for `rainbow-bean-candy` with `name: "彩虹豆豆跳跳糖"` renders that name and `x3`.
- Base: a legacy reward with no image renders a compact localized fallback instead of breaking layout.
- Bad: rendering `${targetId} x${quantity}` in result cards, because it leaks internal ids such as `rainbow-bean-candy`.
- Bad: using a generic orb for every reward image after `imageUrl` is available.

#### 6. Tests Required
- Gacha helper tests assert coin-bag image selection, player-facing names, details, and no target-id-first labels.
- `GachaResultDialog` markup tests assert `.ten-pull`, reward images, names, and details.
- CSS contract tests assert `.gacha-result-grid.ten-pull` uses five columns on desktop.
- Backend gacha draw tests assert immediate rewards include copied `name` and `imageUrl`.

#### 7. Wrong vs Correct

Wrong:

```jsx
<span className="gacha-result-orb" />
<strong>{reward.targetId} x{reward.quantity}</strong>
```

Correct:

```jsx
const display = buildGachaRewardDisplay(reward);
<img src={display.imageUrl} alt={display.name} />
<strong>{display.name}</strong>
{display.detail && <small>{display.detail}</small>}
```

### Scenario: Player Gacha Modal Responsive Layout Contract

#### 1. Scope / Trigger
- Trigger: any change to player-facing `GachaModal` markup or CSS, including pool tabs, featured stage, wallet/action controls, nested prize/history dialogs, result grids, or Bright School theme overrides.
- This contract does not cover the admin gacha pool editor.

#### 2. Signatures
- `GachaModal` keeps the existing class surface: `.gacha-modal`, `.gacha-pool-tabs`, `.gacha-ticket-tab`, `.gacha-main`, `.gacha-featured-stage`, `.gacha-control-panel`, `.gacha-wallet`, `.gacha-round-actions`, `.gacha-draw-actions`.
- Base layout lives in `src/styles/commerce-settings.css`.
- Bright School polish lives in `src/styles/themes/bright-school/commerce.css`.
- Final phone/tablet survival rules live in `src/styles/mobile-adaptive.css`, which is imported after theme files.

#### 3. Contracts
- Desktop gacha UI is a capsule-counter composition: pool tickets in a compact rail, machine/featured prize as the primary stage, and wallet/prize/history/draw controls in a separate action panel.
- Mobile gacha UI must use one modal column inside the safe-area viewport, with pool tickets as a horizontal top scroller and draw controls reachable without horizontal scrolling.
- Mobile `.gacha-main` must collapse to one column; do not leave desktop side-panel columns active below 768px.
- Nested prize/history/result dialogs must scroll internally on mobile.
- Desktop ten-pull result grids stay five columns; mobile ten-pull result grids may collapse to compact two-column cards.
- Bright School `!important` overrides must be paired with equal-or-later mobile rules in `mobile-adaptive.css` when they affect gacha layout.

#### 4. Validation & Error Matrix
- No open pools -> the modal may show empty/loading text, but the pool rail and main area must not create horizontal overflow.
- 393px portrait viewport -> `documentElement.scrollWidth` should not exceed `clientWidth`.
- Ten rewards -> desktop `.gacha-result-grid.ten-pull` uses five columns; mobile uses the final mobile override.
- Bright School active -> themed borders/shadows may change, but mobile column layout, touch target sizes, and internal scrolling remain intact.

#### 5. Good/Base/Bad Cases
- Good: mobile gacha rules in `mobile-adaptive.css` use `.gacha-modal`, `.gacha-pool-tabs`, `.gacha-main`, and `.gacha-draw-actions` so the final layer owns small-screen survival.
- Good: Bright School theme reduces heavy gacha shadows on mobile while the final mobile layer controls sizing and grid structure.
- Base: an empty gacha pool list still renders a bounded modal with no horizontal page scroll.
- Bad: only editing `themes/bright-school/commerce.css` for mobile layout; the later `mobile-adaptive.css` layer can still override or drift.
- Bad: keeping `grid-template-columns: minmax(0, 1fr) minmax(242px, 310px)` active on phone widths.

#### 6. Tests Required
- `GachaModal.test.js` should assert the gacha CSS hooks, desktop ten-pull five-column rule, final mobile gacha selectors, and Bright School mobile gacha marker.
- Run `npm test -- src/modals/GachaModal.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js` after changing gacha modal CSS.
- Run `npm run check` before handoff when system docs or broad CSS layers changed.

#### 7. Wrong vs Correct

Wrong:

```css
@media (max-width: 768px) {
  .theme-bright-school .gacha-main {
    grid-template-columns: 1fr !important;
  }
}
```

This keeps mobile survival in the theme layer only.

Correct:

```css
@media (max-width: 768px) {
  .gacha-main {
    grid-template-columns: minmax(0, 1fr) !important;
  }
}
```

Place the final mobile contract in `mobile-adaptive.css`, then let theme CSS adjust only visual treatment such as borders and shadows.

---

## Styling Patterns

<!-- How styles are applied (CSS modules, styled-components, Tailwind, etc.) -->

(To be filled by the team)

---

## Accessibility

<!-- A11y requirements and patterns -->

(To be filled by the team)

---

## Common Mistakes

<!-- Component-related mistakes your team has made -->

(To be filled by the team)
