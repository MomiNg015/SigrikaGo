# Refine Sigrika Nameplate Motion And Clipping

## Goal

Keep the selected hand-painted Sigrika citrus-sun nameplate artwork, remove the visible hard clipping around its decorative edges, and replace the muddy broad glow with restrained motion that reinforces the illustration.

## Requirements

- Preserve the selected hand-painted citrus, sun-disc, purple ribbon, and wind-tail composition; do not regenerate or redesign the artwork.
- Add a real transparent safety margin inside the existing raster canvas so the sun, citrus, stars, and right wind-tail do not touch the bitmap boundary at runtime.
- Keep the nameplate wide enough to read as a full nameplate rather than a narrow username capsule.
- Replace the full-surface yellow/purple haze with a continuously visible alpha-following rim plus localized effects: subtle sun-disc breathing, a small citrus highlight, thin carrier/right-tail wind light, and sparse staggered star twinkles. The rim and flowing line provide the main illumination; blinking stars remain secondary.
- Animate only `transform` and `opacity`; keep blur and shadow static.
- Preserve the existing asset URL, asset ID, shared `UserIdentity` API, mobile scale variable, username truncation semantics, click-through effect layer, and reduced-motion fallback.
- Fix the exact Bright School home owner so this asset is not clipped by generic identity overflow rules, without weakening overflow safety for other nameplates.

## Acceptance Criteria

- [ ] The PNG remains RGBA at `1125x240` and has non-zero transparent breathing room on all four sides.
- [ ] At the default `150x32` runtime size, no painted motif appears sliced at the bitmap boundary.
- [ ] The selected illustration remains recognizable and is not non-uniformly distorted.
- [ ] The effect no longer creates a broad yellow/purple fog over the art or username, while a continuous silhouette rim and flowing edge light remain clearly visible between star flashes.
- [ ] Motion is localized to sun, citrus, right wind-tail, and sparse stars, using only opacity and transform keyframes.
- [ ] The exact Sigrika asset remains visible in Bright School home, compact, and portrait layouts while unrelated nameplates retain existing clipping rules.
- [ ] Username remains legible and safely truncated for long historical names.
- [ ] `prefers-reduced-motion: reduce` stops all motion and retains a clean static highlight.
- [ ] Focused UserIdentity, home, preload, CSS inventory, and CSS contract tests pass.
- [ ] `npm run check` passes.

## Definition of Done

- Asset, owner CSS, motion CSS, tests, relevant frontend spec, and system-design documentation agree.
- Generated `docs/system-design.html` is refreshed.
- Browser or equivalent rendered QA covers desktop, narrow desktop, and portrait-phone sizes.
- The task is committed without including unrelated Denia nameplate work.

## Technical Approach

Uniformly scale the existing art within its current transparent canvas to create an internal alpha-safe inset, with slight asymmetric placement only if needed to protect the large left motif and right tail. Rebuild the asset-owned effect gradients as small semantic regions rather than overlays spanning the whole plate. Strengthen the already-existing final exact-asset owner where Bright School's earlier generic rules set `overflow: hidden`.

## Decision (ADR-lite)

**Context:** The selected art is acceptable, but its alpha bounds touch the bitmap edges and the current broad screen-blended gradients obscure the hand-painted detail.

**Decision:** Preserve the illustration, solve clipping at both bitmap and exact CSS-owner boundaries, and use illustration-aligned localized motion.

**Consequences:** The painted content becomes slightly smaller inside the same runtime slot, but reads more cleanly because all decorative contours survive and the effects stop washing out the image.

## Out of Scope

- Generating a new visual direction or new nameplate illustration.
- Changing backend inventory data, database schemas, or the `UserIdentity` public API.
- Changing motion or layout for other nameplate assets.
- Including or modifying the unrelated Denia nameplate work already present in the worktree.

## Technical Notes

- Asset: `public/assets/achievements/semantic-nameplate.png`
- Asset owner: `src/styles/hud-components/user-identity/semantic-ignition-nameplate.css`
- Motion owner: `src/styles/hud-components/user-identity/semantic-ignition-motion.css`
- Final cascade owner: `src/styles/mobile-adaptive/user-nameplate-final.css`
- Bright School generic owner currently applies `overflow: hidden` in `src/styles/themes/bright-school/home/student-id-card/user-identity-tag.css`; exact-asset rules must win after it.
- Existing unrelated dirty files at task start: `docs/system-design.md`, `docs/system-design.html`, and `public/assets/achievements/denia-spark-100-wins-nameplate.png`.
