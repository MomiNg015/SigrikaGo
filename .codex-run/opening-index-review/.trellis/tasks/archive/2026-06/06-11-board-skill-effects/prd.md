# Board Skill Effects

## Goal

Add a PixiJS presentation layer over the existing React board so Spark mode skills have 1-3 second character-specific board animations after the skill banner finishes. The first release covers Sigrika erase-point, Danea flip-stone, and Baconbits random-blast while preserving the current backend game-rule resolution.

## What I Already Know

- The board is currently a React DOM/SVG interaction layer in `src/room/Board.jsx`.
- The backend already has a delayed `skillPreview` phase and pending skill resolution.
- Current skill preview resolution delay is 2000ms.
- The user wants the banner/voice to appear first, then the board animation starts only after the banner disappears.
- The first release scope is exactly three skills: Sigrika meteor erase, Danea bubble flip, and Baconbits 3x3 explosion.
- The animation layer must work on desktop and mobile.
- The implementation must not change backend game adjudication logic.
- Every update must keep `docs/system-design.md` synchronized.

## Requirements

- Add `pixi.js` and `@pixi/react` dependencies for the board effects layer.
- Keep DOM point buttons as the only board interaction surface; the Pixi canvas must not receive pointer events.
- Add a board-coordinate mapping helper that maps `point.id` and `game.size` into actual board pixel centers.
- Extend pending skill preview metadata with effect data needed by the client:
  - `effectType`
  - `targetId`
  - `affectedPointIds`
  - `markedPointIds`
  - `removed`
  - `removedByColor`
  - `resolvesAt`
- Add `effectType: "erase-point"` to erase-point history entries for consistent animation and replay routing.
- Increase the skill preview window to cover banner time plus board animation time, defaulting to about 4 seconds.
- Play the board animation after the banner phase, not at the same time as the banner.
- Respect `prefers-reduced-motion: reduce` by using a short static/fade effect without fly-in, explosion, scaling, or board shake.
- Keep Standard mode free of Spark skill animation side effects.

## Acceptance Criteria

- [ ] Sigrika erase-point displays a meteor-style hit before the final erased intersection appears.
- [ ] Danea flip-stone displays a bubble-wrap/pop effect before the final stone color appears.
- [ ] Baconbits random-blast displays a character fly-in and 3x3 blast effect before the final removed stones appear.
- [ ] Animations align to target intersections on both 13-line and 19-line boards.
- [ ] Animations align and stay contained on desktop and mobile battle layouts.
- [ ] Board buttons, scoring marks, coordinates, and existing skill targeting behavior still work.
- [ ] Game-rule tests confirm skill outcomes are unchanged except for presentation metadata.
- [ ] `docs/system-design.md` documents the new architecture.

## Out of Scope

- Rewriting the full board renderer into PixiJS.
- Replacing normal move, scoring, or territory visuals with PixiJS.
- Adding custom art generation for new assets.
- Animating Aemeath hidden-hand or Nabomo passive illusion in the first release.
- Changing backend skill legality, capture, score, turn, or win/loss rules.

## Technical Notes

- The existing skill preview lock already prevents new actions while a skill is presenting.
- `pendingSkill.id` should be used to de-duplicate animation playback.
- Existing assets include `/assets/sigrika_centered.webp`, `/assets/Danea_centered.webp`, `/assets/baconbits.webp`, and `/assets/effects/denia-bubble-pop.webp`.
- `random-blast` history already records `id`, `marked`, `removed`, and `removedByColor`.
- `flip-stone` history already records `effectType`, `id`, and `skillRemovalOwner`.
- `erase-point` currently lacks `effectType` in history and should be normalized.

## Definition of Done

- Tests added/updated for metadata, board rendering, coordinate mapping, and reduced-motion behavior.
- Relevant existing tests continue to pass.
- `npm run build` passes.
- `docs/system-design.md` updated.
