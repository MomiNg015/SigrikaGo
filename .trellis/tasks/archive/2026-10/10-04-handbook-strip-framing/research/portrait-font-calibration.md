# Fixed portrait framing and font coverage

## Source and reading method

Nine production `public/assets/characters/handbook-sprites/*.webp` sources are exactly 832x1216 (lossless, manifest preserves alpha/RGB). Read-only QA composites were captured in `.tmp/head-calibration.png` (x220..660,y0..340, grid50) and `.tmp/eye-calibration.png` (x280..560,y120..280, grid20, 2x). No sprite/source or production implementation was changed.

The following explicit values are initial manual visual calibration, not automatic landmark detection. Eye Y is the average pupil center of both eyes; Mornye has one visible eye, so its reading is the visible eye only. Head width uses the main head/hair mass, excluding long hair tails, ribbons, halo and distant accessories. Face width is a perceived facial size denominator, useful to prevent Qiuyuan's adult face becoming much smaller than the others. Expect approximately +/-5 source pixels for eye Y and +/-10px for widths; validate the final rendered strip once and tune by sight.

| ID | eyeCenterX | eyeLineY | headWidth | faceWidth |
|---|---:|---:|---:|---:|
| sigrika | 405 | 181 | 270 | 146 |
| denia | 422 | 202 | 266 | 154 |
| aemeath | 391 | 182 | 228 | 136 |
| lynae | 377 | 163 | 234 | 132 |
| mornye | 422 | 219 | 260 | 138 |
| chisa | 433 | 153 | 234 | 142 |
| changli | 417 | 146 | 242 | 132 |
| qiuyuan | 389 | 160 | 232 | 118 |
| nabomo | 402 | 216 | 282 | 160 |

Old adapter `focal` values were general crop anchors, frequently below the eyes (e.g. Lynae y181 vs eye y163, Denia y217 vs eye y202). Do not use them as a common eye line.

Fixed desktop frame formulas: `scale = desiredFacePx / faceWidth`; image dimensions `832*scale,1216*scale`; `left = desiredFaceCenterX - eyeCenterX*scale`; `top = commonEyeY - eyeLineY*scale`. The image scale and top are independent of active slice width; only its clip reveals additional bust/arms. If the user's interpretation prioritizes total cranial width instead of facial width, use `desiredHeadPx/headWidth` consistently, then visually verify the tilted heads. Never swap denominators when hovered.

For mobile alternating slots, tune left/right face centers separately from desktop. Keep artwork dimensions fixed across row-height expansion so the expanded mask reveals more body. Check the tilt on Chisa and Changli, and preserve headwear in the expanded state. Baconbits and nonstandard/costume sources keep their existing resolver priority and separate metadata/fallback; these nine values must not be reused blindly on custom images.

## Actual font cmap

`fontTools` was not installed in either local Python. A read-only stdlib SFNT parser `.tmp/inspect-font-cmap.py` decoded name tables and mapped nonzero glyphs from format4/format12 cmap subtables.

- `WuWa-Lahai-Roi-Regular.ttf`: 15,696 bytes; Unicode platform0/encoding3 + Windows platform3/encoding1 format4 subtables; each has exactly 65 mapped characters. Coverage is U+0020, U+0025, U+002E, U+0030-0039, U+0041-005A, U+0061-007A. CJK count is zero.
- Internal family: `WuWa Lahai-Roi Regular`; internal full name: `WuWa Lahai-Roi Regular Regular`; PostScript: `WuWaLahaiRoiRegular-Regular`.
- Existing CSS alias in `src/styles/base/foundation.css`: `Sigrika Accent Latin`, with a digit/Latin unicode range. `--font-display-accent` points to that alias. Merely removing unicode-range cannot create absent Chinese glyphs.
- Existing fallback `LXGWMarkerGothic-Regular.ttf`: 3,179,616 bytes; Unicode mapped points 15,288, CJK count 12,904; Chinese sample glyphs for Sigrika/Denia/Aemeath/handbook all present. Internal family `LXGW Marker Gothic` (also localized `霞鹜漫黑`); existing CSS alias `Sigrika Window Title`, via `--font-window-title`.

Recommended scoped name stack: `font-family: var(--font-display-accent), var(--font-window-title), sans-serif; font-weight:400`. Latin/digits can use the requested WuWa art face; Chinese character names truthfully render through the existing LXGW fallback. Keep this change local to strip names; do not claim WuWa renders Chinese or mutate global font-family/ranges.