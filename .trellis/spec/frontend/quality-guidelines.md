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

### Modal and Tab Visual State Contracts

When adding or restyling modal tabs, including game-mode tabs in resume, leaderboard, replay, or watch-list surfaces, keep selected state visually explicit in both base CSS and the active theme override.

Required assertion points:

- Tab buttons with `.active`, `aria-selected="true"`, or equivalent selected state must have a distinct background color, not only a border or text-color change.
- Theme layers that globally reset `button` backgrounds, especially Bright School rules with `!important`, must include matching selected-tab overrides after the reset.
- Mobile modal fixes that must survive Bright School and shared responsive rules should also be mirrored in the final `mobile-adaptive.css` safety layer, because it is imported after theme files.
- Moving a modal action between header/body sections should be covered by a static markup order assertion when the order matters to the user workflow.

Wrong:

```css
.app-shell.theme-bright-school button {
  background: var(--bright-sheet) !important;
}
```

This can erase the selected background of generic `.mode-tabs` in resume, leaderboard, and watch-list modals.

Correct:

```css
.app-shell.theme-bright-school .mode-tabs button[aria-selected="true"] {
  background: #ff9ebb !important;
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
