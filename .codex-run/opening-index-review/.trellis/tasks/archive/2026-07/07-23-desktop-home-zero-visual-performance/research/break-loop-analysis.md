## Bug Analysis: Desktop home interaction jank without visual degradation

### 1. Root Cause Category

- **Category**: E - Implicit Assumption, with D - Test Coverage Gap
- **Specific Cause**: The desktop home CSS assumed that animating `transform` on a large transparent WebP that also owns `filter: drop-shadow(...)` would remain compositor-only. Desktop browser/GPU combinations can rerasterize that filtered image during every animation frame. The same app also lacked a stable React route boundary, so unrelated App-level updates could rebuild the home tree.

### 2. Why Fixes Failed

1. Increasing rotation or selector specificity changed the visible endpoint but did not change the expensive rendering path.
2. Tuning shadow blur/opacity reduced cost only by changing the requested visual and still left filter and transform on the same raster.
3. Loading the image file before entry did not guarantee decoded pixels; the first hover could still pay decode cost.
4. Component tests asserted final transform values but did not assert which DOM layer owned transform versus filter.

### 3. Prevention Mechanisms

| Priority | Mechanism | Specific Action | Status |
|----------|-----------|-----------------|--------|
| P0 | Architecture | Wrap filtered home rasters in `.home-entry-motion` / `.utility-entry-motion` and animate only the wrapper. | DONE |
| P0 | Test coverage | Assert separate transform/filter selectors for desktop and mobile interaction rules. | DONE |
| P0 | Runtime boundary | Memoize `HomeRoute` and test that room-only route changes do not rerender `HomeScreen`. | DONE |
| P1 | Startup readiness | Await `HTMLImageElement.decode()` after load, with safe missing/rejected fallback. | DONE |
| P1 | Documentation | Record the wrapper contract in frontend quality guidelines and system design. | DONE |
| P2 | Measurement | Add production-browser frame tracing for the authenticated home screen when stable visual-performance automation is available. | TODO |

### 4. Systematic Expansion

- **Similar Issues**: Other large transparent filtered rasters that animate their own transform are candidates for the same audit; do not broaden this change without surface-specific evidence and visual tests.
- **Design Improvement**: Treat filter/shadow ownership and transform ownership as separate semantic layers for replaceable raster UI art.
- **Process Improvement**: Performance fixes that promise unchanged visuals must test property ownership, not only endpoint values.
- **Knowledge Gap**: `will-change: transform` does not guarantee compositor-only animation when the same element also owns a costly filter.

### 5. Knowledge Capture

- [x] Updated `.trellis/spec/frontend/quality-guidelines.md` with markup, CSS, rationale, and required regression points.
- [x] Updated `docs/system-design.md` and the frontend/assets/performance chapters.
- [x] Added focused markup/CSS, decode-readiness, and React render-boundary tests.
- [ ] No `src/templates/markdown/spec/` directory exists in this repository, so there is no generated spec template to sync.
- [ ] Commit remains a user-controlled handoff step for this implementation batch.
