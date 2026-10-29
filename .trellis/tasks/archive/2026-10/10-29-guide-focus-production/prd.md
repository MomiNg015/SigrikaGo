# Production guide focus and stable first dialogue placement

## Accepted requirements
- Ship approved A contracting corner markers in battle and home onboarding.
- Every home target/window, including narration, keeps its own painted silhouette and original brightness above existing dimming. Preserve transparent artwork, radii and shadows; no rectangular cutout.
- Keep all authored dialogue, proxy interaction, choices, skip/reward state and battle action rules.
- Fix home NPC/avatar flash at default position on step/window changes. Do not show a target-dependent panel until matching target geometry and current-step panel measurement are ready; measure before paint and keep revealed state scoped to the step.
- Share focus marker geometry/motion across both guides. Reduced motion is static. No duplicate legacy target rings.
- Update the existing preview to use the production A implementation and remove duplicate sample A/home rendering.

## Boundaries
Preserve unrelated loading/settings/audio WIP. No backend/schema/game-rule changes. Inert paint copies never own clicks or keyboard focus and clean up observers/frames/styles on target changes and unmount.

## Acceptance
- [x] Home and battle use shared production A marker with safe edges.
- [x] All home windows/components remain bright and marked; actual guide controls work.
- [x] No visible default-location frame on target steps, including lazy windows and resize.
- [x] Stable NPC geometry and step-specific text reveal; full home tour and battle flows pass.
- [x] Focused DOM/browser/CSS checks and build pass; docs/specs and preview updated.

## Root cause evidence
Home target measurement currently runs in useEffect, so new selectors render with rect=null and default top=66 before measurement. panelHeight and revealed are also retained across steps. The sample's computed-paint copy establishes the approved appearance, but production needs scoped identity, inert focus exclusion, entry-animation synchronization and bounded rebuilds.

## Verification evidence
- Focused unit/DOM/CSS suite: 9 files, 180 tests passed.
- Home browser suite: all 12 distinct tests passed across initial and focused rerun. Normal-motion first-visible-frame checks cover all 29 dialogue steps with 180 ms delayed window mounts at 390x844 and 1440x1000; no placement failures.
- Production-backed preview: 27 battle combinations; 15 home checkpoints and 50 full-tour highlights, all passed including controls, reduced motion and no API traffic.
- Removed stale duplicate sample A paint code. Optional CUE_ARTIFACT_DIR avoids Windows preview-image write locks during verification.
- Animated browser tests wait for typewriter completion before progressing; click-to-reveal remains tested deterministically in DOM tests, avoiding a check/click race near automatic completion.
- Full npm run check exited 0: lint, unit suite, portrait checks, isolated admin snapshot, production build, built CSS contracts, production config and generated system design HTML. Standalone production build also passed. Existing chunk-size and public-asset placeholder build warnings remain.
