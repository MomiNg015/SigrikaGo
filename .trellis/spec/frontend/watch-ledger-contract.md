# Watch Ledger Contract

## Scope / Trigger
Changes to the watch-list layout, mode queries, search or join controls.

## Signatures
`GET /api/rooms/watch?mode=all` returns the existing `{ rooms, roomCounts }` shape. `WatchModal({ token, characters, onJoinRoom, onNotice, onClose })` owns search and request state.

## Contracts
Only the literal `all` skips the mode filter; absent and invalid modes retain normalization. Eligibility stays in `listWatchRooms`, including practice and special-story exclusions. Do not interpret `onlineCount` as spectator count. Preserve character appearance snapshots and `UserIdentity` equipment. Clicking the transparent native button covering a room row calls the existing join helper and closes the list; do not simulate room admission.

Remove the bookmark host and all type tabs. Desktop uses a semantic table with columns for room, mode, population, black, white, moves and status. At <=900px each match is one paper card: type/code/people/status above stacked black/white identities, with the hanging move placard on the right. Names wrap at 16px; metadata stays at least 13px. Keep room counts next to the code and label them as room population. Reuse the neutral battle-header placard without inventing a current turn: 70x48 desktop, 58x48 portrait, with three/four-digit sizing and clearance for rotation/shadow. Both viewports expose one full-row native button without visible action text; Enter and Space join exactly once. Keep 44px action targets and original shell artwork. Shell height is 700px desktop / 740px at <=768px, capped by the shared sticker budget; only the list scrolls.

`watch-ledger.css` owns shell, fields and desktop layout; `watch-ledger-mobile.css` owns portrait geometry; `watch-ledger-paper.css` owns the friend-matched search frame, card material and tactile feedback. Import the three before the final spectator owner. Search uses a 2px ink frame, 8px corner, 3px/4px hard shadow and 16px text; no search button or added focus outline/glow. Input still filters locally with trim/lowercase.

Cards use 2px ink edges and 3px/4px hard shadows. Fine-pointer hover lifts paper/content (-1,-2) and extends the shadow (4,6); press sinks (2,3) with a (1,1) shadow. Move the pseudo-element backing and content cells together while keeping the `.wl-row` snap target stationary. Playing cards use warm paper with mint hover; `.finished` cards always use `--wl-finished-paper` (neutral gray), including hover and press. Keep avatars, move placards and explicit gray status text readable; finished state is not disabled. Status uses a colored dot plus text, not color alone. Respect reduced motion.

`useWatchListRows()` returns the list ref. After fonts, content or size changes it measures natural row heights and the remaining viewport after padding/table header, then fits an integer number of complete rows using `--wl-row-height` and `--wl-scroll-start`. Gate layout on `--wl-row-min` so other themes are untouched; skip empty/unavailable geometry, retain natural height if one card is taller than the available viewport, and disconnect observers/cancel scheduled work on unmount. Reserve top/right/bottom gutters for hover and shadows. Native `scroll-snap-type: y mandatory` handles wheel/touch; geometry tests must wait for smooth scrolling to stop before evaluating complete cards.

## Validation / Error Matrix
Initial loading has no empty state. A failed refresh retains previous rows and exposes the error; a successful retry clears it. Empty search results use `WindowEmptyState`. Invalidate obsolete requests on token changes and unmount. Search never makes API requests.

## Good / Base / Bad Cases
Good: mixed four-mode results, long names, 1024 moves, 128 people, 30 rooms, last action reachable at 320px. Base: seven rooms with readable compact players at 390px. Bad: deleting tabs while still requesting only Spark, clipping mobile names, or exposing practice rooms.

## Tests Required
Route tests cover explicit all and unchanged absent/invalid filtering; existing room-query exclusion tests remain required. DOM tests cover four labels, no tabs/search button, local search, finished-room actions, join/close, refresh failure and retry. Hook tests cover measured resize, natural-height changes, empty lists, theme gating, ResizeObserver fallback and cleanup. Browser checks cover 1440/1024/800/390/360/320px, short portrait, images, empty/many/long data, whole-card wheel/touch rest positions and final-row shadow clearance. `watch-paper.spec.js` checks the real AppOverlays path, live searching without requests, refresh to finished, neutral gray in idle/hover/press and retained actions. The isolated preview mounts the production component without duplicate CSS or row-measurement logic.

## Wrong vs Correct
Wrong: omit `mode` to request all rooms. Correct: request `mode=all` explicitly and preserve the old default for existing callers.

Wrong: disable finished matches or paint them mint on hover. Correct: keep their existing join action and neutral gray surface in every pointer state.
