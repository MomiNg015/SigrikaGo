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
- Home player plaques render two compact mode stat rows from `modeOrderedEntries()`: spark rank/rating first, standard rank/rating second. Do not collapse them back into a single global rank/rating pair.
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
- Home plaque tests assert both `plaque-mode-stat-spark` and `plaque-mode-stat-standard` render with mode-specific ratings.
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
