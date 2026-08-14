# Current special-duel, watch, and clock architecture

## Confirmed behavior

* `createSigrikaCandyDuelRoom()` derives from the practice-room factory, then sets `matchSource` to `sigrika-corruption-duel`, `privateOwnerUserId`, `unlimitedTime=true`, and unlimited clock payloads for both players.
* `startGameClock()` returns immediately for `room.unlimitedTime`; ordinary clocks are server-authoritative and tick only the active player's time.
* Ordinary player clocks are 5 minutes plus three 30-second byo-yomi periods. `TimeBar` assumes a five-minute main-time denominator and changes to a distinct byo-yomi UI once main time reaches zero, so a 30-minute no-byo-yomi contract needs an explicit clock shape/progress basis rather than only replacing one constant.
* `sigrika-candy:duel-start` resumes an owner's existing special room before creating a new one. New creation currently has no global special-duel occupancy check or atomic reservation.
* `listWatchRooms()` explicitly excludes both practice rooms and `sigrika-corruption-duel` rooms.
* `attachSocketToRoom()` rejects every non-player when a room has either `privateOwnerUserId` or `sigrikaCandyDuel`; this must be narrowed without making ordinary private duels public.
* Generic watch joining already has server admission limits, spectator reconnect behavior, presence patches, and safe per-viewer room projection. The special duel can reuse that lifecycle after its explicit privacy exception is designed.
* `HomeStage` disables the entire `HomeUtilityDock` while the account is in a corrupted phase. The requested watch exception should be represented as a per-action lock, keeping the other utility controls unchanged.
* The existing Watch modal groups rooms only by the three game modes. The accepted product direction keeps the special duel out of this modal entirely: its only new spectator entry is the occupied-state duel button inside the corrupted mode picker.

## Design implications

* The one-duel invariant must be enforced in the same synchronous server authority that creates/registers rooms; a pre-check alone is insufficient if two socket handlers interleave around asynchronous work.
* Restored unfinished special rooms must occupy the slot before new traffic is admitted. Finished or destroyed rooms must release it based on room lifecycle, not KataGo connection state.
* Owner resume must be checked before the global busy response.
* Special-spectator access should reuse room membership, admission limits, presence patching, and `buildRoomView`, but enter through the special-duel action so the server can atomically resolve owner resume, someone-else spectating, or free-slot creation while enforcing the corrupted-arc permission.
* The clock contract must encode no byo-yomi without letting generic timing code dereference null/undefined period state or making the UI calculate progress against the current five-minute constant.
