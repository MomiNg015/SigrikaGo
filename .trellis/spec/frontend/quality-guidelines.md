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
- Player info keeps the portrait/result badge column present across both rows (`"portrait meta time"` / `"portrait captures skill"`) and hides overflow inside the strip instead of spilling over the board.
- The board stage keeps `aspect-ratio: 1`, is centered in the board viewport, and sizes from `--mobile-room-board-size`.
- The bottom dock has a capped panel height; operation hints inside `#mobile-room-panel-actions` must be bounded so action controls remain reachable on 375px/393px portrait screens.
- Theme overrides, especially Bright School mobile rules with `!important`, must mirror the shared mobile room contract rather than redefining a conflicting layout.
- Battle-room tags and buttons should stay visually flat on mobile. Header tags, timer chips, capture chips, player labels, menu buttons, dock tabs, action buttons, replay buttons, and chat controls should use border-only treatment without `box-shadow`, `filter: drop-shadow(...)`, or `text-shadow`. Bright School control-shadow cleanup must use selectors specific enough to beat older `.app-shell... .captures span` / `.skill-chip` `!important` rules; a low-specificity `:where(...)` reset alone is not sufficient. Do not use a generic room `button` reset that catches `.point`; board point buttons and stone/current-move visuals are gameplay affordances and must stay separately controlled by board styles.

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
