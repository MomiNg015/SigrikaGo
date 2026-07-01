# Core Playable Ready Preload

## Goal

Reduce visible loading gaps and interaction jank around entering a live room by adding a first-stage playable-ready path: prewarm core room code/resources before and during matchmaking, keep the battle preload screen as the interactive gate, and make the gate observable and testable.

## Requirements

- Keep the scope focused on the core room entry path from home/matchmaking into `match-preloading`/room.
- Prewarm room gameplay code and battle preload dependencies before the user reaches the first interactive room surface.
- Preserve separate mobile and desktop behavior: mobile should prewarm on idle after home entry, while desktop can also prewarm on pointer/focus intent where existing controls expose that signal.
- Avoid broad CSS, animation registry, or app-shell prop refactors in this task.
- Use stable loading feedback; do not expose a half-loaded board or active controls before battle preload completes.
- Record lightweight timing metrics for the playable-ready path without changing backend protocol semantics.

## Acceptance Criteria

- [ ] A focused test proves core room preload modules are invoked by an explicit helper and deduplicated across repeated calls.
- [ ] A focused app/home test proves the idle prewarm is scheduled after the home shell becomes available.
- [ ] Match-success rooms in preloading phase continue to stay on the battle preload route until the server leaves `GAME_PHASES.preloading`.
- [ ] The system design docs describe the playable-ready prewarm contract.
- [ ] `npm run docs:system-design` regenerates `docs/system-design.html`.
- [ ] Relevant focused tests pass.

## Definition of Done

- Tests added or updated before production code where practical.
- Existing preload failure tolerance is preserved: failed resource preloads must not trap the user permanently.
- Mobile and desktop entry behavior remain covered by code or documented contract.
- System design docs are updated because this changes runtime preload behavior.

## Technical Approach

Introduce a small frontend helper for core playable prewarm that loads the room route module, match lifecycle modal module, and shared battle preload helpers through dynamic imports. Wire it into the app shell after authenticated home entry using idle scheduling, and expose explicit prewarm callbacks to home/match entry controls when existing component boundaries make that low risk. Keep authoritative gating in the existing battle preload flow rather than inventing a second protocol state.

## Decision (ADR-lite)

Context: The app already has login preload and battle preload contracts. The current risk is that code chunks and render-time resources can still begin loading only after a user reaches a match transition.

Decision: Add a client-only playable-ready prewarm layer before the existing battle preload gate. It reduces latency but does not replace `room:preload-ready` or server-side room phase transitions.

Consequences: This is a low-risk first stage. It improves cache readiness and measurement without requiring a room protocol rewrite. Later tasks can split skill effects and broaden asset manifests once timing data shows where the next bottleneck is.

## Out of Scope

- Splitting `boardSkillEffectRegistry.js`.
- Reworking the room protocol or adding a new backend ready phase.
- Large CSS cleanup.
- Full browser performance dashboard or production analytics pipeline.

## Technical Notes

- Existing preload contract lives in `docs/system-design/05-assets-audio-preload.md`.
- Existing performance debt and lazy chunking notes live in `docs/system-design/07-performance-tech-debt.md`.
- Frontend preload/state contracts are documented in `.trellis/spec/frontend/quality-guidelines.md` and `.trellis/spec/frontend/state-management.md`.
