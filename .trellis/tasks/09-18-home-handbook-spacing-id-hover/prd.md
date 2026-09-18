# Home handbook spacing and student ID hover

## Goal
Keep the handbook close to the hanging student ID and match entry at wide desktop and portrait phone sizes. Rotate the ID slightly counterclockwise around the top of its hook on hover.

## Requirements
- Preserve existing artwork, card size, match actions, and utility controls.
- Hover uses approximately -3deg with the pivot at the artwork hook tip; respect disabled and reduced-motion states.
- Center the desktop handbook between the ID's right edge and the match entry's left edge; keep both neighboring entries fixed.
- Tighten portrait handbook positioning toward both the ID and match art without overlap.
- Keep changes in the existing final student-ID layout owner and update system design documentation.

## Acceptance criteria
- Visually inspect 1440px, 1920px and 2229px desktop widths, plus 360px, 390px and 412px portrait widths.
- No horizontal document overflow or overlapping interactive artwork.
- Verify hover transform/pivot and reduced-motion behavior in a browser.
- Relevant existing tests and CSS quality checks pass.

## Scope
Local home layout and hover polish only. No artwork regeneration, new UI, or changes to other screens.

## Technical findings
- PlayerPlaque is positioned against the board, outside HomeStage.
- The 1440px stage cap centers its grid inside a wider board while the ID stays board-anchored. HomeStage measures both neighbors with ResizeObserver and positions the handbook at their midpoint; preserve match and utility positions.
- Mobile centers the handbook within a tall first row; its transparent artwork padding also contributes to the apparent gap.
- Use existing local HomeScreen preview with production styles for visual verification.

## Decisions
The user supplied the intended movement and spacing goals; exact pixel offsets are determined by browser verification. No blocking questions.

## Visual verification
- Real HomeScreen component and complete production stylesheet, local fixture at 1440x900, 1920x1080, 2229x966, 360x800, 390x844 and 412x915.
- All six viewports have zero horizontal document overflow. Desktop changes affect only handbook placement; phone handbook moves 12px left and bottom-aligns while the first row reservation decreases 20px.
- Browser computed hover matrix confirms -3 degrees around 50.8% 2%; reduced-motion returns transform:none.
- Screenshots and verification logs remain local under .codex-run/handbook-final-*.

## Desktop centering correction
- User rejected the first desktop result as too close to the ID; explicit requirement is equal space on each side of the handbook.
- Replaced the CSS width-based shift with measured midpoint positioning. Repeated resize callbacks subtract the existing translation to avoid accumulated drift. Mobile clears the desktop variable and keeps its separate layout.
- Verified 2229px: both horizontal layout gaps approximately 115px; 1920px: both approximately 50px. Six viewport screenshots are under .codex-run/handbook-centered-*.
- 103 targeted tests pass, including resize, no-drift, mobile reset and observer cleanup coverage.
