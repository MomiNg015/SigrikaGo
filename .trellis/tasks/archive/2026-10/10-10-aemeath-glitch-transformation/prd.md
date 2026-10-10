# Aemeath Voyage Star transformation

## Requirements
Use the supplied transparent full-body PNG unchanged. Only Aemeath voyage-star triggers a full-window data glitch at 1000ms: a 260ms burst of broken cyan/magenta scan bands and fragmented glyphs bridges synchronized portrait replacement at 1120ms. Preserve the ordinary 2000ms banner and authoritative board resolution.

Follow prior match-only persistence: retain through the match, reconstruct from visible history for replays/reconnects, restore on cancellation/reset, isolate team rounds. Later skill banners retain the form. No account/costume/palette mutation or Denia choreography changes.

## Approach
Extend the existing battle-form lifecycle into one shared hook with character-specific rules. Shared portrait resolvers supply full-body and crop sources; preload through existing effects resources. A small pointer-transparent CSS overlay exists only during the burst. Reduced motion and disabled effects omit the burst but preserve transformation. No screen cloning or new rendering library.

## Acceptance
- [x] Only voyage-star triggers; both surfaces swap together after 1s hold.
- [x] Snapshots, cancellation, reset, later casts, history and team rounds correct.
- [x] Desktop and portrait phone art loaded; no overflow or interaction blocking.
- [x] Tests, lint, build, CSS checks and rendered playback verified.
- [x] Docs and cut-in contract updated; unrelated WIP preserved.

## Validation
119 focused tests and 89 style/document contracts passed. Desktop and mobile real-skill stability: 4 passed. Lint, build, built CSS passed. Decoded art and reset checked in actual desktop/mobile RoomScreen. CSS inventory retains only prior 899-byte and 360px-query failures; unrelated WIP remains excluded.
