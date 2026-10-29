# Profile Folder Contract

## Scope and triggers
Read before changing profile play navigation, challenge summaries, ordinary/team replay filtering or rank placement. `ResumeModal` and `UserProfileCard` share `ProfileResumeView`; the selected club dossier supersedes their external bookmark rail and four-card layouts.

## UI and API signatures
- Families: Spark → regular/capture/team; standard → regular; other → gomoku. Team has independent UserModeStats progression; keep GAME_MODE_IDS limited to the three top-level ordinary entries so it does not create another navigation family or leaderboard.
- `GET /api/users/:id/capture-record` uses `authHttp`; returns `{ record: null }` or `{ record: { captures, ranking, characterId, costumeSnapshot } }`.
- Existing self/user replay endpoints accept `scope=regular`. Absent/unrecognized scope retains the old behavior; ordinary Spark scope sets mode to spark only and filters matchSource to matchmaking/duel/private before pagination.
- Completed team summaries optionally include `teamLineups.black/white`, at most three `{ characterId, costumeSnapshot }` entries each. The raw room snapshot and character configuration never leave the summary projection.

## Storage and ranking
Read `CaptureChallengeBest` by userId and use `capturePredecessors` to count greater captures, earlier equal-score arrivals, and smaller IDs only at identical timestamps. Ranks are unique; arrival fields and additive migration follow [Unique Leaderboard Order](./leaderboard-order-contract.md). Keep the recorded costume appearance, not the user's current equipment. Ordinary profile statistics retain their rated filter; friend duels remain available as replays. Team profiles query valid mode=team records including historical unrated replays. Rank comes from UserModeStats.team (default 3段 / 2 stars); do not award historical stars or coins. Last ten results include draws, oldest to newest. Character appearances use terminal snapshot.team.round and the first N lineup members for the user color, deduplicated per match. Never infer entry from move counts or a fully revealed terminal lineup. Missing/damaged legacy snapshots count only the known active character.

## Validation and failures
Missing user → 404. Existing user without best → 200/null. Invalid historical costume JSON falls back to null. Replay cursor validation and invalid-record filtering keep their existing contract. Malformed/non-finished lineup snapshots yield no lineup; the UI can fall back to the record's known active character. Never reveal ongoing hidden team members.

## Interaction and state
Rank is a child of the selected regular or team record page: beside metrics on desktop, above metrics on narrow screens. Challenge replaces that content. A compact identity header sits above the folder tabs; use one body scroller and reset old hero grid placement so intrinsic content cannot overlap navigation. Character totals are labelled 出场次数; aggregate totals remain 总对局. Replay controls show their text label. Loading, empty and error states are distinct; errors expose retry. Request identity includes user and token; unmount/account change must ignore old responses. Team switches request mode=team through the same pending/error/retry state as ordinary modes. Keep the last successful data until response. The shared replay dialog uses mode=team without scope=regular and honors disabled state.

## Examples and forbidden patterns
Good: a 3-person tie at 86 captures with two higher players displays rank 3. A friend duel with matchSource=duel remains in regular replay history. Bad: filtering team rows after page slicing, showing ordinary rank under challenge, copying current costumes into historical results, or downloading the entire leaderboard for one user's summary.

## Verification
The final mobile folder owner centers avatar and username vertically in row one with the desktop 24px gap, actions in row two, and an 18px paper-content gutter. Social profile actions use compact 34px controls in a single absolutely positioned bottom-right group on desktop and phones; self-profile personalization uses the same absolute positioning. Visible action text is omitted except the live like count; dynamic ARIA/title labels retain action, pending/relationship state and like count. The like control grows from 54px, while other social controls remain 34px. The page wrapper remains transparent over the common window grid; semantic cards and the hero use the approved opaque warm-paper fill and short shadows. Ordinary Bright School mode tabs use the shared external bookmark rail labelled 星炬/标准/其它; other themes retain inline tabs. Character column headers and colgroups share 40/17/8/8/8/19 percent widths; names may wrap beside 44x48 portraits. Check actual computed layout with the full theme cascade, especially nameplates and 320px screens.

Portrait replay dialogs use time/result above two stacked player rows and a right-side move placard. Retain five direct row children and the whole-row native button; decorative black/white markers and the mobile placard must stay hidden on desktop, including against the shared scoreboard display rule. Historical costume/special portrait resolution, outcome classification, badges and pagination remain unchanged. Verify long names, four-digit counts, Enter/Space activation and last-row reachability.

`server/profileFolder.test.js` covers rank ties, missing/empty users, authenticated route, ordinary SQL scope and completed lineup redaction. `TeamProfile.dom.test.jsx` covers team request/retry/replay isolation in both profile contexts. `server/social.test.js` and `teamProfileRecords.test.js` cover stage-based appearances and legacy outcomes. `ProfilePlayRecords.dom.test.jsx` covers rank location, branch data, retry, account switches and replay callbacks. Existing profile DOM suites cover keyboard navigation/social actions/pending guards. Browser checks cover both contexts, 1440/800/390/360/320 widths and long-list reachability. New CSS owners stay below the file-size gate; account for their scoped debt delta only.

Identity cards prioritize the portrait and username: desktop uses a 104px portrait and 28px plain name; <=900px uses an 84px portrait and 26px plain name. Both contexts follow the original resume's min-height:160px and 28px block padding, yielding 164px desktop and 160px mobile height. Mobile social cards redistribute the same block padding to 16px top/40px bottom to clear all four actions without increasing the card height. Portrait and username centers stay aligned. The action group is position:absolute at right:12px and bottom:10px and does not affect layout. Keep controls on one line, including at 320px. Identity controls and phone replay are 34px square; the like button grows from 54px to preserve its live count. At <=768px hide other icon labels while retaining ARIA/title names. Identity cards share the adjacent cards' 3px/4px shadow; portraits and their masks remain shadow-free. Desktop rank values center independently of their left-aligned heading; narrow layouts retain the original wrapping left-heading/right-value flex row (320px can wrap the value onto a left-aligned second row). Recent results center partial and empty sets independently of the far-left label; phone labels occupy their own left-aligned row above markers sized to fit ten entries.

Capture loading, retryable errors, empty and populated results must all retain the same labelled `.profile-capture-record` section. Its `aria-busy` state follows the request; stale responses remain ignored. Never return a bare empty/loading state outside the card.

## Internal-test achievement availability

### Scope / trigger
Achievement and personalization availability, automatic unlock evaluation and achievement notices during the internal test.

### Signatures
`PROFILE_CUSTOMIZATION_ENABLED` in `src/shared/profileFeatures.js` is false. Both client and server import it. `evaluateAchievementsForUser({ prisma, userId, triggerEvent })` retains its signature and resolves to an empty unlock array while disabled.

### Contracts
Resume controls use native `disabled={!PROFILE_CUSTOMIZATION_ENABLED}` with unavailable titles. Global InteractionFeedback supplies sound/motion and blocks their activation. As a defensive fallback, when the flag is false, both `AppOverlays` entry callbacks enqueue the exact info toast `暂未开放，敬请期待w` instead of opening a window; modal mounting remains guarded. Use the ordinary info tone so achievement-notice suppression does not swallow this feedback. Home refresh continues updating account state without notifying achievement listeners. `useToastQueue` rejects achievement-tone notices from all sources while preserving ordinary feedback. Server evaluation returns before reading conditions, creating unlock rows or granting/retrying rewards. Existing data, historical counters, admin configuration and award code remain intact for restoration through the same flag.

### Validation / error matrix
Disabled + eligible user/event → `[]`, no condition query or award write. Disabled + pointer attempt → unavailable sound/motion, no callback or modal; direct fallback callback → info toast, no modal. Disabled + ordinary notification → ordinary toast retained. Enabled → existing evaluation, grant and modal behavior. Request failure/account changes retain their normal error and stale-response handling.

### Good / base / bad cases
Good: one shared gate covers UI, refresh callback, toast queue and central server evaluation. Base: purchase and gameplay continue recording ordinary history. Bad: only hiding the button or toast while server evaluation still grants rewards.

### Tests required
`server/achievements.test.js` tests the disabled no-query/no-write branch and preserves enabled grant regressions. `profileFeatures.dom.test.jsx` covers callback and queue filtering; `ResumeModal.dom.test.jsx` and `AppOverlays.dom.test.jsx` cover disabled native controls, the fallback toast queue, application-level guards and enabled opening behavior.

### Wrong vs correct
Wrong: leave `evaluateAchievementsForUser` active while suppressing display alone. Correct: return `[]` at the evaluator entry before DB reads/writes, and preserve the original implementation below the release gate.
