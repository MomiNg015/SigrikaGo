# Create Denia achievement nameplate concepts

## Goal

Create four hand-painted, character-specific username nameplate concepts for Denia, tied to the achievement "星炬模式使用达妮娅胜利100次", so the user can select a visual direction before production integration.

## Requirements

- Treat this as `new` visual-identity work.
- Research Denia from the supplied Kuro Wiki page, official Kuro materials, repository character metadata, portrait, skill presentation, and achievement wording.
- Deliver four separate concepts at the same `1125 x 240` (`4.6875:1`) ratio.
- Make the four concepts structurally different, not color-only variants.
- Use hand-painted gouache/watercolor-like edges and character-derived motifs.
- Keep the dynamic username safe zone quiet from approximately `x=315` through `x=990`.
- Do not bake usernames, character names, letters, numbers, logos, UI labels, or portraits into the raster.
- Store all concepts under this task directory only.
- Stop after presenting the four concepts and wait for explicit user selection or revision direction.

## Acceptance Criteria

- [ ] Four individual concept images exist under `concepts/`.
- [ ] Every concept communicates a different narrative/composition direction.
- [ ] Each concept is evaluated at the intended runtime height of roughly 32px.
- [ ] The central username carrier remains low-detail and readable.
- [ ] No production achievement asset, reward seed, CSS owner, or runtime integration is changed before selection.
- [ ] Existing unrelated dirty files remain untouched.

## Definition of Done

- Research note and visual-language card are persisted under the task.
- Four concepts are presented with short neutral labels.
- Work stops at the mandatory human selection gate.

## Technical Approach

Use the built-in image generation path with local official/reference artwork supplied only as character and palette references. Generate each direction independently from a dedicated prompt, copy each preview into the task directory, inspect the source image and a runtime-height reduction, then present all four without ranking them.

## Decision (ADR-lite)

**Context**: The requested artifact is a bespoke character reward skin, while the repository already has a fixed-ratio `UserIdentity` contract and a mandatory human selection gate.

**Decision**: Explore four concepts on the existing bespoke `1125 x 240` canvas with a shared safe zone, but perform no final-alpha preparation, CSS motion, reward wiring, or production integration until the user chooses.

**Consequences**: This keeps creative choice human-gated and avoids overwriting the unrelated untracked Denia nameplate currently present in `public/assets/achievements/`.

## Out of Scope

- Creating or changing the achievement/reward seed.
- Replacing `public/assets/achievements/denia-spark-100-wins-nameplate.png`.
- Transparent-background cleanup and deterministic final-asset validation.
- Asset-specific CSS, motion, preview harness integration, tests, and system-design updates.
- Git staging, commit, or push.

## Technical Notes

- Runtime owner: `src/shared/UserIdentity.jsx`.
- Generic slot: `96 x 25.6` (`3.75:1`); bespoke reference slot: `150 x 32` backed by `1125 x 240` art.
- Repository Denia fallback: sleepy Star Torch Academy student; pink palette; `泡影幻梦` flips a stone; bubble SFX/art are already part of her in-project presentation.
- Existing dirty paths recorded before work: `docs/system-design.html`, `docs/system-design.md`, and untracked `public/assets/achievements/denia-spark-100-wins-nameplate.png`.
- Research: [`research/denia-visual-research.md`](research/denia-visual-research.md).
- Visual language: [`research/denia-visual-language.md`](research/denia-visual-language.md).

