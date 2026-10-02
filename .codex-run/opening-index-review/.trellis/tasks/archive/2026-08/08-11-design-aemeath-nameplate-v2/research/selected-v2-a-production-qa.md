# 爱弥斯 v2 A「纸翼航标」生产接入 QA

## Production contract

- Asset ID: `reward-aemeath-spark-100-wins-nameplate`
- Raster: `public/assets/achievements/aemeath-spark-100-wins-nameplate.png`
- Canvas: `1125 x 240`
- Alpha bounds: `x=40..979, y=8..231`
- Runtime slot: `150 x 32`
- Username padding: `42px / 20px`
- Generic `UserIdentity`, reward data, and achievement conditions: unchanged

## Motion contract

- Persistent cyan/pink Alpha-following rim.
- Three separated thin paper-wake traces from the left paper airplane.
- Thin upper/lower perimeter traces that preserve the quiet username center.
- Two delayed directional tail-light traces beyond the painted right curl.
- Three sparse square pixel glints.
- Continuous keyframes change only `transform` and `opacity`; no scale, rotation, radial core, or full-width glossy sweep.
- Reduced motion freezes every local layer into a readable static composition.

## Visual evidence

- `research/nameplate-preview-v2-a/desktop-1440x900-motion.png`
- `research/nameplate-preview-v2-a/desktop-1440x900-reduced.png`
- `research/nameplate-preview-v2-a/narrow-1024x768-motion.png`
- `research/nameplate-preview-v2-a/narrow-1024x768-reduced.png`
- `research/nameplate-preview-v2-a/phone-375x812-motion.png`
- `research/nameplate-preview-v2-a/phone-375x812-reduced.png`

The repository capture helper reached the page but timed out while waiting for Vite `networkidle`. The equivalent fallback kept the generated real-`UserIdentity` harness and fixed viewports, then captured with installed Chrome after `domcontentloaded`, `document.fonts.ready`, and a motion-settle delay.

### Username and perceived-height follow-up

- `research/nameplate-compare-final/desktop-1440x900-motion.png`
- `research/nameplate-compare-final/desktop-1440x900-reduced.png`
- `research/nameplate-compare-final/phone-375x812-motion.png`
- `research/nameplate-compare-final/runtime-metrics.json`

The comparison mounts the real `UserIdentity` under the Bright School `.home-player-plaque.tactical-id-card` cascade. Sigrika, Danya, and Aemeath compute to identical tag geometry at every checked scale: `150 x 32` at `1`, `132 x 28.16` at `0.88`, and `117 x 24.96` at `0.78`. All three roots, tags, and effect layers compute `overflow: visible`; all direct usernames compute italic `800` UI text with character-specific two-layer shadows. Reduced-motion capture reports zero running infinite animations for every rendered nameplate.

## Verification

- Asset validator: pass.
- Focused nameplate, style, identity, and home suite: `129` tests pass.
- CSS architecture contract suite: `141` tests pass.
- Repository test suite: `2474` tests pass.
- ESLint: pass.
- Portrait normalization check: pass.
- Production build: pass.
- Built CSS contract: pass.
- `git diff --check`: pass with existing Windows line-ending notices only.
- Full `npm run check`: stops only at the pre-existing stale admin snapshot categories `siteSettings`, `shopItems`, and `storyScripts`; no snapshot export was performed because it is outside this visual task.

## Design detector classification

Impeccable reports only asset-local Danya/Aemeath illustration colors, exact character username colors, historical literal fixtures in the style tests, and task-local preview-shell colors/radius outside the global Bright School palette. The character assets intentionally own these exact colors, test literals are not rendered design tokens, and the preview shell is non-production evidence, so no global design-token expansion, sidecar refresh, or detector suppression was added.
