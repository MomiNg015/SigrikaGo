# Thinking loading-screen prototype

Open `docs/design-samples/loading-page.html` through a static server rooted at the repository. The current local preview is `http://127.0.0.1:5179/docs/design-samples/loading-page.html`.

The standalone sample follows the requested new loading composition: blinking character centered above the original table, a large thought cloud above and to the left, three separate smaller clouds, a hand-drawn lightbulb beside the head and only the existing tip text below the table. The cloud is intentionally empty until a life-and-death problem image is provided. Preview controls allow a local image to be shown in the slot; that file is never uploaded.

The bulb glass chamber starts transparent. A yellow gradient is clipped by an alpha mask derived from the generated ink contour; a diagonal half-plane reveals the fill from bottom left to top right. At 100%, rays appear and the character switches to the approved still expression. The scene and tip remain still. After exactly 2000 ms, the composition dispatches a bubbling `loading:complete` event; the sample remains on its finished state until replay. Production navigation can consume that event when the design is integrated.

## Preview controls

- The initial preview runs a 12-second demonstration and a 2-second completion hold.
- Expand the lower-left preview controls to replay, inspect 0/50/100 percent or move the progress slider.
- `?progress=0`, `?progress=50`, `?progress=100` open fixed stages.
- Reduced-motion preferences show a static waiting character.
- Default tips are extracted by `prepare-assets.py` from `DEFAULT_SITE_SETTINGS.preloadTips`; they use the existing `Tip：` format and 10-second cadence. Runtime integration should use the live `siteSettings.preloadTips` rather than this sample snapshot.

## Assets and prompts

The character sprite is the user's previously approved loading-blink WebP and completed expression; canvas 1216×832, preserving the original alpha. Cloud, bulb and rays were created with the built-in imagegen tool and copied into `assets/`.

Final prompt set:

1. Cloud: one large standalone hand-drawn thought-cloud bubble, irregular scalloped oval with about ten puffy lobes; slightly wobbly warm charcoal ink and occasional pencil echo; white interior with a large blank center for a future Go puzzle; landscape 3:2; transparent background; no text, stones, characters, tail or extra clouds.
2. Bulb: one upright classic lightbulb, circular pear-shaped chamber and small screw base, warm charcoal hand-drawn contour; glass and base interior genuinely transparent; no filament, rays, lettering, shadows or colored fill; portrait 3:4 with margins. The generated asset is 1086×1448; `bulb-interior.png` is a derived RGBA alpha mask for the chamber only.
3. Rays: edit the supplied reference to create three separated irregular chunky trapezoid yellow emission marks; soft buttery yellow fill, thin wobbly charcoal pencil contour; remove the white background; retain transparent gaps; no stars, lightning bolt, bulb or text. Repeat and rotate this cluster around the completed bulb.

This is a visual prototype, following the repository's existing design-sample convention. It does not replace `AssetPreloadScreen`, alter startup or battle timing, connect APIs, or change the tutorial/corruption loading contracts.

## Validation

Local browser QA covers fixed stages, diagonal fill, transparent chamber, completed still expression, rays, the 2-second completion boundary, replay, puzzle slot, reduced motion, desktop, mobile portrait and compact landscape. Screenshots and the local report are under `.tmp/loading-page-qa/`.
