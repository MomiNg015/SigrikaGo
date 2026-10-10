# Denia paper swarm transformation

## Accepted requirements
- Denia skill banner starts normally; 1000 ms later dense small black paper people fly left to right across the viewport.
- Match the user's reference: round head, splayed limbs, blue/violet/pink fine outlines, four-point star face. User subsequently requested larger pieces: mobile approximately 34–56 px; desktop 44–76 px. Reduce count proportionally and preserve brief dense cover.
- User raised performance concerns: prerender the dense field, move eight cached strips per frame plus at most 64 foreground sprites; measure frame cost and bounded memory.
- At 1750 ms, under dense cover, switch banner and battle information art to the user's supplied transparent PNG. Keep that form until this match ends (explicitly confirmed).
- Extend only Denia's enabled cinematic banner to 3200 ms; preserve the board-effect timing relative to banner end and authoritative resolution. Other characters unchanged.
- Reuse visible history for persistence/replay rather than account or browser storage. Team portraits derive each visible member's round; hidden members remain hidden.
- Reduced motion/disabled effects omit the swarm but retain form change. Clean up timers/RAF on interruption. Register/preload both assets.
- Preserve unrelated WIP. Update system design and applicable cut-in contract. Verify desktop/mobile production components, state lifecycle and server timing.

## Sources
- User supplied full-body PNG: codex-clipboard-fee62e2c-e63e-44b0-af80-adc6edcf6ba4.png.
- User supplied paper-person reference: codex-clipboard-3f534edb-b55f-4a13-bb3e-99adcb400c5e.png. This is the visual authority; the web search only corroborated the character motif.

## Implementation
Shared battle-form/timeline helpers; Canvas 2D sprite swarm with bounded pixel ratio and deterministic particles; existing full-body banner and CharacterBustPortrait integration. No gameplay skill rule changes or account appearance writes.

## Verification outcome
206 related tests passed; lint, build, generated system-design documentation and built CSS contracts passed. Desktop 1440x900 and mobile 390x844 production RoomScreen preview confirmed simultaneous loaded art, retained form, reset, disabled effects and reduced motion. Canvas peak cover is approximately 98%; performance cache reduces maximum per-frame draws to 72. CSS inventory retains the same two pre-existing failures (899-byte excess and unrelated 360px breakpoint); unrelated WIP is preserved.
