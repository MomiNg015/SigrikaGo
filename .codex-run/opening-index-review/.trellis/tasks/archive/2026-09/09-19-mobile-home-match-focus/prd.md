# Mobile home match focus

## Goal
Make the match illustration the dominant portrait-mobile home entry and tighten the overall composition, as approved by the user.

## Requirements
- Enlarge the full match illustration, targeting approximately 330px wide and 270-290px tall at a 390px viewport.
- Preserve student ID and handbook sizes and desktop composition.
- Reclaim spacing and utility-row whitespace; preserve touch targets, shadows and scrolling on short phones.
- Keep the hand-drawn background grid from the previous task.

## Acceptance
- Verify 360x640, 390x844 and 412x915, plus unchanged desktop.
- No document horizontal overflow or overlapping interactive areas.
- Relevant home/CSS contracts, lint and build pass; update system design.

## Implementation
Use existing mobile home layout owners. No new dependency, animation or artwork.

## Validation
- 168 focused home, CSS and documentation tests passed; lint passed.
- Browser verified 360x640, 390x844 and 412x915: no horizontal overflow, final utility reachable, match click target available. Desktop 1440px bounds unchanged.
- At 390px the match region is 332x273px, header is 12px shorter and utility grid is approximately 53px shorter than before. Preserve ID/handbook dimensions and bottom shadow clearance.
- Existing palette/radius hook findings in header, board and test fixtures are outside this geometry-only change and remain intact.
