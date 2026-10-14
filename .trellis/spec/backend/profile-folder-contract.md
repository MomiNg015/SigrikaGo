# Profile Folder Contract

## Scope and triggers
Read before changing profile play navigation, challenge summaries, ordinary/team replay filtering or rank placement. `ResumeModal` and `UserProfileCard` share `ProfileResumeView`; the selected club dossier supersedes their external bookmark rail and four-card layouts.

## UI and API signatures
- Families: Spark → regular/capture/team; standard → regular; other → gomoku. Team has independent UserModeStats progression; keep GAME_MODE_IDS limited to the three top-level ordinary entries so it does not create another navigation family or leaderboard.
- `GET /api/users/:id/capture-record` uses `authHttp`; returns `{ record: null }` or `{ record: { captures, ranking, characterId, costumeSnapshot } }`.
- Existing self/user replay endpoints accept `scope=regular`. Absent/unrecognized scope retains the old behavior; ordinary Spark scope sets mode to spark only and filters matchSource to matchmaking/duel/private before pagination.
- Completed team summaries optionally include `teamLineups.black/white`, at most three `{ characterId, costumeSnapshot }` entries each. The raw room snapshot and character configuration never leave the summary projection.

## Storage and ranking
No schema migration. Read `CaptureChallengeBest` by userId and compute current competition rank as one plus the count of strictly greater captures. Ties share rank. Keep the recorded costume appearance, not the user's current equipment. Ordinary profile statistics retain their rated filter; friend duels remain available as replays. Team profiles query valid mode=team records including historical unrated replays. Rank comes from UserModeStats.team (default 3段 / 2 stars); do not award historical stars or coins. Last ten results include draws, oldest to newest. Character appearances use terminal snapshot.team.round and the first N lineup members for the user color, deduplicated per match. Never infer entry from move counts or a fully revealed terminal lineup. Missing/damaged legacy snapshots count only the known active character.

## Validation and failures
Missing user → 404. Existing user without best → 200/null. Invalid historical costume JSON falls back to null. Replay cursor validation and invalid-record filtering keep their existing contract. Malformed/non-finished lineup snapshots yield no lineup; the UI can fall back to the record's known active character. Never reveal ongoing hidden team members.

## Interaction and state
Rank is a child of the selected regular or team record page: beside metrics on desktop, above metrics on narrow screens. Challenge replaces that content. A compact identity header sits above the folder tabs; use one body scroller and reset old hero grid placement so intrinsic content cannot overlap navigation. Character totals are labelled 出场次数; aggregate totals remain 总对局. Replay controls show their text label. Loading, empty and error states are distinct; errors expose retry. Request identity includes user and token; unmount/account change must ignore old responses. Team switches request mode=team through the same pending/error/retry state as ordinary modes. Keep the last successful data until response. The shared replay dialog uses mode=team without scope=regular and honors disabled state.

## Examples and forbidden patterns
Good: a 3-person tie at 86 captures with two higher players displays rank 3. A friend duel with matchSource=duel remains in regular replay history. Bad: filtering team rows after page slicing, showing ordinary rank under challenge, copying current costumes into historical results, or downloading the entire leaderboard for one user's summary.

## Verification
The final mobile folder owner centers avatar and username vertically in row one with the desktop 24px gap, actions in row two, and an 18px paper-content gutter. Character column headers and colgroups share 40/17/8/8/8/19 percent widths; names may wrap beside 44x48 portraits. Check actual computed layout with the full theme cascade, especially nameplates and 320px screens.

Portrait replay dialogs use time/result above two stacked player rows and a right-side move placard. Retain five direct row children and the whole-row native button; decorative black/white markers and the mobile placard must stay hidden on desktop, including against the shared scoreboard display rule. Historical costume/special portrait resolution, outcome classification, badges and pagination remain unchanged. Verify long names, four-digit counts, Enter/Space activation and last-row reachability.

`server/profileFolder.test.js` covers rank ties, missing/empty users, authenticated route, ordinary SQL scope and completed lineup redaction. `TeamProfile.dom.test.jsx` covers team request/retry/replay isolation in both profile contexts. `server/social.test.js` and `teamProfileRecords.test.js` cover stage-based appearances and legacy outcomes. `ProfilePlayRecords.dom.test.jsx` covers rank location, branch data, retry, account switches and replay callbacks. Existing profile DOM suites cover keyboard navigation/social actions/pending guards. Browser checks cover both contexts, 1440/800/390/360/320 widths and long-list reachability. New CSS owners stay below the file-size gate; account for their scoped debt delta only.
