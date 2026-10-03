# Thinking loading-screen prototype

Open `docs/design-samples/loading-page.html` through a static server rooted at the repository. The current local preview is `http://127.0.0.1:5179/docs/design-samples/loading-page.html`.

The dedicated phone preview is `docs/design-samples/loading-page-mobile.html`, locally `http://127.0.0.1:5179/docs/design-samples/loading-page-mobile.html`. On desktop it embeds the same sample at a real 390×844 viewport; on a phone it fills the available screen. Updated desktop and phone captures are `preview-desktop.png` and `preview-mobile.png` in this directory.

The refined cloud is one third wider and slightly farther right, with broad irregular soft lobes and a clean single contour; its connectors curve through empty space to the character's left, with no opaque sprite overlap even at the motion limits. The bulb is two thirds of its previous width and adds 30 degrees clockwise rotation: 41 degrees on desktop, 40 on phones. One comic glow cluster sits close above its head, flipped 180 degrees from its initial orientation and enlarged from 25% to 38% of bulb width. Clouds drift along independently randomized 4.2–6 second paths: main cloud x ±8–14px / y ±9px, connectors x ±2–4px / y ±2.5px. Completion pauses their current positions during the 2-second still hold. Reduced motion disables cloud movement as well as blinking.

The standalone sample follows the requested new loading composition: blinking character centered above the original table, a large thought cloud above and to the left, three separate smaller clouds, a hand-drawn lightbulb beside the head and only the existing tip text below the table. The cloud is intentionally empty until a life-and-death problem image is provided. Preview controls allow a local image to be shown in the slot; that file is never uploaded.

The bulb glass chamber starts transparent. A yellow gradient is clipped by an alpha mask derived from the generated ink contour. Its horizontal boundary rises in bulb-local coordinates from the glass bottom to the crown, following the bulb's rotation. `prepare-assets.py` writes the mask's normalized vertical bounds to `bulb-geometry.js`; progress maps only to the chamber, excluding the empty screw base. At 100%, rays appear and the character switches to the approved still expression. The scene and tip remain still. After exactly 2000 ms, the composition dispatches a bubbling `loading:complete` event; the sample remains on its finished state until replay. Production navigation can consume that event when the design is integrated.

## Preview controls

- The initial preview runs a 12-second demonstration and a 2-second completion hold.
- Expand the lower-left preview controls to replay, inspect 0/50/100 percent or move the progress slider.
- `?progress=0`, `?progress=50`, `?progress=100` open fixed stages.
- Reduced-motion preferences show a static waiting character.
- Default tips are extracted by `prepare-assets.py` from `DEFAULT_SITE_SETTINGS.preloadTips`; they use the existing `Tip：` format and 10-second cadence. Runtime integration should use the live `siteSettings.preloadTips` rather than this sample snapshot.

## Assets and prompts

The character sprite is the user's previously approved loading-blink WebP and completed expression; canvas 1216×832, preserving the original alpha. Cloud, bulb and rays were created with the built-in imagegen tool and copied into `assets/`.

Final prompt set:

1. Cloud (replacement): one landscape 3:2 thought bubble, generous blank pure-white interior for a Go puzzle; broad fluffy rounded lobes of naturally varied sizes, soft flowing asymmetry instead of repetitive beads; thin warm-charcoal hand-drawn contour, restrained line variation, no double outlines, grain, internal lines or shadows; transparent exterior; no text, tail, extra clouds, icons, character, stars or puzzle. Generated replacement is saved at `assets/cloud.png` (1536×1024).
2. Bulb: one upright classic lightbulb, circular pear-shaped chamber and small screw base, warm charcoal hand-drawn contour; glass and base interior genuinely transparent; no filament, rays, lettering, shadows or colored fill; portrait 3:4 with margins. The generated asset is 1086×1448; `bulb-interior.png` is a derived RGBA alpha mask for the chamber only.
3. Rays: edit the supplied reference to create three separated irregular chunky trapezoid yellow emission marks; soft buttery yellow fill, thin wobbly charcoal pencil contour; remove the white background; retain transparent gaps; no stars, lightning bolt, bulb or text. The final composition uses one cluster above the completed bulb, rotated 180 degrees relative to the initial sample.

This is a visual prototype, following the repository's existing design-sample convention. It does not replace `AssetPreloadScreen`, alter startup or battle timing, connect APIs, or change the tutorial/corruption loading contracts.

## Validation

Local browser QA covers 0/10/50/90/100% bulb-axis fill, transparent chamber, completed still expression, rays, the 2-second completion boundary, replay, puzzle slot, reduced motion, desktop, mobile portrait and compact landscape. Connector alpha overlap is checked throughout the full drift envelope. Screenshots and local reports are under `.tmp/loading-page-qa/`.
