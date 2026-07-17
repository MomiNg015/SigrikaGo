# Create Aemeath achievement nameplate concepts

## Goal

Create, select, and productionize a hand-painted, character-specific username nameplate for 爱弥斯, tied visually to the achievement “星炬模式使用爱弥斯胜利100次”.

## Requirements

- Treat this as `new` mode and keep all four concepts task-local until the user selects one.
- Use the supplied official Kuro Wiki dossier as the primary textual source, including its story and voice accordions.
- Match `public/assets/achievements/semantic-nameplate.png` for element complexity, hand-painted finish, end-cluster richness, layered carrier treatment, and runtime readability only.
- Use aqua blue as the dominant color, pink as the supporting color, with only small warm star-gold/white accents where the dossier supports them.
- Include a paper-airplane element in every concept.
- Express Aemeath as a lively campus virtual idol and electronic ghost without drawing her portrait, name, letters, logos, or interface chrome.
- Keep the center quiet and high-contrast for dynamic DOM usernames.
- Make all four concepts structurally different, not color variants:
  - A: identity-object-led paper-plane crest.
  - B: campus virtual-concert / music-led environment.
  - C: electronic-ghost / mecha-flight action trace.
  - D: one-hundred-win persistence and shared journey.
- Evaluate every concept at the real `150 x 32` runtime size.
- User selected Direction B, but rejected its dark navy carrier. Preserve B's paper-airplane / campus-concert / pixel-snowfluff / waveform composition and revise the palette before production integration.
- Revised B must take its dominant sky cyan from Aemeath's head and chest accents (approximately `#78F0F8`, with pale `#9AF7FF` highlights) and visibly intermingle it with pink digital speed trails across the main carrier. Dark blue is limited to thin outlines, fold shadows, and narrow edge definition.
- Do not use watercolor-cloud blobs. Express Aemeath's mecha-knight identity through angular armor-panel cuts, scan lanes, pixel afterimages, broken speed dashes, and bounded digital acceleration effects while preserving B's virtual-idol composition.

## Acceptance Criteria

- [x] The research artifact contains all nine mandatory text-evidence categories with source locators and `found` / `absent` / `inaccessible` status.
- [x] Every selected motif, palette/material choice, and motion verb is traceable through `textual evidence -> interpretation -> visual decision`.
- [x] Four separate hand-painted concepts are saved under this task, each on an exact `1125 x 240` delivery canvas with a transparent exterior.
- [x] All four include a readable paper-airplane motif and aqua-dominant / pink-supporting palette.
- [x] All four match the Sigrika reference tier for density and finish without copying its citrus, sun, leaf, or wind-tail vocabulary.
- [x] The username carrier remains quiet through the declared `x=315..990` safe area.
- [x] A `150 x 32` runtime preview exists for each concept and preserves its identity.
- [x] No production asset, CSS, achievement seed, reward wiring, or generic nameplate behavior changes before user selection.
- [x] Revised B preserves the selected structure while replacing the dark carrier with a sky-cyan field interlaced by pink digital speed effects, with no watercolor clouds.
- [x] Revised B remains readable at `150 x 32` with a dark-ink username treatment and passes the same Alpha/safe-area validator.
- [x] The approved B-v3 raster is installed as a new production asset without overwriting an existing achievement asset.
- [x] An exact-ID Aemeath owner provides `150 x 32` geometry, dark-ink readability, alpha-following cyan/pink illumination, illustration-bound digital speed motion, and a static reduced-motion state.
- [x] Task-local previews cover `1440 x 900`, `1024 x 768`, and `375 x 812` in normal and reduced-motion contexts.
- [x] Focused nameplate tests, the production validator, the CSS inventory contract, system-design docs, and the repository quality gate pass.
- [x] A built-in Aemeath reward asset uses `reward-aemeath-spark-100-wins-nameplate` and the approved production PNG.
- [x] A built-in achievement tracks 100 Aemeath wins in `spark` mode through the existing `mode_character_wins` condition.
- [x] Runtime built-in seeding and `ADMIN_DEFAULT_CONFIG` expose identical Aemeath reward/achievement definitions without overwriting existing admin rows.
- [x] Achievement, default-snapshot, and full repository checks pass after reward wiring.
- [x] Aemeath's username receives an exact-ID optical vertical correction without moving the raster, effects, generic nameplates, or other character owners.
- [x] The corrected username remains visually centered at desktop, compact, and phone scales for Latin, CJK, legacy-overlong, and title-plus-badge cases.
- [x] The refined production raster remains recognizably Direction B while replacing runtime-scale micro-detail with three readable silhouette groups: enlarged paper-flight/idol core, broad blue-pink armor carrier, and folded mecha-speed tail.
- [x] At `150 x 32`, the paper airplane, pixel snowfluff, central carrier, pink speed band, and right folded tail remain separately identifiable without white-glow merging or watercolor-cloud texture.
- [x] Aemeath's exact-ID motion has visibly stronger sortie pulse, horizontal speed travel, and pixel-beacon contrast while keeping the username stable, continuous keyframes transform/opacity-only, and reduced motion readable.
- [x] Updated raster validation, multi-viewport preview, focused tests, docs generation, and the repository quality gate pass without changing generic or other character nameplates.
- [x] The natural-light refinement removes the detached polygon flash, large scale pulse, and reset-like speed sweep while keeping every effect aligned to an illustrated plane or beacon.
- [x] Motion remains perceptible through restrained paper-flight breathing, smooth carrier-lane drift, snowfluff pulse, and sparse beacon shimmer, without moving the username or washing out the B-v4 raster.
- [x] Natural-light previews and focused/full quality gates pass in normal and reduced-motion contexts across desktop, compact, and phone scales.
- [ ] The final light pass remains clearly perceptible at `150 x 32`: a persistent cyan-pink alpha rim, a bounded carrier highlight, and a local snowfluff/paper-flight pulse remain visible without restoring a detached polygon or full-surface scanner overlay.

## Definition of Done

- The user-approved B-v3 image is installed as the Aemeath production raster and remains valid at source and runtime size.
- Exact-ID presentation/motion is integrated without changing generic nameplates or existing character owners.
- Production validation, multi-viewport visual QA, focused tests, docs generation, and the repository quality gate pass.

## Technical Approach

Use the built-in image generation path once per direction. Generate each concept as an ultra-wide hand-painted cutout on a flat removable green key field, remove the key locally, uniformly fit the alpha subject to the `1125 x 240` canvas without stretching, and produce a `150 x 32` runtime preview. The existing Sigrika asset is a structural/complexity reference only; Aemeath's motifs come from the official dossier, the achievement meaning, and the user's explicit paper-airplane/aqua/pink directions.

## Decision (ADR-lite)

**Context:** The shared `UserIdentity` runtime has a fixed bespoke nameplate contract and the production skill requires a human creative gate.

**Decision:** Explore four evidence-backed compositions on the established bespoke canvas, keep every output task-local until selection, then install only the approved revision and attach an exact-ID presentation owner.

**Consequences:** Creative selection remains with the user. Production raster preparation, exact-ID CSS motion, docs, and broad QA proceed only after approval. The user explicitly authorized achievement/reward wiring on 2026-07-17, so the existing built-in seeding and snapshot contracts may now be extended for Aemeath.

**Selection update:** The user selected Direction B on 2026-07-17. The first light-palette revision was rejected because its blue-pink intermingling became watercolor clouds. The user approved B-v3 after it replaced the clouds with sky-cyan/pink armor lanes, scan dashes, pixel afterimages, and digital acceleration while preserving the paper plane, campus-concert fan, pixel snowfluff, waveform, audience lights, and folded-paper closure.

**Runtime-readability update:** After seeing B-v3 in the real home plaque, the user reported that dense micro-detail and broad glow merged at runtime size and that motion was barely perceptible. B-v4 keeps the same narrative but consolidates it into large outlined silhouette groups, reduces micro-marks and beacon count, lowers persistent blur radius, and increases the exact-ID sortie/speed/pixel motion range without moving the username.

**Natural-light update:** The first stronger B-v4 motion pass read as a detached scanner-like light overlay. The accepted refinement removes the polygon mask and repeating scan-line layer, halves the persistent shadow radius, and replaces stepped flashes with `2.1–2.9s` eased local breathing and alternate-direction drift. Computed-style sampling confirmed the paper-flight light stays within roughly one pixel of travel and `0.985–1.025` scale, while normal/reduced-motion previews keep the raster and username clear at desktop, compact, and phone scales.

**Perceived-light correction:** Runtime review showed that the restrained pass became effectively invisible because `screen` blending was stacked over an already bright cyan-white raster. The follow-up restores a clearly visible alpha-following cyan/pink rim and increases the illustration-bound paper-flight, carrier, snowfluff, and beacon contrast. Motion remains alternate-direction and transform/opacity-only; no detached polygon, repeating scanner texture, username motion, or full-plate haze returns.

## Out of Scope

- Overwriting any existing file under `public/assets/achievements/**`.
- Modifying generic nameplate geometry or existing Sigrika/Danya owners.
- Baking usernames, character names, `100`, medals, trophies, crowns, laurels, or logos into the art.

## Technical Notes

- Runtime contract: `1125 x 240` source, `150 x 32` exact-ID slot, minimum Alpha margins `40/40/8/8`, username safe area `x=315..990`.
- Primary source: `https://wiki.kurobbs.com/mc/item/1457744312692867072?wkFrom=catalog`.
- Structural reference: `public/assets/achievements/semantic-nameplate.png`.
- Character palette corroboration only: `public/assets/Aemeath_centered.webp`.
- Research: `research/aemeath-dossier.md`, `research/visual-language.md`, `research/concept-prompts.md`.
