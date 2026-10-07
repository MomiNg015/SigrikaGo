# Actual motion performance review

## Scope and method

Read-only browser measurements on 2026-10-05. No production files were changed during this review. The existing `tests/e2e/handbook-puzzle` and `interface-polish` fixtures load the real components and complete `src/styles.css`, including the final mobile layer. `src/styles/README.md` confirms that entry/layer contract; there is no separate e2e README in this checkout.

- Isolated Vite port **5298**, unique temporary `cacheDir`, HMR disabled during sampling. Ports 5305/5317 remain independent. Initial direct Vite startup shared its optimizer cache and failed with 504 Outdated Optimize Dep; that run yielded no UI measurements and was discarded. A subsequent source-edit reload invalidated a run; final sampling disables HMR and excludes the invalidated results.
- Chrome headless, 1440×900 fine pointer; 390×844 and 360×640 with `isMobile`/`hasTouch`. Normal and reduced motion, native-speed and optional **4× CPU throttle**.
- Waited for `document.fonts.ready`, decoded all mounted images, and waited for owned finite entry animations. Handbook detail and Resume were opened once before final warmed entry samples.
- rAF intervals, `PerformanceObserver` long tasks, CDP `Performance.getMetrics`, and `devtools.timeline` traces. Idle baselines accompany interactions. No screenshots, animation disabling, or viewport resizing during sampling.
- The primary matrix contains **38 verified samples**. A separate **36-sample Resume repeat** uses direct CDP mouse/touch input with coordinates resolved before timing, avoiding Playwright selector/stability polling inside the measured input window. Three CDP LayerTree/idle ablations examine promotion and continuous effects.
- Real mobile touch taps directly open handbook details **without expanding strip geometry**. Geometry measurements use desktop pointer hover or actual keyboard key/focus input. A draft second phone expansion sample initially inherited pointer mode and did not expand; it was discarded and rerun with a real key event. Current fixture contains **10 rendered strips**, rather than the earlier research estimate of six.

## Results

This host refreshes near **165 Hz** (idle rAF≈6.06 ms). P95/max intervals below are observed milliseconds, not a declaration that physical phones meet a 60 fps target.

| Warm interaction | Viewport | CPU | rAF P95 / max | Layout updates / total layout time | Timeline paint time | Long tasks |
| --- | --- | --- | --- | --- | --- | --- |
| Handbook hover expand/swap/collapse | 1440×900 | 1× | 6.2 / 24.2 | 125 / 42.6 ms | 78.0 ms | 0 |
| Handbook hover expand/swap/collapse | 1440×900 | 4× | 12.2 / 18.2 | 83 / 165.7 ms | 337.8 ms | 0 |
| Handbook keyboard expand/swap/collapse | 390×844 | 1× | 6.2 / 24.3 | 128 / 24.3 ms | 58.6 ms | 0 |
| Handbook keyboard expand/swap/collapse | 390×844 | 4× | 18.2 / 24.3 | 80 / 66.1 ms | 155.2 ms | 0 |
| Handbook keyboard expand/swap/collapse | 360×640 | 1× | 6.1 / 12.2 | 130 / 24.8 ms | 59.1 ms | 0 |
| Handbook keyboard expand/swap/collapse | 360×640 | 4× | 18.2 / 18.3 | 83 / 68.7 ms | 154.4 ms | 0 |
| Direct touch opens warmed handbook detail | 390×844 | 1× | 6.2 / 12.1 | 3 / 0.7 ms | 5.6 ms | 0 |
| Direct touch opens warmed handbook detail | 360×640 | 1× | 6.1 / 12.2 | 3 / 0.9 ms | 7.2 ms | 0 |
| Home manual + utility art hover | 1440×900 | 1× | 6.2 / 6.2 | 2 / 0.5 ms | 0.5 ms | 0 |
| Home manual + utility art hover | 1440×900 | 4× | 12.1 / 18.3 | 2 / 3.6 ms | 3.0 ms | 0 |
| Mobile menu open/close | 390×844 | 1× | 6.2 / 12.2 | 4 / 0.7 ms | 1.8 ms | 0 |
| Mobile menu open/close | 360×640 | 1× | 6.1 / 12.2 | 4 / 0.7 ms | 1.8 ms | 0 |
| Mobile menu open/close | 390×844 | 4× | 6.2 / 30.3 | 4 / 2.7 ms | 8.6 ms | 0 |
| Mobile menu open/close | 360×640 | 4× | 6.1 / 30.2 | 4 / 3.1 ms | 9.4 ms | 0 |
| Reduced mobile menu open/close | 390×844 | 4× | 6.1 / 24.3 | 4 / 2.7 ms | 4.3 ms | 0 |

### Handbook geometry

Confirmed that the existing 260 ms `flex-grow` / `height` / portrait `left` transitions consume layout and paint throughout preview motion. Loaded strips were nevertheless stable in these traces, including 4× throttle. Idle handbook has zero layout/style recalculation/paint. The native finger-tap path does not incur the preview's per-frame geometry work. At 4×, warmed detail mounting has one isolated 58–71 ms long task and a 66.7–78.8 ms frame gap; its geometry settles in three layout updates. This is a detail creation cost, not continued strip expansion.

**Recommendation:** preserve approved handbook expansion geometry and portrait landmarks. Measurements do not justify a FLIP rewrite or changing the intended preview design. Revisit on a representative low-end physical phone if sustained preview jank is observed.

### Ordinary sheets and menus

New opacity/individual translate/scale entrances introduce no observed sequence of per-frame layout updates. Resume has a bounded 5–8 layout updates in typical mount samples; menus have four across an open/close pair. Paint events are concentrated at mount/state changes. This supports keeping the composited entrance approach, rather than animating dimensions or adding a motion library. CDP did not expose useful raster/GPU completion events in the selected trace categories; absence of `RasterTask`/`CompositeLayers` entries is not treated as proof of zero GPU cost.

Direct-input Resume repeats locate an actual creation/style bottleneck under CPU throttle:

| Viewport | Normal 1× max frame range (3 repeats) | Reduced 1× max frame range | Normal 4× max frame range | Reduced 4× max frame range |
| --- | --- | --- | --- | --- |
| 1440×900 | 18.2–24.3 ms | 36.4–42.4 ms | 133.4–157.6 ms | 266.7–381.8 ms |
| 390×844 | 24.3–36.4 ms | 48.5–54.6 ms | 175.8–218.1 ms | 248.5 ms |
| 360×640 | 24.2–24.3 ms | 42.5–54.6 ms | 145.4–193.9 ms | 230.3–254.4 ms |

Normal-speed repeats register no >=50 ms main-thread long tasks. At 4×, normal has two long tasks and reduced four in each repeat. Reduced mode computes `animation-name: none` and remains visible/usable; removing entrance animation does not remove these tasks. In the 390px reduced trace, a **173.5 ms native click/React dispatch**, a later **104.4 ms React `performWorkUntilDeadline`**, and separate **37–45 ms `UpdateLayoutTree`** events dominate. Layout time is much smaller than style/React work (e.g. ~7–19 layout passes, versus ~115–318 ms summed style work under 4×). Measurements include normal profile fetch/state completion from the deterministic fixture API response.

**Recommendation:** if further performance work is scheduled, profile Resume creation and full-CSS style matching with a production React build on a physical phone, including reduced motion. This is the measured follow-up; shortening/removing the already short entrance or rewriting all animation ownership is not supported. No individual costly selector was isolated, so no selector rewrite is proposed from this review.

## Persistent promotion and continuous motion

Source owners reviewed: base `.home-entry-motion`, Bright School utility toolbox `.utility-entry-motion`, native utility entries in `surface-contracts/home-utility-tabs.css`, and separate shop/cinematic/music/corruption promotion owners from `research/motion.md`. The latter were not modified or performance-generalized from the home fixture.

- Home has 14 elements computing `will-change: transform` across nested native controls/artwork. CDP shows eight corresponding artwork compositor layers explicitly promoted by the hint, plus the authored scene/IRIS layers.
- Temporary browser-only `will-change: auto !important` reduces drawn layers **20→15**, but summed layer area changes **2,414,788→2,408,048 CSS px² (~0.3%)**. This aggregate includes overlaps and merged layers; it is not GPU memory. Warm hover remains stable with and without promotion (1× max6.2 ms both; 4× max18.3 vs12.2 ms, different samples). This does not establish a material performance bottleneck or reliable first-frame benefit.
- The resting page has five continuous CSS animations: `poptech-star-twinkle`, `iris-entry-scan`, and three `iris-node-pulse`. In an 850 ms idle ablation, authored effects incur **141 style recalculations / 48.9 ms**; pausing only these browser animations reduces that to **0 / 0 ms**. Both have zero layout work, and normal idle traces show no paint or frame gap problem. LayerTree reports active accelerated transform/opacity reasons for their layers.

**Recommendation:** keep current authored home effects and scoped promotions during this task. Continuous effects have measurable idle style work, so a future battery/visibility review may consider pausing effects when the scene is hidden or offscreen; first collect physical-device/background evidence. Do not apply global `will-change` removal or broad pauses to gameplay, nameplates, cinematics, marquees, or corruption owners based on this one fixture.

## Evidence and limits

All diagnostic scripts and traces are under ignored `.tmp/interface-polish/`:

- `motion-performance.mjs`, `motion-performance.vite.config.mjs`
- `motion-entry-repeat.mjs`, `motion-promotion-probe.mjs`
- `motion-performance/verified-results.json` — definitive warmed matrix, supersedes exploratory `results.json` phone rows
- `motion-performance/entry-repeat-results.json` — 36 direct-input repeats with event-relative task timings
- `motion-performance/promotion-probe.json` — CDP layers, nodes, and compositing reasons
- Per-sample `.trace.json` files and `*-owners.json` / `*-continuous.json`

Temporary server 5298 is stopped after the review. No gameplay, production CSS, component code, aggregate inventory, or docs/system-design.md was edited here; root owns consolidated documentation.

These are **development Vite/React builds on desktop Chrome**, with fonts/images already loaded and synthetic CDP CPU slowdown. The host is shared with other project verification work; maxima vary between runs. Phone emulation reproduces viewport, media queries and input type, but not mobile GPU, memory bandwidth, thermal throttling, iOS Safari, real battery cost, or production React timing. Traces support the specific ownership conclusions above, not a universal FPS guarantee.
