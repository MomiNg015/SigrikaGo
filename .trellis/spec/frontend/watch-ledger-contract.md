# Watch Ledger Contract

## Scope / Trigger
Changes to the watch-list layout, mode queries, search or join controls.

## Signatures
`GET /api/rooms/watch?mode=all` returns the existing `{ rooms, roomCounts }` shape. `WatchModal({ token, characters, onJoinRoom, onNotice, onClose })` owns search and request state.

## Contracts
Only the literal `all` skips the mode filter; absent and invalid modes retain normalization. Eligibility stays in `listWatchRooms`, including practice and special-story exclusions. Do not interpret `onlineCount` as spectator count. Preserve character appearance snapshots and `UserIdentity` equipment. Clicking a native watch button calls the existing join helper and closes the list; do not simulate room admission.

Remove the bookmark host and all type tabs. Desktop uses a semantic table with a type column. Mobile has three compact rows: code/type/status, parallel black/white identities, moves/people/watch. Use bounded identity tracks and ellipsis with full-name titles. Keep 44px action targets and original shell artwork. `watch-ledger.css` precedes the final spectator owner. Playing status uses green text and underline; finished status uses neutral gray on desktop and mobile, with explicit status text retained. Shell height is 700px desktop / 740px mobile capped by the shared sticker budget; only the list scrolls.

## Validation / Error Matrix
Initial loading has no empty state. A failed refresh retains previous rows and exposes the error; a successful retry clears it. Empty search results use `WindowEmptyState`. Invalidate obsolete requests on token changes and unmount. Search never makes API requests.

## Good / Base / Bad Cases
Good: mixed four-mode results, long names, 1024 moves, 128 people, 30 rooms, last action reachable at 320px. Base: seven rooms with readable compact players at 390px. Bad: deleting tabs while still requesting only Spark, stacking both players vertically, or exposing practice rooms.

## Tests Required
Route tests cover explicit all and unchanged absent/invalid filtering; existing room-query exclusion tests remain required. DOM tests cover four labels, no tabs, local search, join/close, refresh failure and retry. Browser checks cover 1440/390/360/320px, images, empty/many/long data, stable shell, full counts, <=116px ordinary phone rows and keyboard focus.

## Wrong vs Correct
Wrong: omit `mode` to request all rooms. Correct: request `mode=all` explicitly and preserve the old default for existing callers.
