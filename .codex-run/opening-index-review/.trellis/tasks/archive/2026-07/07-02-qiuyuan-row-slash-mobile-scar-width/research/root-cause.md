# Root Cause: QiuYuan Row Slash Mobile Scar Width

## Summary

QiuYuan's final `row-slash` scar is short on mobile because the DOM scar is a `span` caught by Bright School's portrait mobile `max-width: 100% !important` shell rule. The scar keeps its negative `left` offset, but the computed width is capped back to the parent `.board` width. This shifts the scar left and leaves the right side short.

This is not caused by:

- Skill settlement or removed-stone logic.
- `game.rowEffects` missing row data.
- Pixi `row-slash` cast length.
- The row-slash gradient art itself.
- Mobile `left/right` tuning alone.

## Render Chain

`src/room/Board.jsx`

- `Board` renders `BoardSkillEffects` for the Pixi cast.
- Immediately after it, `Board` renders `BoardRowSlashOverlay`.
- `BoardRowSlashOverlay` returns:

```jsx
<div className="board-row-effects" aria-hidden="true">
  <span className={`board-row-slash ${effect.casting ? "casting" : ""}`} />
</div>
```

`src/styles/room/board/row-slash.css`

- `.board-row-effects` is absolutely inset inside `.board`.
- `.board-row-slash` is absolutely positioned with:

```css
left: -18%;
right: -18%;
```

In normal CSS, this should make the scar wider than `.board-row-effects`.

## Clamping Rule

The active clamp is the Bright School portrait mobile all-element rule:

```css
@media (max-width: 760px) and (orientation: portrait) {
  .app-shell.player-theme-enabled.theme-bright-school.theme-bright-school :where(*, *::before, *::after) {
    max-width: 100% !important;
  }
}
```

Because `.board-row-slash` is a `span`, this rule applies to it on portrait mobile. `src/styles/themes/bright-school/quality-base/audit-foundation.css` also contains a broad `span` block, but current source only resets text styling there; it does not apply `max-width` to `span`. That is why the desktop screenshot can remain correct while mobile is short.

## Browser Measurement Evidence

Measured with system Chrome and a minimal DOM using the actual imported project CSS.

Mobile viewport: `501x777`.

Measured values:

- `.board-wrap`: `352px`
- `.board`: `296px`
- `.board-row-effects`: `296px`
- `.board-row-slash` computed width: `296px`
- `.board-row-slash` computed left: about `-53px`
- `.board-row-slash` right edge: about `353px`
- `.board` right edge: about `406px`
- `.board-wrap` right edge: about `434px`

Interpretation:

- The negative `left` offset survives.
- The width extension from `right: -18%` does not survive because `max-width: 100% !important` caps the scar to the parent width.
- The element is therefore shifted left while staying only as wide as `.board`, producing a missing segment on the right.

Control check:

- A plain CSS test with a `296px` parent and `left: -18%; right: -18%` produces a width of about `403px`.
- The project page produced `296px`, confirming that a project cascade rule, not CSS absolute positioning itself, is the width cap.

Desktop check:

- The mobile `@media (max-width: 760px) and (orientation: portrait)` rule does not apply on desktop.
- With no desktop `span` max-width clamp in current `audit-foundation.css`, the same `left: -18%; right: -18%` model can span beyond the parent board layer as intended.

## Why Earlier Fixes Were Fragile

Existing tests in `src/room/Board.test.js` check that:

- `.board-row-slash` exists.
- `left: -18%` and `right: -18%` exist.
- Row-slash art/keyframes exist.
- Bright School does not turn row slash containers into paper panels.

They do not assert that `.board-row-slash` escapes broad Bright School `max-width` clamps or that the computed/effective width can exceed `.board`.

## Fix Boundary

The fix should be owner-scoped to board/skill presentation:

- Prefer a row-slash/board-owned exemption such as `max-width: none !important` on the `.board .board-row-slash` owner path, or an equivalent explicit width model that beats the portrait mobile theme clamp.
- Do not solve by only increasing `left/right`; that leaves the clamp intact.
- Do not change skill settlement or Pixi renderer unless new evidence contradicts this root-cause record.

## Verification Notes

At minimum, run focused tests covering board and skill effects. For CSS/theme changes, also run the relevant CSS contract tests. If browser tooling is available, measure mobile and desktop computed geometry or add an automated Playwright check that verifies `.board-row-slash` can exceed `.board` width.
