# Supporting asset prompts

Generated with the built-in imagegen tool. Original outputs remain under `C:/Users/莫名/.codex/generated_images/01a101a4-3c00-70f0-b51d-adb0def8f88a/`. Assets were cropped/padded and resampled for practical UI delivery while preserving alpha.

## Round thought bubble

Final asset: `../assets/round-thought-bubble.png`, RGBA 512 × 512. Single warm brown outline; interior and exterior are transparent so the warm page paper shows through. Final contour was thickened to approximately 24 pixels for legibility at small UI sizes. Original final output: `exec-a0bdbf34-6e22-4abb-bf33-cc3a30421a13.png`.

Generate a single handdrawn circle outline only, color dark warm brown #4a3736, stroke width 20 pixels at final 512x512. A circular line ring outline, approximately diameter 480 px, perfectly centered with 16 px padding on a 512x512 canvas. Interior AND exterior are transparent. Outline is a single closed dark brown clean ink pen line with very subtle natural hand wobble. A clean 2D UI bubble contour. No fill, no white pixels, no colored interior, no gradients, no shading, no shadows, no texture, no rough grain, no bevel, no lighting, no additional objects or lines, no text. True transparent background.

Round-bubble final refinement prompts:

Precise object edit of the attached circular outline asset. Preserve the exact square 512 by 512 composition, the same circle outer boundary position with about 16 pixels outer margin, the slightly handdrawn round shape, and fully transparent interior AND exterior. Increase the single contour thickness from about 13 pixels to about 25 pixels at 512 size, approximately twice the existing line width. Make the ink solid deep warm brown #4a3736. Keep the outer edge fixed and thicken toward the interior. It must remain a single closed uniform brown ring, not two nested lines. No fill: circle interior is fully transparent. No white, no shadows, no gradients, no lighting, no grain, no bevel, no extra objects. Only thicken and darken the existing brown contour. The thick source outline will display about 1.5px at 30px UI width.

Precise object edit: keep the attached circle asset and its transparent background, the same outer boundary, composition and natural slightly handdrawn circular contour. Increase the existing single brown line thickness by about 20 percent, thickening inward only. Target final stroke width 26 pixels when this asset is resampled to 512x512. Solid deep dark warm brown ink #4a3736. Only one continuous brown circular ring. Interior and exterior remain completely transparent. Do not add fill, highlights, white pixels, shadow, texture, shading, gradients, second contour, decoration or other objects. Preserve the closed circle's shape and placement. Output is a flat minimal circular UI outline.

## Selected bulb contour

Candidate asset: `../assets/bulb-selected.png`, RGBA 1086 × 1448, original final output `exec-c1db0560-135a-4fd9-a70b-5eeaa30f6833.png`. Deep warm brown single handdrawn contour; bulb interior, exterior, and screw gaps remain transparent. Mid-glass contour measures about 30–31 px. Built-in generation slightly adjusted the bulb contour; derive a fresh glass mask instead of reusing the former mask. Verified flood-filled chamber bounds: `(154, 124, 962, 1116)`, area approximately 36.5% of canvas; no flood leakage to exterior or screw base. Original `bulb.png` was preserved.

Precise object edit of the attached hollow handdrawn lightbulb PNG for a game loading UI. Keep exactly the original 1086 by 1448 portrait canvas, the original bulb outer silhouette, all positions, scale and proportions, same round upper bulb shape and short rounded narrow neck, same lower screw base with three diagonal screw threads and rounded bottom tip. Change ONLY the single line: make every line fully opaque deep warm brown #4a3736, clean and legible, with approximately 26px consistent source stroke width at original 1086px canvas width. Slight natural handdrawn pen contour, smooth tidy line, no rough grain. Entire glass interior remains fully transparent; the exterior is fully transparent too. Preserve transparent spaces between the screw threads and below the glass. Do not add glass fill, white fill, filament, interior lines, rays, highlights, glow, shadows, gradients, or any additional decoration. One single bulb contour, not a double outline. Original shape and position must be preserved so a derived interior mask can fit. Do not crop, shift, rotate or reframe the bulb.

## Tip brush

Final asset: `../assets/tip-brush.png`, RGBA 512 × 128. Original: `exec-6885d276-9294-4eea-9e05-2693d72b3fa1.png`.

Use case: illustration-story. Asset type: small hand-painted underline accent underneath the Tip label in a warm paper game interface. Create one restrained horizontal blush pink marker brush stroke color #ff9ebb, soft and lightly translucent with organic brush ends, roughly 4:1 width to height. A simple single swipe from left to right, subtle gentle irregular edges, not a large paint splatter. Flat 2D illustration with no lighting or shadow. Transparent background outside the pink stroke, no paper texture, no text, no icons, no other decoration. Compose centered with generous transparent margin, deliver only the isolated pale pink brush stroke.
