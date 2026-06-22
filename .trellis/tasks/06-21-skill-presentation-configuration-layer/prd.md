# Skill Presentation Configuration Layer

## Goal

Introduce a shared skill presentation configuration layer for board skill effects so future visual upgrades and a unified "disable effects" control have one stable integration point.

## Requirements

- Keep existing React board interaction and Pixi renderers behaviorally compatible.
- Centralize skill presentation timing and layer capability decisions in `src/shared/skillPresentation.js`.
- Add a normalized option for disabling skill presentation effects without loading Pixi, rendering the overlay, or scheduling board effect audio.
- Preserve DOM/CSS-only effects such as `row-slash` outside the Pixi board effect layer.
- Keep reduced-motion behavior as a short static hit presentation.
- Update system design documentation because this changes the presentation architecture.

## Acceptance Criteria

- [ ] Board skill effect timing is resolved through the shared presentation layer.
- [ ] `BoardSkillEffects` can receive an effects-disabled setting and render no effect layer or prewarm path.
- [ ] Existing board-effect catalog and renderer registration tests still pass.
- [ ] New tests cover shared presentation config and disabled-effect behavior.
- [ ] `docs/system-design.md` or a related system-design chapter is updated and `npm run docs:system-design` is run.

## Definition of Done

- Tests added or updated for changed behavior.
- Focused tests pass.
- Docs generation passes.
- Existing Pixi renderer functions remain registered by `effectType`; no concrete animation rewrite is included in this task.

## Technical Approach

Add a normalized presentation config API in `src/shared/skillPresentation.js`, then make `BoardSkillEffects.jsx` consume it for timing, layer gating, prewarm gating, and future effect-disabling support. Keep concrete Pixi animation code in `boardSkillEffectRegistry.js`.

## Decision (ADR-lite)

Context: Skill effects currently have timing constants and board-effect checks split across shared metadata and the React Pixi host.

Decision: Add a shared presentation layer that derives board-effect availability from `SKILL_EFFECT_CATALOG`, keeps per-effect layer overrides for DOM-only visuals, and exposes `effectsEnabled` as the future global kill switch.

Consequences: This creates a single extension point for richer VFX, while intentionally not changing the current visual quality in the same task.

## Out of Scope

- No new Rive/Lottie/Spine integration.
- No redesign of individual skill animations.
- No settings modal UI for the disable-effects control yet.
- No backend protocol changes.

## Technical Notes

- Existing host: `src/room/BoardSkillEffects.jsx`.
- Existing concrete renderers: `src/room/boardSkillEffectRegistry.js`.
- Existing catalog metadata: `src/shared/skillEffectCatalog.js`.
- Relevant frontend spec: `.trellis/spec/frontend/component-guidelines.md`, Board Skill Presentation Contract.
