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
- UI mode ids are `spark` and `standard`.
- Mode option order must use `modeOrderedEntries()` so `spark` appears before `standard`.
- Room controls receive `game.skillEnabled !== false` or equivalent normalized mode state.
- Board components receive `game.size` and expose it as `--size` on the shared board wrapper so intersections, labels, star points, and click targets use one board-size source.

#### 3. Contracts
- Home match entry opens a two-option modal before emitting `match:join`.
- Duel requests open the same two-option choice before emitting `duel:request`; incoming request UI must show the selected mode title and rules text.
- Mode tabs are required for leaderboard, watch list, and record/history views.
- Home player plaques render two compact mode stat rows from `modeOrderedEntries()`: spark rank/rating first, standard rank/rating second. Do not collapse them back into a single global rank/rating pair, and do not show recent-result markers on the plaque.
- Standard room UI must omit skill action buttons, both player skill labels, skill names, removal labels, and overclock labels.
- Standard scoring copy must omit overclock/skill-cost descriptions and use black komi `3.75`.
- Coordinate labels must grid with `repeat(var(--size), minmax(0, 1fr))`; do not leave coordinate rows or columns hard-coded to 13 tracks.

#### 4. Validation & Error Matrix
- Missing `game.mode` -> render as `spark`.
- Missing `game.skillEnabled` -> assume skills enabled for legacy rooms.
- `standard` with accidental skill state -> UI must still hide skill controls when `skillEnabled === false`.
- Standard board actions on points such as `18,18` must be accepted by the backend because point validation uses the room game's size, not the legacy 13-line default.
- Mobile mode controls -> keep 44px-plus touch targets and avoid compressing Chinese labels into wrapped fragments.

#### 5. Good/Base/Bad Cases
- Good: `ActionBar` receives `skillEnabled={displayRoom.game.skillEnabled !== false}` and conditionally renders the skill button.
- Base: old replay snapshots with no mode continue through spark defaults.
- Bad: checking only `mode === "standard"` in one component while another component uses a separate hard-coded board size or komi.
- Bad: rendering a 19-line board while `.coord-row` still uses `repeat(13, 1fr)`, which makes labels drift away from intersections.

#### 6. Tests Required
- Home mode picker renders both modes and counts.
- Match/join socket payload includes selected mode.
- Standard room state renders 19-line board star points and no skill UI.
- Standard room accepts moves at the 19-line edge and Board CSS tests assert coordinate rows/columns use `var(--size)`.
- Leaderboard/watch/history fetches or filters by selected mode.
- Home plaque tests assert both `plaque-mode-stat-spark` and `plaque-mode-stat-standard` render with mode-specific ratings and stored ranks, while recent result markers stay limited to profile/history detail surfaces.
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
- `BoardAmbientEffects`: receives derived passive state such as active Nabomo color illusion fog and renders non-interactive ongoing board ambience.
- `playSkillEffectSound(effectType, cue, audioSettings)`: presentation-only SFX helper for `start` and `impact` animation cues.
- `boardPointCenter(pointId, { boardSize, width, height })`: maps a board point id to a pixel center in the current board viewport.

#### 3. Contracts
- `Board` keeps DOM/SVG as the interaction source of truth; PixiJS is presentation-only.
- The effects canvas and ambient layers must use `pointer-events: none` and must not replace point buttons, scoring marks, move numbers, coordinates, or skill targeting classes.
- Board effects start after `bannerDurationMs`, not when the banner first appears.
- Aemeath `hidden-hand` is a full-board effect: green electronic data streams move from the board edge toward the center, flash with white light, then dissipate outward/away without depending on a point-local impact.
- Nabomo `color-illusion-passive` has ongoing low-opacity black/gray cloud ambience while any color illusion passive is active; render it as separate feathered cloud shapes, not as a full rectangular board tint, and keep stones/intersections readable.
- Board SFX must be scheduled from the same board effect timeline, use the existing `sfx` volume channel, and clean up timers with the Pixi overlay.
- The backend must derive animation metadata from the already-resolved skill action, not by recomputing skill rules.
- Admin character options, backend character validation, skill normalization, board target preview, active skill type lists, server fallback skill config, and board skill SFX cue timing must read shared effect metadata from `src/shared/skillEffectCatalog.js` instead of each keeping a local `effectType -> targetRule/label/cue` table.
- `prefers-reduced-motion: reduce` must use a short static hit effect without fly-in, scale bursts, explosions, board shake, or explosive SFX.

#### 4. Validation & Error Matrix
- Missing `pendingSkill` -> render no effect but keep the board usable.
- Missing `targetId` -> skip the Pixi effect safely.
- Unknown `effectType` -> keep the overlay inert and preserve the normal skill preview/result flow.
- Muted `sfx` channel -> do not create WebAudio contexts or play board skill SFX.
- Unmounted board / route change during a skill effect -> clear scheduled SFX timers before they fire.
- Active Nabomo passive fog -> board clicks, touch confirmation, score marking, coordinates, and move numbers remain available because the fog is presentation-only.
- Visible square fog boundary -> invalid; the ambient layer must use feathered cloud shapes/masks so it reads as black cloud rather than a rectangular overlay.
- Standard mode with no skills -> no pending skill effect should appear.
- Restored room with `resolvesAt` in the past -> backend resolves immediately through existing pending-skill scheduling.

#### 5. Good/Base/Bad Cases
- Good: Sigrika erase, Danea flip, Aemeath hidden-hand, and Baconbits blast all route from `effectType` supplied by the room snapshot.
- Good: adding a new effect starts by extending `SKILL_EFFECT_CATALOG`, then wiring concrete rule handlers, server preview metadata, board animation, and tests.
- Good: Danea flip visually reads as transparent bubble formation, purple-black corruption, then pop/flash before the final stone color appears.
- Good: Nabomo fog is driven by active passive state and continues after the passive activation banner/effect has resolved.
- Base: legacy replay skill entries without new visual metadata still replay through the rules layer.
- Bad: using `canPreviewSkillTarget` as the random-blast click eligibility gate; no-target skills must keep preview false while board confirmation remains allowed.
- Bad: calculating the random-blast center on the frontend instead of using backend `pendingSkill.targetId`.

#### 6. Tests Required
- Backend tests assert `pendingSkill` metadata for erase-point, flip-stone, and random-blast.
- Shared rules tests assert `erase-point` history includes `effectType`.
- Board tests assert the effects layer renders without removing point buttons.
- Effects tests assert coordinate mapping for 13-line and 19-line boards and reduced-motion timing.
- Ambient tests assert active color illusion fog is pointer-transparent and renders without removing board buttons.
- SFX tests assert stable cue points and muted settings avoiding AudioContext creation.
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
