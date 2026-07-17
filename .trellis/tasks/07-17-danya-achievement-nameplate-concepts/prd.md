# Create Danya achievement nameplate concepts

## Goal

Create four hand-painted, character-specific username nameplate concepts for 达妮娅, tied to the achievement “星炬模式使用达妮娅胜利100次”, so the user can choose a visual direction before production integration.

## Requirements

- Treat this as `new` visual-identity work.
- Base the concepts on the supplied Kuro Wiki dossier, its character-story and voice sections, repository presentation, and the supplied achievement meaning.
- Deliver four separate concepts at the same `1125 x 240` (`4.6875:1`) ratio.
- Make the four concepts structurally and narratively different, not color-only variants.
- Use a visibly hand-painted gouache/watercolor treatment with character-specific marks.
- Keep the dynamic username safe zone quiet from approximately `x=315` through `x=990`.
- Keep usernames, character names, letters, numbers, logos, UI labels, branding, and portraits out of the raster.
- Store all concepts and preview artifacts under this task directory only.
- Evaluate every direction at the intended runtime height of roughly `32px`.
- Stop after presenting the four concepts and wait for explicit user selection or revision direction.
- Revision 2 must completely exclude the repaired doll, stitched fabric, patches, and mending imagery.
- Revision 2 uses protective echo bubbles as the primary identity motif and Star Torch album/campus memories only as a supporting motif.
- Revision 2 must be pink-forward and visibly brighter, while retaining a meaningful dark-purple layer for depth and contrast without letting it dominate the plate.
- Revision 2 still needs four structurally different compositions, not four recolors of one merged design.
- Preserve revision 1 under `concepts/`; store the new set under `concepts/v2/` without overwriting it.
- The user rejected illustration-like complexity after Revision 2 began. The current reference-guided set must instead follow the existing Sigrika bespoke nameplate's asset structure: transparent cutout, strong end motifs, one uninterrupted center carrier, and runtime-first readability.
- Store the current reference-guided set under `concepts/v4/`; aborted generations are not deliverables.
- After the user found Revision 4 over-simplified, the latest set must match the existing Sigrika bespoke nameplate's element complexity and hand-painted finish directly, while replacing its motifs with Danya's bubble-led, album-supported language. Store this set under `concepts/v6/`.
- The user selected Direction C, “Refracted Bubble Portal”, for production integration.
- Preserve the previous untracked production candidate under this task's research evidence before replacing it.
- Integrate the selected asset through `reward-denia-spark-100-wins-nameplate`, the built-in achievement “百次回响”, an exact-ID CSS owner, localized motion, reduced-motion fallback, and full-theme runtime QA.

## Acceptance Criteria

- [x] Four individual concept images exist under `concepts/`.
- [x] Direction A is led by a character-owned identity object.
- [x] Direction B is led by a place, hobby, or relationship memory.
- [x] Direction C is led by her power and recurring action language.
- [x] Direction D is led by the meaning of winning 100 times with her.
- [x] The central username carrier remains low-detail and readable in every direction.
- [x] Every concept retains its identity at approximately `150 x 32` runtime size.
- [x] No production achievement asset, reward seed, CSS owner, or runtime integration is changed before selection.
- [x] Existing unrelated dirty paths remain untouched.

### Revision 2 acceptance criteria

- [ ] Four revised concepts exist under `concepts/v2/`.
- [ ] Every revised concept is bubble-led and uses album/campus memory only as a secondary supporting detail.
- [ ] No revised concept contains a doll, stitched fabric, patchwork, mending, or sewing imagery.
- [ ] Pink is the dominant color family in every revised concept.
- [ ] Dark purple is clearly present for depth and contrast but does not dominate the pink palette.
- [ ] The four revised concepts use different carrier silhouettes and motif placement.
- [ ] Each revised concept is inspected at `150 x 32` with a dark-plum username preview suitable for its light carrier.
- [ ] No production asset or code integration is changed before user selection.

### Current reference-guided acceptance criteria

- [x] Four current concepts exist as transparent `1125 x 240` PNGs under `concepts/v4/`.
- [x] Every current concept is bubble-led and keeps the album/page cue secondary at an end cap.
- [x] No current concept contains a doll, stitched fabric, patchwork, mending, or sewing imagery.
- [x] Pink is the dominant color family and dark purple remains a deliberate supporting layer.
- [x] All four use the Sigrika reference's runtime-first structure: end motifs, stable center carrier, transparent exterior.
- [x] The four current concepts have different silhouettes and motif placement rather than color-only changes.
- [x] Each current concept was inspected at `150 x 32` with a representative username overlay.
- [x] No production asset or code integration was changed before user selection.

### Latest Sigrika-density acceptance criteria

- [x] Four latest concepts exist as transparent `1125 x 240` PNGs under `concepts/v6/`.
- [x] Element density, end-cluster richness, contour finish, pigment texture, and carrier layering match the existing Sigrika reference tier.
- [x] The concepts do not copy Sigrika's sun, citrus, leaves, or wind-tail motifs.
- [x] Protective bubbles remain primary and album/photo-page elements remain secondary in all four concepts.
- [x] Pink is dominant in every concept; dark purple remains visible as carrier framing, depth, and contrast.
- [x] No concept contains a doll, plush, fabric, patchwork, stitches, sewing, mending, or green plant motif.
- [x] Every concept was inspected at `150 x 32` with a representative username overlay.
- [x] All Alpha subjects use the reference asset's final safety bbox of `x=56..1068`, `y=12..228`.
- [x] No production asset or runtime code was changed before user selection.

### Selected C production acceptance criteria

- [x] The selected transparent C raster is installed at `public/assets/achievements/denia-spark-100-wins-nameplate.png` without stretching.
- [x] The reward and “百次回响” achievement are seeded consistently in runtime and admin-default snapshots.
- [x] Exact-ID CSS owns the `150 x 32` slot, `40px / 25px` text safe padding, warm-white username, and character-specific local effects.
- [x] Normal motion uses only transform/opacity; reduced motion keeps a static readable rim.
- [x] Component, home, server, snapshot, style-contract, inventory, and asset-dimension tests cover the integration.
- [x] Full-theme browser QA covers desktop, narrow desktop, and portrait phone in normal and reduced-motion contexts.

## Definition of Done

- The text-first evidence matrix and visual-language card are persisted under `research/`.
- Four concepts are presented with short neutral labels describing their structural differences.
- Direction C is recorded as the explicit human selection.
- The selected asset, reward seed, exact-ID CSS, motion, tests, system-design note, and QA evidence are complete.

## Technical Approach

Use the built-in image generation path with the repository's existing Sigrika bespoke nameplate supplied only as a structural reference. Generate each direction independently from a dedicated prompt, remove the generated checkerboard presentation field, fit the alpha-trimmed subject uniformly onto the exact `1125 x 240` canvas without stretching, create `150 x 32` runtime previews, and present all four without ranking them.

## Decision (ADR-lite)

**Context**: The requested artifact is a bespoke character reward skin, while the repository already has a fixed-ratio `UserIdentity` contract and the nameplate workflow requires a human selection gate.

**Decision**: Explore four concepts on the existing bespoke `1125 x 240` canvas with a shared safe zone, perform no integration until the user chooses, then integrate the explicitly selected C direction through the existing exact-ID nameplate and `mode_character_wins` contracts.

**Consequences**: Creative choice remained human-gated. The previous untracked Denia candidate was preserved in task research before the selected C asset replaced it; generic nameplates and other character owners remain unchanged.

## Out of Scope

- Changing the shared generic nameplate geometry or adding Danya-specific branches to individual consumers.
- Reusing Sigrika's sun, citrus, leaf, or wind-tail motifs.
- Adding a character portrait, stitched doll, patchwork, sewing, mending, or baked username to the raster.
- Modifying battle rules, character balance, or the generic achievement-condition API.

## Technical Notes

- Runtime DOM owner: `src/shared/UserIdentity.jsx`.
- Existing bespoke reference slot: `150 x 32`, backed by `1125 x 240` art.
- Existing generic and Sigrika-specific nameplates remain unchanged.
- Visual research: [`research/danya-dossier.md`](research/danya-dossier.md).
- Visual language: [`research/danya-visual-language.md`](research/danya-visual-language.md).
- Current concept evaluation: [`research/concept-evaluation-v4.md`](research/concept-evaluation-v4.md).
- Current prompt record: [`research/concept-prompts-v4.md`](research/concept-prompts-v4.md).
- Latest concept evaluation: [`research/concept-evaluation-v6.md`](research/concept-evaluation-v6.md).
- Latest prompt record: [`research/concept-prompts-v6.md`](research/concept-prompts-v6.md).
- Pre-existing unrelated dirty paths were recorded before work and must remain excluded.
