# Thinking loading-art prototype

## Scope
The independent loading design sample lives at `docs/design-samples/loading-page.html`. It follows the existing design-sample convention and does not alter production preload, tutorial, battle or corruption behavior. Its tip snapshot is extracted from `DEFAULT_SITE_SETTINGS.preloadTips`; production integration must consume the live configured value.

## Visual and timing contracts
- Zero percent: the bulb chamber is genuinely transparent and rays are hidden.
- Intermediate progress: a horizontal boundary in bulb-local coordinates rises from the glass bottom to its crown, clipped by the chamber shape. Rotate the whole bulb, including its fill; do not use a diagonal local boundary. Derive normalized top/bottom positions from the RGBA chamber mask into `bulb-geometry.js`, so low progress is already visible inside the neck.
- One hundred percent: show the approved still character, reveal the rays, stop tip rotation and keep the entire composition still. Dispatch `loading:complete` after 2000 ms. Resetting progress before the hold expires cancels that event.
- Reduced motion uses the static waiting sprite. The Go problem slot stays empty until a real image is supplied; local sample selection uses an object URL rather than an upload.
- Only one comic glow-mark cluster appears above the bulb head. The corrected cluster is flipped 180 degrees from the initial sample, occupies 38% of bulb width and has a visible gap above the crown; no side clusters remain.
- Cloud position and puzzle content remain fixed. Alternate `cloud.png` and `cloud-alternate.png` exclusively every 250ms (4fps, 500ms cycle), with complementary stepped opacity, creating hand-drawn contour animation. Completion pauses the current frame via CSS; resetting resumes. Reduced motion shows only the original drawing. Connecting bubbles are static white circles with charcoal outlines routed outside the sprite silhouette.
- `loading-blink-fast.webp` repeats every 1600ms, retaining the approved WebP frame payloads. Only the initial open-eye waiting duration changes from 2400ms to 1200ms; the 65/110/85/140ms blink transitions remain unchanged.
- `loading-page-mobile.html` embeds the same composition at a real 390×844 iframe viewport on desktop; a phone displays it edge to edge. Deliver both desktop and phone preview links/captures when refining this surface.

## Mask and geometry validation
`prepare-assets.py` derives the interior from the bulb ink contour. Save the result as **RGBA with zero alpha outside the chamber**, not a grayscale PNG: CSS image masks default to alpha, so an opaque grayscale image would fill the entire bounding rectangle. The mask must exclude the screw base and canvas exterior.

Verify 0/50/100 percent, completion timing, reset, tip freeze, image slot and reduced motion. Check desktop 1440×900, portrait 390×844 and 360×640, and landscape 932×430. Budget the full character-image bounds above the tip; rotated ray boxes can create overflow even when their painted strokes remain inside the viewport.
