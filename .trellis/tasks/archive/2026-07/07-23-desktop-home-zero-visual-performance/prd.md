# Desktop Home Zero-Visual-Change Performance

## Goal

Reduce persistent desktop home-screen interaction jank in the deployed production build without changing the current Bright School visual result, motion timing, hover angles, shadow appearance, or the workflow for replacing home artwork.

## What I already know

- The issue affects the normal desktop browser on the deployed site; mobile and the embedded browser are smooth.
- Sustained hover work is client-side and is not materially improved by adding cloud CPU, memory, or bandwidth.
- Bright School utility artwork currently combines `filter: drop-shadow(...)`, `transform`, `will-change`, and transitions on the same moving image layer.
- A previous `will-change: transform` optimization preserved the motion but did not remove the persistent problem.
- Login preload already treats the home image registry as blocking, but `preloadImage()` resolves on `load` and does not await `HTMLImageElement.decode()`.
- Opening overlays updates top-level `App` state. `AppRoutes` recreates home callback props, and `HomeScreen` is not memoized.
- Four pre-existing dirty files under mobile room/player status styling are unrelated and must remain untouched.

## Requirements

- Preserve the current rendered appearance and interaction contract: placement, scale, rotation, shadow shape/color/offset, duration, easing, focus state, active state, and reduced-motion behavior.
- Do not bake shadows into WebP assets. Future home artwork replacement must continue to work by replacing the asset URL/file, subject only to the existing transparent-canvas/aspect-ratio contract.
- Separate the moving transform layer from the static filtered artwork layer for the two featured home entries and the six utility entries.
- Keep runtime movement limited to transform/opacity on the motion wrapper; retain the existing active/filter-state transition on the static artwork layer without putting transform on that raster.
- Make blocking login image preload await successful image decode when supported, with a safe fallback for browsers that do not expose `decode()` or reject it after a successful load.
- Use the post-login preload screen as the main accessible-resource gate: preload the current account's accessible character, home, shop, recruitment, inventory, equipment, decoration, music, skill-voice, and system-voice assets before entering home.
- Keep inaccessible/unowned resources, replay data, and room-specific opponent/Pixi effect resources out of the login manifest; keep per-resource timeout and post-entry retry behavior so one bad asset cannot trap the user.
- Prevent unrelated overlay visibility updates from rerendering the home tree when home-visible data has not changed, while preserving live lobby counts, badges, user/theme changes, and audio-aware open actions.
- Add or update focused tests for markup/style ownership, decode behavior, and home render-boundary stability.
- Update `docs/system-design.md`, the performance design chapter, and generated `docs/system-design.html` because this establishes a runtime rendering and preload contract.
- Preserve all unrelated working-tree changes and do not include them in this task's commit.

## Acceptance Criteria

- [ ] Static screenshots before and after show no intentional visual difference on Bright School desktop home default, hover, focus-visible, and active states.
- [ ] Existing transform values and transition timing/easing remain unchanged.
- [ ] Moving wrapper elements do not own `filter` or a `filter` transition.
- [ ] Artwork elements retain the current shadow values but do not own hover/active transforms.
- [ ] Critical login images await decode where supported and never block forever solely because decode rejects after load.
- [ ] The flattened accessible login image/audio manifest is represented by the critical groups; login-generated deferred groups are empty.
- [ ] Owned/reachable BGM, skill voices, system voices, shop/recruitment/inventory/equipment images, and non-selected owned portraits complete on the loading screen before home entry.
- [ ] Unowned music and room-specific battle resources remain excluded or battle-gated.
- [ ] Opening or closing an unrelated overlay does not rerender `HomeScreen` when its user-visible data is unchanged.
- [ ] Live lobby counters, mailbox/announcement badges, recruitment readiness, theme/audio changes, and all home actions remain correct.
- [ ] Focused home, preload, app-route, style-contract, and theme tests pass.
- [ ] `npm run check` and `npm run docs:system-design` pass.

## Definition of Done

- Implementation is covered by focused regression tests.
- Production build succeeds.
- Performance ownership and image replacement constraints are documented.
- No unrelated dirty files are staged or modified.

## Technical Approach

1. Add semantic motion wrappers around home artwork and move existing transform transitions to those wrappers; keep `drop-shadow` on a non-moving child image.
2. Remove the redundant `filter` transition while retaining the exact shadow declarations and transform values.
3. Extend `preloadImage()` to await `image.decode()` after load with compatibility and rejection fallback.
4. Stabilize home callbacks in `AppRoutes` and memoize the home surface so overlay-only state changes stop at the route boundary.
5. Add source-contract and DOM/runtime tests before running the broad project gate.

## Decision (ADR-lite)

**Context**: Pre-baking shadows would be fast but would make every future artwork replacement require an asset-processing step. Keeping transform and filter on the same layer preserves easy replacement but can trigger expensive raster work.

**Decision**: Use a reusable transform-wrapper/static-artwork structure. Keep runtime shadow generation and all existing visual parameters. Treat the current account's accessible non-replay runtime manifest as login-critical, await image decode, and retain bounded timeout/retry behavior.

**Consequences**: Home artwork remains replaceable without new tooling. The DOM gains one semantic wrapper per animated artwork. Login may stay on the progress screen longer on a cold cache, but later home/shop/warehouse/music/voice interactions begin from a warmed browser cache. Full route-level CSS splitting is deferred because it has a larger visual-regression surface and should follow measured production tracing.

## Out of Scope

- Redesigning, simplifying, removing, or retiming any visible home interaction.
- Baking shadows into image files or changing image dimensions/compression.
- Loading inaccessible/unowned resources, replay data, or room-specific opponent/Pixi effect resources before entering home.
- Full global CSS route splitting or broad `!important` cleanup.
- Server sizing, CDN, Nginx, database, socket, or API changes.
- Any changes to mobile room/player status styling already dirty in the worktree.

## Technical Notes

- Relevant components: `src/home/components/HomeImageEntries.jsx`, `src/home/components/HomeUtilityDock.jsx`, `src/home/HomeScreen.jsx`, `src/app/AppRoutes.jsx`.
- Relevant styles: `src/styles/base/home-stage-artboard/image-entries.css`, `src/styles/themes/bright-school/home/utility-toolbox/`, `src/styles/themes/bright-school/effects/home-image-entry-buttons.css`.
- Preload ownership: `src/shared/assetRegistry.js`, `src/shared/preloadAssets.js`, `src/app/useStartupPreload.js`.
- Performance architecture is documented in `docs/system-design/07-performance-tech-debt.md`.
