# Team Match Contract

## Scope / Trigger

Changes to team admission, character handoff, room projection, stage playback or replay-only settlement.

## Signatures

- `match:join({ mode: "team", lineup: string[3] }, ack)`; acknowledgement is `{ ok, error? }`.
- `resolveTeamLineup(user, ids, catalog)` validates server-owned snapshots.
- `advanceTeamRound(room, { now, scheduleGameStart, io })` returns whether a handoff occurred.
- Room `team: { round, rounds: [{ round, startMove }] }`; player `teamLineup` contains character/costume snapshots.

## Contracts

Use an independent FIFO queue and the Spark board/time rules. Do not add team to rated `GAME_MODE_IDS`. Before each handoff finish pending skill resolution and extra turns; thresholds remain global moves 40 and 80. Terminal state wins. Preserve board effects, captures, accumulated costs, turn and clocks; initialize incoming skill/passive state and clear derived skills. Reset the no-first history boundary each round.

Use authoritative opening deadlines for every five-second stage. Freeze play and clocks. Round 1 includes nigiri. Reconnect uses the remaining deadline. Play only the local participant's current sortie voice once per round; preserve volume/mute controls. Resolve the last skill music from the lineup member at that history event, never from the newly active member. Stage handoffs must not switch BGM.

Persist all three members privately. Project unrevealed opponent/spectator slots as null identity/configuration/costume. Reveal all on finish. Never spread the private lineup into game players or public users. The player's account default character must not change with handoff.

Settlement saves the terminal replay only, including early finishes, and never changes rank, coins or existing record metrics. Replay must interpret round events and restore the character at that step.

## Validation & Error Matrix

- Fewer than three available owned members: exact minimum-member toast, no queue admission.
- Duplicate, disabled, unowned or blocked member: reject lineup; revalidate waiting candidates before pairing.
- Pending skill / extra turn at boundary: defer; after resolution switch before the next passive.
- Repeated snapshots / reconnect: no deadline reset or duplicate round voice.
- Save failure: clear recordSaved so existing retry machinery can retry.

## Good / Base / Bad Cases

Good: projected opponent slots cannot disclose IDs even by inspecting JSON. Base: same board and clocks through all rounds. Bad: hiding images while sending the private lineup, or clearing accumulated overclock on switch.

## Tests Required

`server/teamMatch.test.js`: ownership, queue isolation, projection, terminal precedence, deferred handoff, state retention, reset, restore, settlement and replay. `TeamLineupPicker.dom.test.jsx`: minimum admission, order, reorder and stored invalid members. `teamRoundVoice.test.jsx`: per-round local identity and replay/spectator silence. Browser checks cover desktop, 390 and 360 portrait widths and equal portrait slots.

## Wrong vs Correct

Wrong: replay every skill using the final `room.players` character.

Correct: begin with the first lineup member, process each `team-round` history event, and reset personal skill state while preserving the board.

Replay browsing inherits the invoking profile mode with no tabs in the replay dialog. Spark queries include both spark and team in one cursor-paginated result. Team rows have a flag corner badge with scroll-content clearance; this grouping does not merge statistical totals.
