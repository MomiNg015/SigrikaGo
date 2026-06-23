# brainstorm: adjust Danya skill flip timing

## Goal

Make Denia/Danya's `flip-stone` skill feel causally tied to the bubble animation: the target stone should flip while the corrupt black bubble fully covers it, instead of waiting until after the bubble bursts.

## Requirements

- Move the `flip-stone` pending skill resolution earlier in the shared presentation timing.
- Keep the existing Pixi bubble animation and board overlay architecture intact.
- Preserve the current no-effects behavior: disabled skill effects still resolve at banner end.
- Update system design documentation because this changes runtime skill presentation behavior.

## Acceptance Criteria

- [ ] `skillPreviewResolutionDelay({ effectType: "flip-stone" })` resolves during the post-banner bubble cover phase, before the full default 4000ms preview delay.
- [ ] Server pending resolution snapshots use the same earlier `flip-stone` delay.
- [ ] Existing `flip-stone` Pixi asset and renderer registration remain unchanged.
- [ ] `docs/system-design.md` or the relevant split document records the timing contract.
- [ ] `npm run docs:system-design` regenerates `docs/system-design.html`.

## Definition of Done

- Tests added/updated for the timing behavior.
- Relevant focused tests pass.
- System design HTML regenerated.

## Technical Notes

- `src/shared/skillPresentation.js` owns shared timing and per-effect presentation overrides.
- `server/roomSkillResolution.js` imports the shared timing helpers for pending skill snapshots.
- `src/room/boardSkillEffectRegistry.js` owns the Pixi `flip-stone` bubble animation.
