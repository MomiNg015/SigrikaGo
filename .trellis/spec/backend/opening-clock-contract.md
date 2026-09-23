# Opening Presentation Clock

## Scope / Trigger

Changes to opening snapshots, countdown copy, or presentation lifetime across devices.

## Signatures

- `buildRoomView(room, viewerId, options)` includes `openingServerNow: number` only in `GAME_PHASES.opening`.
- `normalizeRoomSnapshot(room, receivedAt = Date.now())` derives client-only `__openingEndsAt`.
- `OpeningModal` locks the initial local deadline and passes it to `OpeningDuelPresentation`.

## Contract

`__openingEndsAt = receivedAt + max(0, openingEndsAt - openingServerNow)`. Preserve a derived deadline on repeated normalization. Keep the original server deadline intact for room identity/keying. Never persist the client field or let it control server game phase. The playing snapshot still unmounts the overlay immediately, including when network transit makes the local estimate late.

## Validation / Error Matrix

- Device time ahead or behind server: same opening duration and countdown.
- Snapshot normalized twice: no extension.
- Deadline already expired on server: zero remaining time.
- Repeated opening snapshots while mounted: no restarted deadline/animation.
- Legacy snapshot missing server time: retain the existing absolute-deadline fallback.

## Good / Base / Bad Cases

Good: convert remaining duration at snapshot reception. Base: old-server fallback remains compatible. Bad: compare a server timestamp directly to an unrelated device wall clock and hide the entire opening.

## Tests Required

`roomView.test.js` locks opening-only serialization; `roomSnapshot.test.js` verifies local conversion, expiry and repeated normalization; `OpeningDuelPresentation.dom.test.jsx` verifies clocks ahead/behind by 60 seconds and no deadline extension during rerender.

## Wrong vs Correct

Wrong: `Date.now() >= room.openingEndsAt` is treated as authoritative expiry on every phone.

Correct: compare against the locally anchored remaining duration; let the authoritative phase transition win.
