# Spectator Visibility Contract

## Scope / Trigger
Changes to room projections, spectator perspectives or live history browsing.

## Signatures
`buildRoomView(room, viewerId)` returns `game` and `gameViews`.
`gameViewForColor(game, null)` projects an observer who owns neither player color.

## Contracts
- Unfinished spectator rooms use the null-color projection and `gameViews: null`.
- Both owners' unexposed hidden hands are concealed; both owners' color illusions apply only in the existing illusion phases.
- `useRoomBoardView` derives the lock from the source room's finished phase, independent of the historical board phase. The locked effective color is null and the setter ignores switch attempts.
- Finished rooms retain black/white payloads; independent record replays permit switching. Player projection semantics remain unchanged.

## Validation / Error Matrix
- Live or historical view of an unfinished match: locked public perspective.
- Match finishes while browsing history: unlock perspective selection.
- Replay source snapshot has a playing phase: explicit replay mode still allows switching.
- Legacy alternate payload: frontend reprojects its canonical game with null color while locked.

## Good / Base / Bad Cases
- Good: both players have visual skills and the spectator receives both restrictions.
- Base: standard mode without skills still locks ongoing spectator perspectives.
- Bad: hiding buttons while sending an owner's unrestricted hidden-hand projection.

## Tests Required
Room projection tests cover both hidden hands, both illusions, canonical-state immutability and unchanged player views. Hook tests cover live/history locking, ignored setter calls, terminal unlocking and standalone replay selection.

## Wrong vs Correct
Wrong: `gameViewForColor(room.game, COLORS.black)` for an ongoing spectator.
Correct: `gameViewForColor(room.game, null)` and no alternate perspective payload.
