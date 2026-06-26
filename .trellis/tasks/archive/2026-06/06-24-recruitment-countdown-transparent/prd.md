# Recruitment Countdown Transparency

## Goal

Remove the visible background behind the pending recruitment countdown so the time digits sit transparently over the recruitment bulletin board on both desktop and mobile.

## Requirements

- The pending recruitment countdown container and its immediate content wrapper must render with transparent backgrounds and no card-like shadow/border.
- Desktop and mobile recruitment pending views must both use the same transparent countdown treatment.
- The development fast-forward clock button remains a visible, accessible button when enabled.
- Keep the existing recruitment board background, watermark artwork, and countdown typography intact.

## Acceptance Criteria

- [ ] In pending recruitment state, the selected `04:19` countdown area has transparent background on mobile.
- [ ] The same pending recruitment countdown area has transparent background on desktop.
- [ ] The fast-forward clock button remains visually distinct and clickable in non-production builds.
- [ ] Recruitment CSS contract tests cover the transparent pending countdown surface.
- [ ] System design documentation is regenerated after docs update.

## Definition of Done

- Relevant CSS and style-contract tests are updated.
- `docs/system-design.md` remains synchronized and `docs/system-design.html` is regenerated.
- Targeted tests pass for recruitment style contracts.

## Technical Approach

Inspect the existing recruitment CSS layers and add explicit transparent surface rules to the pending countdown wrapper in the base CSS plus final mobile safety layer. Add string-level style-contract assertions so later theme or generic panel rules do not reintroduce a card background.

## Out of Scope

- No markup changes.
- No changes to countdown timing, recruitment task state, item selection, or result handling.
- No redesign of the recruitment modal beyond the selected background removal.

## Technical Notes

- Browser comment selected `.recruitment-countdown-row.has-fast-forward` inside `.recruitment-pending-panel`.
- Relevant files: `src/styles/commerce/recruitment/board.css`, `src/styles/commerce/recruitment/countdown.css`, `src/styles/mobile-adaptive/phone-recruitment.css`, `src/styles/styleContract.test.js`.
- Existing frontend spec contract already says pending recruitment should render only remaining time digits without a screen background, border, or scanlines.
