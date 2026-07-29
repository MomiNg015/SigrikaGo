# Practice Room Contract

## 1. Scope / Trigger

Use this contract when changing the practice entry, the `practice:start` socket event, practice-room persistence, the Zhunshibao scheduler, or practice result handling. Practice games share the authoritative Spark room pipeline but must remain isolated from matchmaking, public spectating, records, and progression.

## 2. Signatures

```js
socket.emit("practice:start", {
  difficulty: "beginner" | "intermediate" | "advanced",
  playerColor: "black" | "white" | "random"
}, (ack) => {});

// Success
{ ok: true, roomCode: string }

// Failure
{ ok: false, error: string, code: string }
```

```http
GET /api/rooms/watch?mode=spark|standard|gomoku

200 OK
{
  "rooms": [/* selected-mode watch rows */],
  "roomCounts": { "spark": 0, "standard": 0, "gomoku": 0 }
}
```

The created room must expose `mode: "spark"`, `rated: false`, `matchSource: "practice"`, `recordPolicy: "none"`, and a persisted `practice` configuration.

```js
const engine = createPracticeBotEngine({
  enginePath: resolvePracticeEnginePath()
});
const readiness = await engine.ensureAvailable();
const result = await engine.search(gameView, botColor, difficulty);

// Readiness
{ ok: true, name: "GNU Go", version: string | null }
{ ok: false, reason: "unavailable" }

// Success
{ ok: true, action: { type: "move", pointId: string } | { type: "pass" } }

// Engine failure
{ ok: false, reason: "busy" | "timeout" | "unavailable" | "error" | "invalid-response" | "invalid-result" }
```

Production `.env` uses `PRACTICE_ENGINE_PATH="/usr/games/gnugo"`. The update command `sudo ./deploy/update-production.sh` requires that absolute path to be executable and pass `--version` before backup, pull, or service shutdown.

## 3. Contracts

- The server is authoritative: clients request settings and then consume the existing `match:found`, preload, clock, action, scoring, result, and resume flows.
- The Spark practice entry remains a sibling native button beside the formal match button. Its complete visual is the alpha-preserving `1500 x 600` WebP at `/assets/home/home-practice-zhunshibao.webp`; the compact image button is absolutely anchored to the right of the Spark title, with its horizontal centerline aligned to the card's top border. In Bright School, the image reuses the home utility image-entry hard-shadow contract: `drop-shadow(6px 8px 0 rgba(61, 43, 37, 0.42))` at rest/hover/focus and `drop-shadow(4px 5px 0 rgba(61, 43, 37, 0.34))` while active. Keep this filter in the final theme effect owner so the earlier shared soft-shadow fallback cannot win. The button owns CSS variables that compose its centering, lift, and a clearly visible clockwise `7deg` hover/focus rotation in the final Bright School transform winner. Keep that motion on the button rather than its child image, because the theme's generic `button > *` reset intentionally clears child transforms. Anchor the transform origin near the left-side mascot so the signboard visibly swings. Reduced-motion mode removes the transition but keeps the instantaneous hover/focus state. The button owns the accessible name `准时宝陪练` and opens one compact nested `ModalDialog` titled `准时宝陪练`, without an eyebrow. Its two rule lines are `随机猜先。` and `吃掉准时宝22颗子或数子胜即算胜利！`; the three public levels `入门` / `中级` / `高级` use the descriptions `沙包型准时宝` / `一般型准时宝` / `红温型准时宝`. Selecting a level immediately sends `{ difficulty, playerColor: "random" }`; do not add a color selector or a second confirmation step. Escape closes only the nested selector and restores focus to the image entry.
- Keep difficulty-picker CSS in the three focused owners `modals/replay-mode-resume/practice-difficulty.css`, `mobile-adaptive/phone-core/practice-difficulty.css`, and `themes/bright-school/surface-contracts/practice-difficulty.css`. Register their import order and bounded inventory delta instead of expanding match-mode or final-control files past the 6000-byte guard.
- The opening color modal remains shared with ordinary games. In a practice room only, it inserts a red rule line directly below `本局你执黑/白`: `吃掉准时宝{captureResignThreshold}颗棋子就算胜利！`. Every newly created public level persists an explicit `room.practice.captureResignThreshold: 22`, and the safe room projection includes this value. A restored legacy `beginner` room without the explicit field keeps its old threshold `11`; a restored `basic` room without it resolves to `22`. Ordinary rooms must not render this line.
- Zhunshibao has resource id `zhunshibao`, no character or skill, and is auto-ready during preload.
- Zhunshibao's product-facing rank is difficulty-configured as `入门陪练`, `中级陪练`, or `高级陪练`. The legacy `basic` restore alias uses GNU Go level 1 and the beginner rank but remains a distinct persisted id. Keep rank, strategy, engine level, and capture threshold as separate fields.
- Public beginner uses the local `choosePracticeAction()` heuristic with its original `delayMs: [1200, 1800]`, `topChoices: 8`, and `randomMoveChance: 0.25`. Intermediate uses GNU Go level 5 with a 3.5-second timeout, advanced uses level 10 with a 5-second timeout, and restored legacy `basic` uses level 1 with a 2-second timeout. Every GNU Go process uses an 8 MB cache and `--never-resign`. The beginner heuristic is an intentional tier strategy, never a fallback for a failed GNU Go tier.
- Bot decisions receive `gameViewForColor(room.game, bot.color)` rather than the hidden authoritative board. Serialize only visible black and white stones into one SGF root setup position with `SZ[13]`, `KM[2.75]`, `RU[Chinese]`, and the bot color in `PL`. Omit Spark-only neutral stones; concealed opponent hidden hands stay absent and opponent color illusions keep their viewer-visible color.
- Before invoking GNU Go for intermediate, advanced, or restored `basic`, enumerate the current bot-view moves with the real `playMove(..., { colorIllusion: null })`. Convert only successful point ids to GTP vertices and pass that list to GNU Go's `restricted_genmove`. This whitelist is the compatibility boundary for invalid points, protocol bans, liberty-purge bans, ko, suicide, occupied points, and other Spark-only legality. The beginner heuristic also scores only candidates accepted by the same real `playMove` boundary. Revalidate either strategy's response before `handleGameAction`.
- The shared runtime allows one GNU Go child process globally. A concurrent request returns `busy`; the room keeps its turn and retries through the next natural scheduler delay rather than queueing a second process or generating a local move. The process timeout must kill and fully reap the child before releasing the global slot.
- `ensureAvailable()` probes the configured executable with `--version` and caches success; failures are cached briefly to avoid a spawn storm. `practice:start` performs this check after authentication/active-room validation but before leaving matchmaking or creating a room only when `difficulty.strategy === "gnugo"`. Beginner room creation never depends on GNU Go. Unavailable GNU Go tiers return `practice_engine_unavailable`.
- Runtime GNU Go `unavailable`, `timeout`, `error`, `invalid-response`, and `invalid-result` outcomes preserve the current turn and increment an internal consecutive-failure counter. A valid action resets the counter. Three consecutive non-busy GNU Go failures make Zhunshibao resign with an explicit system message so the player is not stranded. Never hide these failures behind the beginner heuristic.
- If Spark has no legal vertex, the adapter returns `pass` without spawning GNU Go. Otherwise `pass` is accepted only when GNU Go returns it from the restricted position.
- Production defaults to `/usr/games/gnugo`. Windows resolves the engine in this order: trimmed `PRACTICE_ENGINE_PATH`, `%LOCALAPPDATA%\SigrikaGo\practice-engine\gnugo-3.8\gnugo.exe`, common `Program Files\GNUGo\bin\gnugo.exe` locations, then `gnugo.exe` on `PATH`. The project must not download or execute a third-party engine from `postinstall`; the developer installs and scans the Windows binary explicitly. `deploy/update-production.sh` must validate an absolute executable path and a successful `--version` probe before any backup, Git update, migration, or service stop.
- `botProfile.portraitUrl` is safe room-view metadata and must be included in battle image preloading; it does not make Zhunshibao a character or grant a skill. When that URL is present, `PlayerInfo` must not apply the tutorial-only `.no-character` portrait layout or any bot-specific image scale. The bot portrait must inherit the ordinary player image geometry (`width: 100%`, `height: var(--side-portrait)` on desktop and the shared `46px` portrait-mobile rule); `.no-character` remains only for a missing-image fallback. Because Zhunshibao intentionally has no rating or skill, `PlayerInfo` must render its existing invisible rating and skill placeholders for the practice bot; this preserves the same desktop and portrait-mobile card tracks/height as an ordinary character player without inventing visible metadata.
- One bot action may be scheduled or in flight per room/turn. The in-flight key remains held across the GNU Go child-process await so broadcasts cannot schedule a duplicate move. A restored active room must re-arm scheduling.
- Practice rooms count toward active-room admission but never enter matchmaking statistics, queues, the public watch list, or the per-mode `roomCounts` returned by `GET /api/rooms/watch`. The route must take one `listWatchRooms()` snapshot, return only the requested normalized mode in `rooms`, and return all three canonical mode counts in `roomCounts`; do not make the client issue one request per tab.
- Closing a practice game sets result state without creating a game record, rewards, rating changes, growth, achievements, or task progress.

## 4. Validation & Error Matrix

| Condition | Ack code | Behavior |
|---|---|---|
| Unknown difficulty or player color | `invalid_practice_options` | Reject before room creation |
| Runtime match admission closed | `capacity_reached` | Reject and increment admission rejection metric |
| User already has an active room | `active_room_exists` | Reject without replacing that room |
| Authentication refresh fails | `auth_expired` | Reject and require login |
| Beginner request while GNU Go is unavailable | success | Skip the probe, leave matchmaking, and create the heuristic room |
| Intermediate/advanced GNU Go probe fails | `practice_engine_unavailable` | Keep matchmaking unchanged and do not create a room |
| Valid GNU Go tier and engine probe succeeds | success | Leave matchmaking, create the room, return `roomCode` |
| GNU Go process slot is occupied | internal `busy` | Keep the turn and retry after the next natural bot delay; do not queue or generate a local move |
| GNU Go reaches the tier timeout | internal `timeout` | Kill/reap the process, keep the turn, and count one non-busy failure |
| GNU Go is missing, throws, exits, or returns malformed output | internal failure reason | Keep the turn; after three consecutive non-busy failures, make the bot resign with an explicit message |
| GNU Go returns a point outside the Spark whitelist or stale action | internal `invalid-result` | Reject and revalidate through the same failure policy; never submit it directly |
| Watch mode is missing or unknown | HTTP 200 | Normalize to Spark for `rooms`; still return all canonical `roomCounts` |
| Only practice rooms are active | HTTP 200 | Return zero public room counts because the read model excludes practice rooms |

## 5. Good / Base / Bad Cases

- Good: the compact image-backed sibling entry sits immediately to the title's upper-right without covering it, opens a focus-trapped three-level selector titled `准时宝陪练`, and starts the selected level with random color in one click. All new levels show the two-line random-color/22-capture-or-counting rule; the bot portrait and frame use ordinary player geometry, and the card reserves missing rating/skill tracks.
- Good: beginner uses the bounded local heuristic from its bot-visible view even when GNU Go is absent; intermediate and advanced use GNU Go levels 5 and 10. A bot-visible SGF plus the Spark-legal `restricted_genmove` whitelist produces one revalidated GNU Go action; a busy slot waits, and an unavailable executable rejects only a GNU Go tier without removing the player from matchmaking.
- Good: one watch-list response returns the selected rows plus `{ spark, standard, gomoku }` counts from the same public-room snapshot, and a new advanced room displays `高级陪练` while persisting difficulty `advanced` and threshold `22`.
- Base: refresh or process restore rebuilds the practice metadata and resumes only the currently valid bot turn.
- Bad: adding a color selector or confirmation step, restoring the removed difficulty eyebrow, showing the capture-rule line in ordinary games, hardcoding 22 for a restored legacy beginner room, deriving rank outside the difficulty config, using the hidden authoritative board, exposing raw GTP to clients, omitting the Spark legal whitelist, running multiple GNU Go processes, releasing the global slot before a killed child exits, accepting a stale/illegal engine move, falling back to the beginner heuristic after a GNU Go failure, losing the per-room in-flight key during the engine await, centering the practice entry over the card watermark, covering the Spark title, putting its rotation on the child image where the generic `button > *` reset cancels it, nesting it inside the formal match button, collapsing the no-rating/no-skill bot card shorter than the human card, applying bot-only portrait geometry, creating replay/progression rows, or counting practice rooms as public violates this contract.

## 6. Tests Required

- Socket tests assert all request validation codes, active-room rejection, beginner success without probing GNU Go, GNU Go-tier unavailability without matchmaking exit, successful matchmaking exit, and room metadata.
- Home tests assert sibling-button markup, accessible naming, the eyebrow-free `准时宝陪练` dialog, exact two-line rule copy and three descriptions, Escape/focus restoration, selected `{ difficulty, playerColor: "random" }` dispatch, absence of a color selector, exact WebP metadata/position/motion, compact Bright School width, and desktop/mobile owner rules.
- Opening-modal tests assert the practice-only red rule copy, explicit new-room threshold 22, restored legacy beginner threshold 11, and absence from ordinary games.
- PlayerInfo tests assert that the practice bot retains invisible rating and skill placeholders, omits `.no-character` when its portrait URL exists, and inherits the ordinary desktop/mobile image dimensions.
- Beginner-decision tests assert bounded candidate count, deterministic seeded behavior, legal moves, hidden-information isolation, and endgame-only low-value passing. Engine adapter tests assert Windows path precedence, the unchanged Linux default, SGF size/komi/player/setup fields, hidden-hand omission, neutral-stone omission, GTP I-column conversion, Spark legal-point restriction, levels 1/5/10 for GNU Go-backed ids, executable probe caching, global busy rejection, and timeout/unavailable mapping.
- Automation tests assert beginner calls the heuristic without GNU Go, intermediate/advanced/basic call GNU Go, one in-flight action per room/turn, busy retry without a move, explicit resignation after three non-busy GNU Go failures, all public 22-capture thresholds, legacy 11-capture restore behavior, and ordinary-capture-only semantics.
- Deployment tests assert the `.env` engine path is loaded before the executable/version preflight, the preflight precedes backup and downtime, and the shell remains syntactically valid.
- Persistence/view/result tests assert the explicit threshold survives snapshots and safe projection, legacy metadata restores, watch-list exclusion, and no record or rewards.
- `server/publicRoutes.test.js` asserts the selected-mode room filter and complete canonical `roomCounts`; `src/modals/WatchModal.dom.test.jsx` asserts one response populates all visible tab counts.
- Scoring tests assert one conservative bot dead-stone analysis per request and acceptance after human corrections.

## 7. Wrong vs Correct

### Wrong

```js
const move = choosePracticeAction(room.game); // hidden state + homemade engine
const fallback = chooseIntermediatePracticeAction(room.game, bot.color);
const action = engineResult.ok ? engineResult.action : fallback;
```

### Correct

```js
const visibleGame = gameViewForColor(room.game, bot.color);
const decision = difficulty.strategy === "heuristic"
  ? { ok: true, action: choosePracticeAction(visibleGame, bot.color, difficulty) }
  : await practiceBotEngine.search(visibleGame, bot.color, difficulty);
if (!decision.ok) return retryOrEndExplicitly(decision.reason);
if (!isLegalPracticeAction(visibleGame, bot.color, decision.action)) {
  return retryOrEndExplicitly("invalid-result");
}
const action = decision.action;

// Frontend level selection
onPracticeStart({ difficulty: selectedDifficulty, playerColor: "random" });

// Public watch response: one filtered list plus all counts from one snapshot
const watchableRooms = listWatchRooms();
return { rooms: filterByMode(watchableRooms, mode), roomCounts: countByMode(watchableRooms) };
```

```bash
# Wrong: deploy Node successfully while practice silently lacks its engine.
npm ci
systemctl restart sigrikago

# Correct: install once; maintained updates verify it before downtime.
sudo apt install -y gnugo
sudo ./deploy/update-production.sh
```

```css
/* Wrong: Bright School's generic button-child reset wins over this transform. */
.practice-entry-button:hover img { transform: rotate(7deg); }

/* Correct: the final button transform composes positioning and interaction state. */
.practice-entry-button:hover { --practice-entry-rotation: 7deg; }
.theme-bright-school button.practice-entry-button {
  transform: translateX(-50%) rotate(var(--practice-entry-rotation, 0deg)) !important;
}

/* Correct: the final theme effect owner matches the home utility hard shadow. */
.theme-bright-school button.practice-entry-button img {
  filter: drop-shadow(6px 8px 0 rgba(61, 43, 37, 0.42)) !important;
}
```
