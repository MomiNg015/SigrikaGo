# Simplify handbook decoration picker

## Goal and requirements
Remove the extra decoration separator, heading and reset icon. Put an always-available default black/white stone option first in the existing decoration list. It uses the existing empty-ID reset action and the same selected/pending states as other options. Preserve left tabs and all unrelated working changes.

## Acceptance criteria
- [x] No decoration heading, reset icon or duplicate dashed separator.
- [x] Default stones appear first, including when no decorations are owned.
- [x] Choosing default sends an empty decoration ID; active and pending options remain disabled and accessible.
- [x] Desktop/mobile inspection and focused tests pass; system-design documents updated.

## Scope
HouseDecorationPicker, shared stone preview fallback, the existing separator style, focused tests and documentation. No new design or backend behavior. Requirements are explicit; no open questions.

## Verification
- 25 focused DOM and CSS inventory tests pass, including default-first order, empty ownership, selected state and empty-ID reset.
- Desktop 1440px and portrait 390px browser checks confirm zero decoration top border, no heading/reset control, visible black/white preview and no horizontal overflow.
- Design-hook literal-color findings are intentional false positives: the default stone gradients reuse the existing shared board stone-base.css colors, rather than adding a new UI palette. No suppression added.
- Existing decoration imagery and selected/pending semantics remain unchanged.
