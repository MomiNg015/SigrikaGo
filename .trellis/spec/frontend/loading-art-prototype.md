# Thinking loading-art prototype

## Scope
The independent loading design sample lives at `docs/design-samples/loading-page.html`. It follows the existing design-sample convention and does not alter production preload, tutorial, battle or corruption behavior. Its tip snapshot is extracted from `DEFAULT_SITE_SETTINGS.preloadTips`; production integration must consume the live configured value.

## Visual and timing contracts
- Zero percent: the bulb chamber is genuinely transparent and rays are hidden.
- Intermediate progress: a horizontal boundary in bulb-local coordinates rises from the glass bottom to its crown, clipped by the chamber shape. Rotate the whole bulb, including its fill; do not use a diagonal local boundary. Derive normalized top/bottom positions from the RGBA chamber mask into `bulb-geometry.js`, so low progress is already visible inside the neck.
- One hundred percent: show the approved still character, reveal the rays, stop tip rotation and keep the entire composition still. Dispatch `loading:complete` after 2000 ms. Resetting progress before the hold expires cancels that event.
- Reduced motion uses the static waiting sprite. The Go problem slot stays empty until a real image is supplied; local sample selection uses an object URL rather than an upload.
- Only one comic glow-mark cluster appears above the bulb head. The corrected cluster is flipped 180 degrees from the initial sample, occupies 38% of bulb width and sits close to the crown; no side clusters remain.
- Cloud movement uses independent randomized 4.2–6 second translations while progress is below 100: large cloud x ±8–14px / y ±9px, connectors x ±2–4px / y ±2.5px. Alternate left/right excursions to ensure visible amplitude. Cancel superseded animations each cycle. Completion pauses the current animation time rather than returning to an origin, avoiding a visible snap; resetting progress resumes movement. Reduced motion disables it. Route connectors outside the sprite silhouette and verify the entire maximum drift envelope, not only static positions.
- `loading-page-mobile.html` embeds the same composition at a real 390×844 iframe viewport on desktop; a phone displays it edge to edge. Deliver both desktop and phone preview links/captures when refining this surface.

## Mask and geometry validation
`prepare-assets.py` derives the interior from the bulb ink contour. Save the result as **RGBA with zero alpha outside the chamber**, not a grayscale PNG: CSS image masks default to alpha, so an opaque grayscale image would fill the entire bounding rectangle. The mask must exclude the screw base and canvas exterior.

Verify 0/50/100 percent, completion timing, reset, tip freeze, image slot and reduced motion. Check desktop 1440×900, portrait 390×844 and 360×640, and landscape 932×430. Budget the full character-image bounds above the tip; rotated ray boxes can create overflow even when their painted strokes remain inside the viewport.
