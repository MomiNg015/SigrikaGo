# Profile Folder Contract

## Scope and triggers
Read before changing profile play navigation, challenge summaries, ordinary/team replay filtering or rank placement. `ResumeModal` and `UserProfileCard` share `ProfileResumeView`; the selected club dossier supersedes their external bookmark rail and four-card layouts.

## UI and API signatures
- Families: Spark → regular/capture/team; standard → regular; other → gomoku. Backend ranked mode IDs remain spark/standard/gomoku; team is a replay mode, not a new rank.
- `GET /api/users/:id/capture-record` uses `authHttp`; returns `{ record: null }` or `{ record: { captures, ranking, characterId, costumeSnapshot } }`.
- Existing self/user replay endpoints accept `scope=regular`. Absent/unrecognized scope retains the old behavior; ordinary Spark scope sets mode to spark only and filters matchSource to matchmaking/duel/private before pagination.
- Completed team summaries optionally include `teamLineups.black/white`, at most three `{ characterId, costumeSnapshot }` entries each. The raw room snapshot and character configuration never leave the summary projection.

## Storage and ranking
No schema migration. Read `CaptureChallengeBest` by userId and compute current competition rank as one plus the count of strictly greater captures. Ties share rank. Keep the recorded costume appearance, not the user's current equipment. Existing profile statistics and recent results continue to aggregate rated ordinary records; friend duels remain available as replays.

## Validation and failures
Missing user → 404. Existing user without best → 200/null. Invalid historical costume JSON falls back to null. Replay cursor validation and invalid-record filtering keep their existing contract. Malformed/non-finished lineup snapshots yield no lineup; the UI can fall back to the record's known active character. Never reveal ongoing hidden team members.

## Interaction and state
Rank is a child of the selected regular record page: beside metrics on desktop, above metrics on narrow screens. Challenge and team panes replace that content. Identity portraits/nameplates/actions remain separate. Loading, empty and error states are distinct; errors expose retry. Request identity includes user and token; unmount/account change must ignore old responses. Team replay actions honor disabled state and call the existing opener.

## Examples and forbidden patterns
Good: a 3-person tie at 86 captures with two higher players displays rank 3. A friend duel with matchSource=duel remains in regular replay history. Bad: filtering team rows after page slicing, showing ordinary rank under challenge, copying current costumes into historical results, or downloading the entire leaderboard for one user's summary.

## Verification
`server/profileFolder.test.js` covers rank ties, missing/empty users, authenticated route, ordinary SQL scope and completed lineup redaction. `ProfilePlayRecords.dom.test.jsx` covers rank location, branch data, retry, account switches and replay callbacks. Existing profile DOM suites cover keyboard navigation/social actions/pending guards. Browser checks cover both contexts, 1440/800/390/360/320 widths and long-list reachability. New CSS owners stay below the file-size gate; account for their scoped debt delta only.
