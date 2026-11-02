# Loading and battle layout feedback

## Goal
Resolve the four reported UI defects using existing components and visual contracts.

## Requirements
- Rotating loading tips and portraits must not shift surrounding content; move the small progress copy closer to the bar.
- Keep the five-key battle controls during dead-stone marking. Counting becomes Confirm dead stones; resignation becomes Reset confirmation. Preserve authoritative scoring callbacks and confirmed-state disabling.
- Keep the playable board square and proportionate at desktop sizes, with stable geometry between playing and marking. Preserve portrait mobile usability.
- Result dialogs use the existing large-card thick ink border and hard shadow.
- Unreleased interface theme buttons look and behave unavailable while still showing the existing coming-soon toast on attempted activation.

## Acceptance Criteria
- [x] Browser measurements show unchanged loading anchors across all tip/portrait rotations.
- [x] Playing/marking board and action bounds match; square inner grid fills its intended board area.
- [x] Scoring confirm/reset and unavailable-theme pointer/keyboard behavior have regression coverage.
- [x] Result styling verified with the complete theme cascade.
- [x] Relevant tests, lint/build/CSS checks pass; system design Markdown and HTML updated. Full initial check and successful corrected checks are detailed in verification.md.

## Scope
No game-rule, API, asset, or unrelated UI redesign. Keep unrelated working tree edits.

## Approach
Use persistent slots for loading and actions; fix the winning board layout owner; reuse global unavailable feedback with a narrowly scoped explanatory event.
