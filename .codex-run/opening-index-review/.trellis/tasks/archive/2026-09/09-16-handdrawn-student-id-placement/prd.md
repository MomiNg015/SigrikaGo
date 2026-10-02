# Hand-painted student ID hanging from the board

## Requirements
- Redraw the approved academy card in the same pencil/gouache style as the home handbook, including hook, clip, rivets and edges. Preserve geometric academy identity rather than adding cute stickers.
- Place the top hook at the main wooden board's upper edge with a visible attachment point and restrained contact shadow; the card hangs down over the board.
- Reposition the handbook to the right of the hanging card, preserving usable match and utility entries on desktop and portrait mobile.
- Preserve the right-side current-character portrait, username below, resume action, disabled state and reduced-motion behavior.
- Keep unrelated work intact; update docs and regression coverage.

## Image prompt
Built-in imagegen edit of current card, with book-entry.png as style reference: all hardware and edges redrawn using irregular warm pencil contours, gray gouache, simple brush highlights and subtle cross-hatching; preserve asymmetrical portrait/name geometry and academy graphic marks; transparent cutout; no photoreal chrome/plastic, no stickers or cartoon decorations.

## Acceptance
- User owns visual verification; do not continue screenshot QA. The card must hang above its original LEFT-side location, never the far-right corner; its width adapts to desktop/phone viewport.
- Clear the inherited named grid area on the absolute board child; use the board's full containing block for left/top positioning. Reserve card clearance in the stage rows.
- Current portrait/username overlays fit the redrawn frame; original actions work.
- npm run check passes.
