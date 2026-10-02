# Fix QiuYuan Row Slash Mobile Scar Width

## Goal

Fix QiuYuan's `row-slash` final DOM scar so the remaining slash spans the board consistently on mobile and desktop. The important correction is not skill settlement, Pixi playback, or `rowEffects` data; the root cause is cross-layer Bright School CSS clamping the DOM scar width.

## What I Already Know

- User-visible symptom: on mobile, QiuYuan's final knife scar covers roughly three quarters of the board, while the desktop screenshot shows the intended board-spanning scar.
- The final scar is rendered by `BoardRowSlashOverlay` as `.board-row-effects > span.board-row-slash` in `src/room/Board.jsx`.
- `.board-row-slash` is a `span`, and its intended width extension comes from `left: -18%; right: -18%` in `src/styles/room/board/row-slash.css`.
- Bright School's portrait mobile shell rule clamps that `span` through `max-width: 100% !important`:
  - `src/styles/themes/bright-school/mobile/home-shell/shell-base.css` targets `:where(*, *::before, *::after)` inside `@media (max-width: 760px) and (orientation: portrait)`.
  - `src/styles/themes/bright-school/quality-base/audit-foundation.css` has a `span` text-reset block, but current source does not apply `max-width` to `span`; that is why the desktop case can remain correct while mobile is short.
- Browser measurement with system Chrome on a 501x777 mobile viewport showed:
  - `.board-wrap` width: `352px`
  - `.board` / `.board-row-effects` width: `296px`
  - `.board-row-slash` computed width: `296px`
  - `.board-row-slash` left: about `-53px`
  - `.board-row-slash` right edge: about `353px`, while `.board` right edge is about `406px` and `.board-wrap` right edge is about `434px`
- This proves the scar is shifted left but not widened, so the right side is visibly short.

## Requirements

- Restore `.board-row-slash` geometry so `left: -18%; right: -18%` or its replacement can actually exceed the inner board layer on both mobile and desktop.
- Keep QiuYuan row-slash Pixi cast behavior unchanged unless evidence shows it is part of the same geometry failure.
- Preserve existing row-slash art, timing, cut-pending stone disappearance, and Bright School visual style.
- Do not broadly restyle Bright School, room layout, board points, stones, or mobile gameplay controls.
- Add a regression check that protects the row-slash DOM scar from Bright School/global `max-width` clamps.
- Update system design docs if the fix changes the documented CSS/theme/skill presentation contract.

## Acceptance Criteria

- [ ] Mobile Bright School row slash scar is not capped to the `.board` width by global `max-width: 100% !important`.
- [ ] Desktop Bright School row slash scar remains board-spanning and does not regress.
- [ ] Static tests prove the effective row-slash CSS wins against broad Bright School clamps.
- [ ] Focused board/skill tests pass.
- [ ] If CSS/theme contracts or system behavior docs change, `docs/system-design.md` or the matching `docs/system-design/` section is updated and `npm run docs:system-design` is run.

## Technical Approach

Use the smallest owner-scoped fix in the board/skill presentation CSS cascade. Preferred direction: explicitly exempt `.board-row-slash` from generic Bright School `max-width` clamps with a board-owned or Bright School row-slash owner selector, then lock that contract in tests. Do not keep tuning only `left`, `right`, gradients, or Pixi timing, because those do not address the width clamp.

## Decision (ADR-lite)

**Context**: The bug has been fixed several times unsuccessfully because the visible symptom is on QiuYuan's scar, but the active width cap comes from later Bright School/global mobile CSS.

**Decision**: Treat this as a CSS ownership/cascade bug. The fix must make the skill DOM scar immune to broad theme `max-width` rules and verify computed/effective CSS expectations.

**Consequences**: The change should be narrow and low-risk, but tests must guard against future broad theme reset rules catching board skill overlays again.

## Out of Scope

- Reworking QiuYuan skill gameplay rules or `rowEffects` state shape.
- Redesigning row-slash art direction, SFX, or Pixi renderer.
- Broad cleanup of all Bright School all-element/theme reset debt.
- Moving the full board layout or mobile room shell.

## Technical Notes

- Root-cause details are recorded in `research/root-cause.md`.
- Relevant files:
  - `src/room/Board.jsx`
  - `src/styles/room/board/row-slash.css`
  - `src/styles/themes/bright-school/quality-base/audit-foundation.css`
  - `src/styles/themes/bright-school/mobile/home-shell/shell-base.css`
  - `src/styles/themes/bright-school/quality-base/refinement-board/row-effects-shell.css`
  - `src/room/Board.test.js`
  - `.trellis/spec/frontend/css-architecture.md`
