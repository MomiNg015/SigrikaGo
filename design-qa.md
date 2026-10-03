# Selected loading illustration: design QA

Source: `docs/design-samples/loading-page/review/concept-3.png`, third displayed direction selected by the user.

Implementation: `docs/design-samples/loading-page.html` and the dedicated phone wrapper. Required primary viewport: 390×844, waiting at 65% progress. Desktop and compact phone layouts are adaptations of that mobile source.

User constraints take precedence over generated mock details: preserve original character pixels, original Tip wording, faster approved blink loop, separate head glow marks, bulb-axis fill, static completion hold, and Tip growth strictly downward.

## Comparison history

1. Initial full-view comparison: `docs/design-samples/loading-page/review/selected-comparison-initial.png`. Result was blocked. [P1] The square puzzle extended beyond its intended slot because the grid track used intrinsic minimum sizing. [P2] Tip label/body flex layout produced an orphaned final line. [P2] Circle and bulb contours appeared thinner and lighter than the cloud/reference.
2. Fixes: constrained grid tracks with `minmax(0,1fr)` and image minima of zero; reduced/repositioned the contained board for visible inner margins. Replaced Tip flex layout with a balanced text paragraph and inline label. Generated stronger warm-brown cloud/circle/bulb contours, matching frame centers/luminance, and derived a new alpha mask from the selected bulb rather than reusing the old shape.
3. Revised comparison at the same 390×844 viewport, same configured Tip and 65% waiting state: `docs/design-samples/loading-page/preview-mobile.png`. Full-view source/render evidence is `docs/design-samples/loading-page/review/selected-comparison-final.png`. Focused source/render evidence is `docs/design-samples/loading-page/review/selected-details-final.png`, covering cloud/board margins, circle/bulb contours and Tip typography/wrapping. Both combined inputs were opened and reviewed, followed by a separate read-only visual review. No remaining actionable P0/P1/P2 differences were found.

Additional browser-rendered evidence: `docs/design-samples/loading-page/preview-desktop.png` (1440×900, 65%); `docs/design-samples/loading-page/review/selected-mobile-complete.png` (390×844, 100%); `docs/design-samples/loading-page/review/selected-compact-long-tip.png` (360×640, configured long Tip).

## Required checks

- Fonts/typography: existing LoadingHand label confirmed loaded; UI body text remains readable, balanced, untruncated at each viewport. The generated mock's handwritten Latin label is more casual than the actual project font; this is acceptable P3 polish, not a missing-font failure.
- Spacing/layout: thought cloud, circles outside the left silhouette, bulb at the right temple and Tip below the original desk follow the selected hierarchy. Fixed scene anchor is independent of dynamic text. Short (8 characters), configured-long (44) and stress-long (340) tips leave the exact x/y/width/height of all seven scene elements unchanged at 390×844, 360×640, 1440×900 and 932×430. At 390×844 Tip top remains 642.859375px while its height grows from 30.75px to 447px; the extra document height appears below. Horizontal overflow is zero.
- Colors/tokens: warm cream #fffbf2 paper, restrained original grid, deep brown contours near #4a3736 and blush Tip stroke match the chosen paper-and-ink direction. Yellow bulb fill remains the user's specified gradient and becomes fully filled at completion.
- Image fidelity: original approved sprite canvas/alpha remains intact; no generated mock redraw replaces it. Cloud frames share dimensions, center and luminance; circle/brush/bulb use actual generated raster assets. The selected bulb uses its own alpha mask, excluding the screw base/exterior. Browser pixel checks find zero connector/sprite overlap. Real teaching-board export intentionally replaces the generated illustrative stones. No decorative placeholder shapes replace the source illustrations.
- Copy/content: original configured Tip wording and cadence retained; representative teaching image is labelled accurately. Local image selection decodes an object URL without uploading. No additional product loading copy was introduced. Preview controls are confined to a collapsed sample-only panel.
- Interactions: 0/10/50/90/100% stages follow the bulb-local bottom-to-crown axis. Rays remain hidden below 100%. Completion uses the approved still expression, freezes the current cloud drawing and Tip, and dispatches its event after the 2000ms hold (observed 2011.7ms); resetting before expiry cancels it. The 1600ms blink loop is retained. Cloud frames are exclusive, with opacity pairs [1,0] and [0,1]. The phone wrapper is 390×844 internally both on desktop and on a 390×844 phone. Fresh browser console errors/warnings: zero.

## Acceptable adaptations and residual coverage

- Original sprite proportions are preserved rather than stretching/redrawing them to reproduce the generated concept's changed torso. This is required by the user-approved expression workflow.
- Actual teaching-board positions, regular edges and project typography replace generated details. The board's bottom corner spacing is slightly tighter but fully contained; P3 only.
- Paper texture is quieter than the generated mock and reuses the real project asset. Preview controls are additional sample tooling, not part of the proposed production screen.
- Reduced-motion CSS/JS contract was retained and source-reviewed; the native OS preference and screen-reader announcement sequence were not exercised in this pass. This report does not claim a full accessibility audit or production preload integration.

## Implementation checklist

- [x] Selected concept implemented with original sprite and individual raster assets.
- [x] Initial P1/P2 findings fixed and recaptured in full/focused combined comparisons.
- [x] Desktop, phone wrapper, compact mobile and landscape geometry checked.
- [x] Tip only grows down; progress, completion hold/reset and local puzzle selection verified.
- [x] System design and loading-art contracts updated.

## Connector weight revision

The user requested thicker connecting circles after the selected-composition handoff. This overrides the mock's thin connector contours. The current raster is `round-thought-bubble-bold.png`: 512×512 RGBA, warm-brown ink, transparent center/exterior, approximately 60px center-axis stroke versus the old 23px. It displays at approximately 3.6/2.3/1.6px on the three phone connectors. No CSS layout or animation code changed.

The latest mobile and desktop captures and the combined full/focused source comparisons above have been refreshed. The prior mobile capture is retained as `review/bubbles-before-mobile.png` for comparison history. Full and focused inputs were opened again: all three rings remain hollow and legible, with a stronger first circle and readable smallest circle. Increased visual weight is the requested adaptation; no new P0/P1/P2 issue remains. Current desktop/phone browser checks again confirm zero circle/sprite overlap, stable scene bounds across Tip lengths and no horizontal overflow. Console errors/warnings: zero. Older complete/compact screenshots document the prior stroke version's unchanged behavior rather than claiming the current line weight.

final result: passed
