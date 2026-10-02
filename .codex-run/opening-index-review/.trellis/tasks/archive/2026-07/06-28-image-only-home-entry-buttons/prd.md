# Image-only home entry buttons

## Goal

Convert the home screen member manual and match entries into image-only buttons while preserving accessible names and adding stable desktop and mobile interaction feedback.

## Requirements

- Remove visible `data-hud` labels, paper tags, and text badges from the member manual and match entry buttons.
- Keep the existing click behavior: member manual opens the house/manual modal, match opens the match mode picker flow.
- Keep button accessible names through `aria-label`; make the image art decorative to avoid duplicate screen-reader announcements.
- Desktop interaction states must include hover, focus-visible, and active feedback using transform, filter, box-shadow, or outline only.
- Mobile interaction must not depend on hover and must keep 44px-plus touch targets, stable layout bounds, and reduced-motion fallback.
- Update CSS contract tests for the new image-only behavior and remove tests that require visible pseudo-element labels.
- Update `docs/system-design.md` and `docs/system-design/06-ui-theme-mobile.md`, then regenerate `docs/system-design.html`.

## Acceptance Criteria

- [ ] `HomeImageEntries.jsx` no longer emits `data-hud`.
- [ ] Home entry images use empty alt text and `aria-hidden="true"` while their buttons keep Chinese `aria-label` values.
- [ ] Effective CSS no longer uses `content: attr(data-hud)` or hard-coded visible match/manual labels for these home entries.
- [ ] Desktop home entries have visible hover/focus-visible lift/focus treatment and an active pressed treatment.
- [ ] Mobile/final safety layers keep touch-action, target sizing, active feedback, and reduced-motion behavior intact.
- [ ] `npm test -- src/home/HomeScreen.test.jsx src/styles/hudComponents.test.js` passes.
- [ ] `npm run docs:system-design` passes and updates `docs/system-design.html`.
- [ ] `npm run build` passes unless blocked by an unrelated pre-existing issue.

## Definition of Done

- Tests are updated before implementation and observed failing for the removed text-label contract.
- Implementation stays scoped to home entry component/CSS/tests/system-design docs.
- Existing dirty unrelated files are not reverted or committed.
- Relevant docs are synchronized with generated system-design HTML.

## Technical Approach

- Use the existing `home-image-entry`, `house-manual-entry`, and `match-image-entry` class surface.
- Replace visible label pseudo-elements with non-text projection/glow/focus treatments.
- Clean the late Bright School theme and final mobile layers that currently reintroduce `content: attr(data-hud)` or fixed label content.
- Preserve current import-only CSS entry structure and update assertions through `readCssWithImports()` where effective rules cross imports.

## Out of Scope

- Replacing or regenerating image assets.
- Changing matchmaking, house/manual modal, or mode picker behavior.
- Adding JavaScript interaction state, sound effects, or new dependencies.

## Technical Notes

- Relevant files include `src/home/components/HomeImageEntries.jsx`, `src/styles/home-terminal/entries.css`, `src/styles/hud-components/*home-hologram*`, Bright School home-entry CSS layers, `src/home/HomeScreen.test.jsx`, `src/styles/hudComponents.test.js`, and system-design docs.
- Frontend contracts require mobile and desktop parity for this UI surface.
- UI/UX constraints: icon/image-only controls must keep accessible labels, visible focus states, touch feedback, and reduced-motion behavior.
