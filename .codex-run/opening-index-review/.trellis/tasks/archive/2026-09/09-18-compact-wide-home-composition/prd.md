# Compact wide desktop home composition

## Requirements
Anchor the hanging student ID to the bounded central home composition on wide desktop screens. Keep the handbook centered between the ID and match entry so it also moves inward. Preserve the hanging top attachment, current art sizes, entry interactions and portrait mobile layout. Follow the supplied reference composition without moving the match/utility entries.

## Approach
Inspect rendered stage bounds; align the ID horizontal position to the stage left edge only when that is farther inward than its current board-relative 8% anchor. Reuse the existing handbook observer so it follows the corrected plaque position. Verify 2542x1180, 1920x1080, 1440x900 and portrait 390x844, including resize stability.
