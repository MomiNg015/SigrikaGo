# Asset and motion contract

## Raster delivery

- Use an 8-bit RGBA PNG at the production URL. The raster ratio must exactly match the exact-ID runtime slot ratio.
- The current bespoke default is `1125x240` delivered into `150x32` (`4.6875:1`). Inspect the target owner before assuming these values.
- Keep all essential shell art inside the fixed slot. Only pointer-transparent CSS glow/particles may bleed outside.
- Never bake a username, character name, letter emblem, reward label, or sample copy into the image.
- Keep the declared username zone quiet enough for dynamic text. Geometry validation cannot prove visual contrast; inspect it at runtime size.

### Alpha safety

Check non-zero Alpha bounds, not only transparent corners. A transparent corner can coexist with a core, fruit, ribbon, tail, or glow touching another edge.

For the `1125x240` default, start with at least `40px` left/right and `8px` top/bottom. Increase margins when wide glow or hand-painted contours make the apparent edge feel clipped. Do not reduce margins just to maximize artwork size.

Workflow:

1. Remove key background and edge fringe.
2. Run `node scripts/pngTrim.mjs <input> <trimmed-output>` only to find/remove accidental waste.
3. Uniformly scale the trimmed subject into the delivery canvas.
4. Center/position it with deliberate four-edge safety margins.
5. Run the Skill validator against the final delivered file.

The final step must not be a destructive trim, because that would remove the deliberate safety inset.

## Validator options

`validate_nameplate_asset.mjs` accepts:

| Option | Meaning |
|---|---|
| `--width`, `--height` | Exact delivery canvas |
| `--min-left/right/top/bottom` | Minimum transparent pixels outside non-zero Alpha bounds |
| `--alpha-threshold` | Alpha values at or below this are treated as transparent |
| `--safe-left`, `--safe-right` | Declared username-safe horizontal pixel bounds |
| `--min-safe-ratio` | Minimum safe width divided by full canvas width |
| `--min-visible-height-ratio` | Minimum non-zero Alpha height divided by canvas height |
| `--json <path>` | Optional report output; stdout is always JSON |

The script exits non-zero on invalid PNG encoding, dimension/ratio mismatch, empty Alpha, non-transparent corners, insufficient margins, or invalid/undersized safe-zone geometry.

## Runtime geometry

- Derive width, height, padding, and font size from `--user-nameplate-scale`.
- Padding must map to the illustrated core/tail, not a generic percentage copied from another role.
- Test the actual legal-name contract. Do not shrink font per username.
- Keep legacy overlong-name ellipsis as the fallback.
- Preserve independent title and badge placement outside the nameplate art.

## Motion hierarchy

### 1. Persistent primary light

At every animation phase, the plate should still look illuminated. Use one or both:

- static `drop-shadow()` on the alpha-following raster;
- a softly visible localized carrier/core glow whose minimum opacity remains readable.

This layer fixes the common “there is no light, only blinking” failure.

### 2. Character narrative motion

Bind motion to the illustration:

- sun/heat: slow breathing, small warm highlight travel;
- water/bubble: local refraction drift, buoyant pulse;
- ink/wind: fine directional lines, uneven settle/lift;
- technology: bounded signal pulse along authored geometry;
- botanical: slight light lift or petal/leaf accent, not generic particle rain.

These are examples, not presets. Character research decides the verbs.

### 3. Secondary accents

Use sparse, staggered glints/particles. They may disappear temporarily because the persistent light remains. Avoid uniformly distributed sparkle fields.

## Performance and accessibility

- Continuous keyframes animate only `transform` and `opacity`.
- `filter`, `drop-shadow`, gradients, masks, and blur are static declarations.
- Effect elements are `aria-hidden`, `pointer-events: none`, and do not change layout.
- Use unique role/asset keyframe prefixes.
- In `prefers-reduced-motion: reduce`, stop all keyframes and keep a clear static primary light plus readable text.
- Do not use motion to compensate for low text contrast.

## Common failure diagnosis

| Symptom | Likely cause | Correct layer |
|---|---|---|
| Decorative end is visibly cut | Alpha touches raster edge | Re-canvas the PNG |
| Glow is cut but raster complete | Parent/effect overflow | Exact CSS owner/final winner |
| Only occasional flashes visible | No persistent primary light | Background/rim/carrier light |
| Hand-painted art looks muddy | Full-surface blend/haze | Localize/reduce effect geometry |
| One page looks wrong | Late theme/context rule | Inspect computed cascade |
| Name overlaps core/tail | Unsafe padding/safe zone | Owner geometry and asset design |

Never claim a fix from source CSS alone. Inspect computed output with the full theme at the actual runtime size.
