# Thinking loading-screen prototype

A screenshot-based aesthetic assessment and three generated composition directions are available in [`review/assessment.md`](./review/assessment.md). The visual exploration keeps the chosen character/thought/bulb metaphor and grounds it in the existing Bright School paper-and-ink theme. The user selected the third displayed concept. The runnable sample now follows its compact thought composition, retaining approved sprite pixels. Generated direction boards remain illustrative and must not replace validated problem images.

Open `docs/design-samples/loading-page.html` through a static server rooted at the repository. The current local preview is `http://127.0.0.1:5179/docs/design-samples/loading-page.html`.

The dedicated phone preview is `docs/design-samples/loading-page-mobile.html`, locally `http://127.0.0.1:5179/docs/design-samples/loading-page-mobile.html`. On desktop it embeds the same sample at a real 390×844 viewport; on a phone it fills the available screen. Updated desktop and phone captures are `preview-desktop.png` and `preview-mobile.png` in this directory.

The selected cloud stays fixed and alternates `cloud-selected.png` and `cloud-selected-alternate.png` every 250ms, at 4fps. Its two warm-brown contours have matched position and brightness. Complementary stepped opacity keeps exactly one drawing visible; puzzle content remains stationary. Real round-bubble PNGs connect through the empty space outside the character. The bulb keeps its 41-degree desktop / 40-degree phone rotation, with separated crown marks. Completion pauses the current cloud frame for the 2-second still hold; reduced motion shows a static waiting character/cloud.

The standalone sample follows the requested new loading composition: blinking character centered above the original table, a compact thought cloud above and to the left, three separate circular bubbles, a hand-drawn lightbulb beside the head and only the existing tip text below the table. The visual sample includes `problem-preview.png`, exported from the actual lower-left teaching board in `guide.html#doc-liberty-question-1` (viewBox crop 18,180,188,188). It is a source-backed teaching example; integration must supply real problem images. Preview controls allow a local image to be shown in the slot; that file is never uploaded.

The bulb glass chamber starts transparent. A yellow gradient is clipped by an alpha mask derived from the generated ink contour. Its horizontal boundary rises in bulb-local coordinates from the glass bottom to the crown, following the bulb's rotation. `prepare-assets.py` writes the mask's normalized vertical bounds to `bulb-geometry.js`; progress maps only to the chamber, excluding the empty screw base. At 100%, rays appear and the character switches to the approved still expression. The scene and tip remain still. After exactly 2000 ms, the composition dispatches a bubbling `loading:complete` event; the sample remains on its finished state until replay. Production navigation can consume that event when the design is integrated.

## Tip layout

The scene has a viewport-based width/aspect ratio and a fixed top anchor, independent of Tip height. Tip follows in normal document flow. Longer text grows downward without recentering, shrinking or moving any illustration element; compact screens can scroll vertically. Stable scrollbar space prevents text overflow from changing available scene width. The hand-written Tip label uses a blush brush asset; body copy uses the project's UI font with natural, untruncated wrapping.

## Preview controls

- The initial preview runs a 12-second demonstration and a 2-second completion hold.
- Expand the lower-left preview controls to replay, inspect 0/50/100 percent or move the progress slider.
- `?progress=0`, `?progress=50`, `?progress=100` open fixed stages.
- Reduced-motion preferences show a static waiting character.
- Default tips are extracted by `prepare-assets.py` from `DEFAULT_SITE_SETTINGS.preloadTips`; they use the existing `Tip：` format and 10-second cadence. Runtime integration should use the live `siteSettings.preloadTips` rather than this sample snapshot.

## Assets and prompts

The character sprite uses the approved 1216×832 frames with original alpha. `loading-blink-fast.webp` retains every compressed frame payload, changing only the initial waiting duration from 2400 to 1200ms; remaining durations are 65/110/85/140ms. The loop is 1600ms (previously 2800ms), about 1.75 times as frequent. The original `loading-blink.webp` remains available. Selected cloud, round bubble, Tip brush and `bulb-selected.png` assets were generated with the built-in imagegen tool; prior assets and rays are retained. Cloud source contours are 10–11px, circle contours about 24px and bulb contours about 30px, scaled to consistent visible weights. The selected bulb has its own `bulb-selected-interior.png` alpha mask. `prepare-assets.py` uses the selected bulb when present and otherwise the original; normalized fill geometry always derives from that input. Exact new prompts and alpha checks are in `review/assets-prompts.md` and `review/supporting-prompts.md`. The paper grid reuses `public/assets/home/home-paper-grid.svg`.

Earlier asset prompts (retained for history):

1. Cloud (replacement): one landscape 3:2 thought bubble, generous blank pure-white interior for a Go puzzle; broad fluffy rounded lobes of naturally varied sizes, soft flowing asymmetry instead of repetitive beads; thin warm-charcoal hand-drawn contour, restrained line variation, no double outlines, grain, internal lines or shadows; transparent exterior; no text, tail, extra clouds, icons, character, stars or puzzle. Generated replacement is saved at `assets/cloud.png` (1536×1024).
2. Alternate cloud frame: redraw the original at the same canvas, position and extent, retaining white center and warm charcoal contour; subtly change broad lobes locally by 12–20px, slightly flatter central crown and rounder adjacent lobes; no shift, extra lines, decoration, shadow or text; transparent exterior. Saved at `assets/cloud-alternate.png` (1536×1024).
3. Bulb: one upright classic lightbulb, circular pear-shaped chamber and small screw base, warm charcoal hand-drawn contour; glass and base interior genuinely transparent; no filament, rays, lettering, shadows or colored fill; portrait 3:4 with margins. The generated asset is 1086×1448; `bulb-interior.png` is a derived RGBA alpha mask for the chamber only.
4. Rays: edit the supplied reference to create three separated irregular chunky trapezoid yellow emission marks; soft buttery yellow fill, thin wobbly charcoal pencil contour; remove the white background; retain transparent gaps; no stars, lightning bolt, bulb or text. The final composition uses one cluster above the completed bulb, rotated 180 degrees relative to the initial sample.

This is a visual prototype, following the repository's existing design-sample convention. It does not replace `AssetPreloadScreen`, alter startup or battle timing, connect APIs, or change the tutorial/corruption loading contracts.

## Validation

Final browser QA covers 0/10/50/90/100% bulb-axis fill, transparent chamber, completed still expression, rays, the 2-second completion boundary, reset, local puzzle selection, desktop, mobile portrait and compact landscape. Browser QA checks exclusive frame alternation, stationary containers, circular connector/sprite separation and completion pause. Short/configured-long/stress-long Tip tests assert identical scene, character, cloud, bubble and bulb bounds at 390×844, 360×640, 1440×900 and 932×430. The phone wrapper is verified at a real 390×844 inner viewport. Reduced-motion CSS and JS were retained and source-reviewed; the native OS preference was not toggled in this pass. Browser console errors are zero. Final visual comparisons are `review/selected-comparison-final.png` and `review/selected-details-final.png`; completion and compact long-Tip captures are in the same directory. The project-root [`design-qa.md`](../../../design-qa.md) records the passed fidelity review and acceptable adaptations from the generated mock.
