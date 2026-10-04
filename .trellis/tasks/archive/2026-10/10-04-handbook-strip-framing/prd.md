# Handbook strip framing and names

## Goal
Refine the installed diagonal handbook strips according to the user's reviewed layout: alternating mobile portraits, readable opposite-side names, consistent desktop head size/eye line, horizontal-only hover movement, and an anonymous missing-data presentation for unowned Baconbits.

## Requirements
- Preserve original received catalog order and desktop row/mobile column composition.
- Mobile portraits alternate left/right by catalog index; names sit on the opposite side, visibly larger, without a colored text background. Use the requested Lahai-Roi typeface wherever glyphs exist and document any required Chinese fallback accurately.
- Desktop standard portraits use individually calibrated head landmarks to share perceived head size and eye line. Expanding a strip must preserve image width/height/top; move the portrait horizontally only. Names appear at the lower right only during preview (hover or equivalent keyboard focus).
- Unowned Baconbits has no portrait, alpha mask or question-mark silhouette. Render an achromatic missing-data treatment with the sole availability copy 暂无情报 and anonymous accessible metadata/detail action.
- Keep proportional artwork, costume/custom/effect resolution, corrupted isolation, narrow viewport scrolling, real hit areas, reduced motion and guide programmatic activation intact.
- Character selection remains deferred. Existing details and their full-body presentation are outside this edit.

## Acceptance and validation
- Test desktop hover dimensions, rendered landmark alignment, mobile alternating anchors and background-free name styling, anonymous no-art markup and touch/keyboard/programmatic behavior.
- Visually verify 1440x1024, 1440x768, 390x844 and 360x640, including first/last strips, ownership gaps and missing data.
- Run appropriate DOM/helper/style tests, browser regression, lint, build and built CSS checks. Update docs/system-design.md and the handbook contract; store representative screenshots.

## Decisions
The user has supplied concrete styling requirements; proceed without another design approval. Production changes are reversible and already authorized. Investigate actual font glyph coverage before claiming the Chinese names use the requested font.
