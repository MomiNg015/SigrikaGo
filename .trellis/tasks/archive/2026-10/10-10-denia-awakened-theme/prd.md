# Awakened Denia battle theme

## Goal and accepted scope
The user accepts the current paper transition for now and requests blue-violet theming after Denia transforms. Reuse the existing match form state; update the skill banner and player information palette at the portrait reveal, preserving the color through this match and resetting it with the form. Do not change the particle animation or account-level character palette.

## Implementation
Centralize the awakened palette in deniaSkillForm.js. SkillBanner consumes its current form. PlayerInfo consumes the same hook before early returns and derives a presentation-only character palette, allowing existing portrait accents and skill-chip styles to inherit it. The user refined the direction: match the cyan/electric-violet arm and leg markings, not flat generic purple. Add a scoped rune motif owner, shared palette tokens and an SVG to existing effect preloads. Banner uses dark indigo/cyan-violet marks; card and skill surfaces keep restrained pale gradients for readability.

## Acceptance
- [x] Normal form retains original pink; both surfaces turn blue-violet at 1750 ms.
- [x] Cancellation/reset restores original palette; resolved history and subsequent casts retain blue-violet.
- [x] Other characters and catalog palettes remain unchanged.
- [x] Existing lifecycle tests with palette assertions, lint, build and desktop/mobile rendered checks pass.
- [x] System design and cut-in contract updated and HTML regenerated.

## Open questions
None; use a medium blue-violet consistent with the transformed outfit and paper outline.

## Additional accepted adjustment
Raise desktop ordinary battle portrait artwork by 15% of its portrait frame height. Move the outer artwork/crop frame so the head is not clipped by an unmoved crop. Preserve portrait mobile positioning, name tickets, card geometry, team strip crops and the special corrupted duel.

## Validation
48 focused banner, information-card and form tests passed; lint, production build and built CSS contracts passed. Rendered desktop (1440x900) and portrait mobile (390x844) verified palette switching, loaded artwork, reset and shared rune styling. Desktop artwork rises 37.5px in its 250px frame, with unchanged width and crop bottom; mobile retains its original 88px frame and position. Updated screenshots and cinematic preview.

CSS inventory retains two pre-existing failures: 899 unrelated bytes above the baseline and an unregistered 360px query in match-mode-title-layout.css. Only this task's 2342-byte, one-file, one-important and one-media-owner deltas were registered; unrelated work remains unstaged.
