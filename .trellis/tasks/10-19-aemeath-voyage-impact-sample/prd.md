# Aemeath Voyage Star impact sample

## Goal
Review the current Voyage Star board effect, research the official Aemeath combat showcase, and deliver a playable giant-sword / earth-fracture prototype without the mech.

## Requirements
- Preserve the Go-board context and target position; demonstrate mass, acceleration, impact hold, radial cracks, lifted ground, ballistic debris, dust and settling.
- Create an isolated sample under `docs/design-samples/aemeath-voyage-2026-10-19/`; do not replace the production renderer during this exploration.
- Include replay, pause, slow playback, timeline scrubbing, presentation variants and camera-shake control.
- Support desktop and portrait widths, deterministic seeking, reduced motion and background-tab pause.
- Keep actual board state unchanged; all destruction is a visual simulation.
- User follow-up: include the existing SkillBanner, transformation, original cast voice and the voyage-specific BGM (`lhl_intro_once.ogg` / `lhl_loop.ogg`). Full playback uses the original 3.2 second banner; slow/scrub controls operate on the board segment to preserve its production timers. Schedule music and the impact against one audio clock; expose impact timing and music offset controls.
- Update the system-design entry and generate its HTML.

## Assumptions and decisions
- User correction: reject the invented mechanical sword. Use an intentionally abstract colossal light blade, without invented armor, guard or engraving; exact Exostrider replication would require a sufficiently clear reference. Discard the generated mechanical asset from the sample. Weight comes from staging, ground response and audio synchronization.
- User has explicitly requested exploration plus a sample; proceed with a concrete draft rather than requiring a separate approval round.
- Use a local Canvas 2D projection for the prototype: abstract translucent lightblade, depth-sorted debris and fractured board surface. No new dependency or external runtime CDN.
- Explore three presets on the same timeline: weight, energetic blast and restrained board-compatible version. Weight is the default.
- Existing production Pixi renderer remains the later integration boundary; detailed 3D model fidelity is outside this sample.

## Acceptance
- [x] Review findings and official reference links recorded.
- [x] Sword is deliberately abstract with cyan/violet luminous edges and a narrow core, without invented mechanical details; hit timing precedes fractures and secondary dust.
- [x] Replay, pause, speed, scrub, variants and shake controls work.
- [x] Desktop and 390/320 px portrait render without horizontal overflow; no page errors.
- [x] Reduced-motion mode is calm and audio starts only by explicit user action.
- [x] System-design HTML regenerated and focused verification recorded.

## Expansion considered
- Later port to existing Pixi lifecycle and authoritative effect timing; no gameplay changes now.
- Edge targets, mobile crop, repeated replay, paused resizing and page visibility must remain stable.

## References
- Official YouTube: https://www.youtube.com/watch?v=psq5Izh9GHM
- Official Bilibili: https://www.bilibili.com/video/BV1qZ6yBXEVv
- Production owner: `src/room/boardSkillEffectRegistry.js` (`playVoyageStar`, `drawVoyageStarEarthquake`, `drawVoyageStarSword`).
