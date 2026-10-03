# Concept 3 cloud assets

Generated using the built-in imagegen tool on 2026-10-03. Existing assets preserved.

Final assets: `../assets/cloud-selected.png` and `../assets/cloud-selected-alternate.png`. Both are RGBA PNG at 1402×1122; the tool chose a canvas close to the requested 1280×1024. Transparent exterior, warm-white blank center, broad organic lobes, one warm-brown outline. Final opaque contour bounds are A `(105, 123, 1296, 1004)`, B `(104, 122, 1297, 1005)` (alpha > 128). The initial B variant was darker and was discarded after a targeted ink-matching edit. Final outline medians: A RGB `(94, 66, 50)`, B `(100, 67, 50)`; apparent brightness is close and stable, with tiny local contour differences.

## Frame A prompt

Use case: background-extraction / precise-object-edit.
Asset type: transparent PNG frame A, hand-drawn thought cloud for a game loading screen.
Input image 1 is the reference/mockup. Extract and redraw ONLY the large thought cloud in its upper left, removing the Go board and all stones from its interior. Do not reproduce the full screen.
Render one centered cloud on a 1280 by 1024 canvas, with genuinely transparent exterior. Rounded broad soft lobes, an irregular organic yet balanced shape, about 1.27:1 width to height, matching the mockup. Keep at least 5 percent transparent margin around it.
The inside is a clean solid warm white approximately #fffdf8, blank and spacious. The outline is ONE clean slightly hand-drawn deep warm brown ink line approximately #5b4638, a thin consistent 5-pixel stroke at this output size. Match the restrained pleasing cloud contour of the reference, about 9 broad lobes, not repetitive scallops.
Constraints: no puzzle, no board, no stones, no letters, no thought-tail, no small bubbles, no character, no bulb, no paper backdrop, no background, no drop shadow, no gradient, no glow, no second inner outline, no sketch hatching. Sharp clean anti-aliased edges. This is frame A for a two-frame contour animation; keep overall center and size stable.

## Frame B prompt

Use case: precise-object-edit.
Asset type: transparent PNG, frame B of a two-frame thought-cloud contour animation.
Input image 1 is the exact target frame A. Create its very subtly redrawn alternate contour frame. Preserve the SAME canvas 1402 by 1122, transparent exterior, cloud centered in the same place, same overall bounds and proportions, same warm-white interior, same dark warm-brown outline ink hue, luminance and thickness.
ONLY shift a few individual lobe contours by approximately 6 to 10 pixels inward or outward, with an organic hand-drawn redraw. Keep all lobes, cloud center and visual weight stable. This will alternate with A at 4 frames per second, so absolutely avoid changes to stroke darkness or background brightness that would cause flashing. Leave broad blank interior entirely unchanged.
No new object, no thought-tail, no bubbles, no text, no board, no stones, no shadow, no glow, no double line, no extra texture. The outside must remain truly transparent and the whole cloud must remain inside the canvas.

## Final frame B ink correction prompt

Use case: precise-object-edit.
Asset type: transparent PNG alternate cloud contour animation frame.
Input image 1 is the edit target (cloud B). Input image 2 is the COLOR/STROKE reference (cloud A).
Fix only B's outline so its warm brown ink is IDENTICAL in color, brightness and thickness to A. A's opaque outline color is approximately RGB (94,66,50) or #5e4232, and the outline is around 8 px at this 1402x1122 image size. B is currently darker; correct it to match A precisely. Keep B's contour geometry, lobe positions, center, 1402x1122 canvas and transparent exterior unchanged. Keep interior warm white identical to A too.
Goal is no perceptible ink-color or brightness flicker when alternating A/B at 4 fps. Do not recreate the shape, do not add anything. No shadow, glow, board, text, pattern, extra ink line or backdrop. Preserve true transparency outside the cloud.


## Final stronger ink revision

Visual QA at a phone-width scale showed the first assets were too lightly outlined. They were superseded by built-in edits, keeping the 1402×1122 transparent canvases and blank warm-white centers. Final opaque outline medians: A RGB `(77, 50, 46)`, B `(82, 49, 43)`; their weighted RGB brightness differs by under one level, so no substantial ink brightness flicker is expected. Top-center opaque line width measures 10px in A and 11px in B. Alpha > 128 bounds: A `(105, 115, 1297, 1007)`, B `(103, 118, 1299, 1009)`.

### Frame A stronger ink prompt

Use case: precise-object-edit.
Input image is cloud animation frame A, the exact edit target.
Change ONLY the cloud outline: make its single continuous stroke deep dark warm brown #4a3736, uniform 10 pixels thick at the ORIGINAL 1402x1122 canvas resolution. The current outline is too thin and light when scaled to 260 px wide; the new contour must read clearly and confidently at small display size. Use a flat solid ink color, no grain or shaded ink.
Aggressively preserve all other features: exact 1402x1122 canvas, centered cloud, all existing lobe shapes and overall cloud bounds, unchanged warm-white blank interior, genuinely transparent exterior. Keep contour organic and lightly hand-drawn. No second stroke, no shadow, no glow, no new texture, no object or text. Do not redraw a new cloud; only recolor and thicken this existing outline.

### Frame A line-width correction

Use case: precise-object-edit.
This cloud is the exact edit target. Its last edit made the outline too wide: it measures about 15 pixels at the top. Correct ONLY the single dark warm-brown outline by reducing stroke width to 10 pixels, exactly two thirds of its present thickness. Color should remain deep brown, solid #4a3736 (RGB 74,55,54). Avoid varying luminance around the contour.
Preserve 1402 by 1122 canvas, cloud center and lobe geometry, transparent exterior, warm-white blank interior and margins. Expand the white interior toward the outline slightly to achieve the thinner 10px stroke without changing cloud position. No double line, no shadow, no backdrop, no additional texture. This frame will be paired with another matching animation frame and must have a restrained clean ink line.

### Frame B matching prompt

Use case: precise-object-edit.
Input image 1 is the EDIT TARGET: cloud frame B. Input image 2 is the APPROVED STYLE REFERENCE: stronger ink frame A.
Change ONLY B's outline to EXACTLY match A's dark brown ink color and stroke weight. A's measured opaque ink median is RGB (77,50,46), and the stroke is 10 pixels thick at the top. Copy that same solid warm dark brown 10px stroke for B. Do not make it wider than A. This pair must alternate at 4 frames per second with no color or line-weight flashing.
Preserve B's existing subtle alternate lobe shapes, center, overall cloud size, 1402x1122 canvas, genuinely transparent exterior, warm-white blank interior. No shifted cloud, no extra contour, no shadows, no texture, no glow, no background, no board or text. Only recolor and slightly thicken B's outline to match the second reference.

