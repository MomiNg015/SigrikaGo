# Bug Analysis: Semantic Ignition clipping and muddy motion

## 1. Root Cause Category

- **Category:** D/E — test coverage gap plus implicit assumption.
- **Specific cause:** transparent corners were tested, but the actual non-zero Alpha bounding box was not. The hand-painted subject touched every bitmap edge, so a `background-size: 100% 100%` render sliced its outer contours even when CSS overflow was visible. Motion review also assumed that stronger full-surface screen-blended gradients would read as “high energy”; at the real `150x32` size they merged into an undifferentiated yellow/purple haze.

## 2. Why Earlier Fixes Failed

1. Widening the runtime slot fixed the “too narrow” complaint but did not create any pixels beyond the raster boundary, so it could not fix bitmap-internal clipping.
2. Exact-owner `overflow: visible` fixed cascade clipping for CSS effects but could not restore art already cut at the PNG edge.
3. Broad glow, core, sweep, and sparkle overlays were individually plausible at source scale, but their combined screen blending was not evaluated early enough at the actual runtime size.

## 3. Prevention Mechanisms

| Priority | Mechanism | Specific Action | Status |
|---|---|---|---|
| P0 | Test coverage | Assert all four Alpha bounds, not only transparent corners and visible height. | Done |
| P0 | Documentation | Record minimum `8px` vertical and `40px` horizontal internal safety margins for the built-in raster. | Done |
| P0 | Visual process | Review the full theme cascade at `150x32`, compact scale, and portrait width before handoff. | Done |
| P1 | Motion contract | Keep a persistent alpha-following rim and fine flowing line as the primary illumination; use stars only as accents, while banning full-width glossy sweep and full-surface screen haze. | Done |

## 4. Systematic Expansion

- **Similar issues:** any bespoke raster whose essential subject touches the delivery canvas can look clipped regardless of ancestor overflow.
- **Design improvement:** distinguish raster safety margins from CSS effect bleed; essential art must remain complete inside the fixed slot, while only pointer-transparent decoration may bleed outside it.
- **Process improvement:** validate source-scale Alpha bounds and actual-size rendering together; neither check is sufficient alone.

## 5. Knowledge Capture

- Updated `.trellis/spec/frontend/quality-guidelines.md` with measured Alpha margins, localized motion vocabulary, and regression-test ownership.
- Updated `.trellis/spec/frontend/css-architecture.md` and `src/styles/cssLayerInventory.js` with the refined asset-owned motion baseline.
- Updated `docs/system-design.md` and regenerated `docs/system-design.html`.
- No `src/templates/markdown/spec/` directory exists in this repository, so there is no generic template mirror to synchronize.
