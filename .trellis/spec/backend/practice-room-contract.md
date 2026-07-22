# Practice Room Contract

## 1. Scope / Trigger

Use this contract when changing the practice entry, the `practice:start` socket event, practice-room persistence, the Zhunshibao scheduler, or practice result handling. Practice games share the authoritative Spark room pipeline but must remain isolated from matchmaking, public spectating, records, and progression.

## 2. Signatures

```js
socket.emit("practice:start", {
  difficulty: "beginner" | "basic",
  playerColor: "black" | "white" | "random"
}, (ack) => {});

// Success
{ ok: true, roomCode: string }

// Failure
{ ok: false, error: string, code: string }
```

The created room must expose `mode: "spark"`, `rated: false`, `matchSource: "practice"`, `recordPolicy: "none"`, and a persisted `practice` configuration.

## 3. Contracts

- The server is authoritative: clients request settings and then consume the existing `match:found`, preload, clock, action, scoring, result, and resume flows.
- The Spark practice entry remains a sibling native button beside the formal match button. Its complete visual is the alpha-preserving `1500 x 600` WebP at `/assets/home/home-practice-zhunshibao.webp`; the compact image button is absolutely anchored to the right of the Spark title, with its horizontal centerline aligned to the card's top border. The image uses an alpha-following drop shadow for depth and rotates clockwise by `3deg` on hover; reduced-motion mode removes the transform. The button owns the accessible name `准时宝陪练` and immediately submits the shared `PRACTICE_QUICK_START_OPTIONS` value `{ difficulty: "basic", playerColor: "random" }`; do not insert a second setup surface between this click and `practice:start`.
- The opening color modal remains shared with ordinary games. In a practice room only, it inserts a red rule line directly below `本局你执黑/白`: `吃掉准时宝{captureResignThreshold}颗棋子就算胜利！`. Resolve the value from the persisted `room.practice.difficulty`; the current basic quick start displays `22`, while restored beginner rooms display `11`. Ordinary rooms must not render this line.
- Zhunshibao has resource id `zhunshibao`, no character or skill, and is auto-ready during preload.
- Bot decisions receive `gameViewForColor(room.game, bot.color)` rather than the hidden authoritative board.
- Candidate generation reserves the 48-point budget in reason order: urgent liberties, recent local replies, opening/star points, ordinary neighbors, then random fill. Beginner randomness remains inside the best priority and a bounded score window.
- During its first two ordinary moves, Zhunshibao treats unoccupied corner star points as opening-priority candidates, so an ordinary local reply cannot crowd out the expected two-corner opening. Immediate capture and escape priorities still outrank this rule.
- Candidate valuation must simulate through `playMove`, verify immediate opponent captures only for resulting one-liberty bot groups, and penalize self-atari, own-eye fill, empty triangles, and non-tactical early straight-line extension. Do not add full-board or unbounded search to the shared server event loop.
- A low-value candidate set may produce `pass` only in the real endgame, when empty valid intersections are at most `max(8, floor(validPoints * 0.12))`; move number alone must never trigger a pass. An empty legal candidate set may still pass.
- `botProfile.portraitUrl` is safe room-view metadata and must be included in battle image preloading; it does not make Zhunshibao a character or grant a skill. When that URL is present, `PlayerInfo` must not apply the tutorial-only `.no-character` portrait layout or any bot-specific image scale. The bot portrait must inherit the ordinary player image geometry (`width: 100%`, `height: var(--side-portrait)` on desktop and the shared `46px` portrait-mobile rule); `.no-character` remains only for a missing-image fallback. Because Zhunshibao intentionally has no rating or skill, `PlayerInfo` must render its existing invisible rating and skill placeholders for the practice bot; this preserves the same desktop and portrait-mobile card tracks/height as an ordinary character player without inventing visible metadata.
- One bot action may be scheduled per room/turn. A restored active room must re-arm scheduling.
- Practice rooms count toward active-room admission but never enter matchmaking statistics, queues, or the public watch list.
- Closing a practice game sets result state without creating a game record, rewards, rating changes, growth, achievements, or task progress.

## 4. Validation & Error Matrix

| Condition | Ack code | Behavior |
|---|---|---|
| Unknown difficulty or player color | `invalid_practice_options` | Reject before room creation |
| Runtime match admission closed | `capacity_reached` | Reject and increment admission rejection metric |
| User already has an active room | `active_room_exists` | Reject without replacing that room |
| Authentication refresh fails | `auth_expired` | Reject and require login |
| Valid request | success | Leave matchmaking, create the room, return `roomCode` |

## 5. Good / Base / Bad Cases

- Good: the compact image-owned sibling entry sits immediately to the title's upper-right without covering it, straddles the card's top border, retains a restrained shadow/hover tilt, remains keyboard accessible, and starts a basic/random non-rated Spark room directly. The opening modal shows the red 22-capture victory rule, the practice bot portrait and frame use ordinary player geometry, the card reserves the missing rating and skill tracks, and the bot opens on corner star points through the normal action lifecycle.
- Base: refresh or process restore rebuilds the practice metadata and resumes only the currently valid bot turn.
- Bad: opening an extra practice-options window, showing the capture-rule line in ordinary games, hardcoding 22 for a restored beginner room, centering the practice entry over the card watermark, covering the Spark title, rotating it under reduced-motion preference, nesting it inside the formal match button, collapsing the no-rating/no-skill bot card shorter than the human card, applying `.no-character`, `82%`, or `40px` bot-only portrait geometry when the portrait URL exists, passing because `moveNumber` crossed an arbitrary threshold, dropping the WebP alpha channel, deriving moves from the authoritative hidden board, creating replay/progression rows, or advertising the room as watchable violates this contract.

## 6. Tests Required

- Socket tests assert all request validation codes, active-room rejection, matchmaking exit, and room metadata.
- Home tests assert sibling-button markup, accessible naming, direct `{ difficulty: "basic", playerColor: "random" }` dispatch with no setup surface, exact WebP path, `1500 x 600` dimensions, alpha metadata, the desktop/mobile title-right anchor, alpha-following shadow, `3deg` clockwise hover rotation, reduced-motion fallback, and the Bright School generic-button reset.
- Opening-modal tests assert the practice-only red rule copy, basic threshold 22, resolved difficulty behavior, and absence from ordinary games.
- PlayerInfo tests assert that the practice bot retains invisible rating and skill placeholders, omits `.no-character` when its portrait URL exists, and inherits the ordinary desktop/mobile image dimensions.
- Decision tests inject a seeded random source, cap candidates at 48, assert legal moves, prove hidden information is not consumed, assert two distinct corner-star opening moves, prioritize immediate capture/defense, reject early straight-line shape, bound beginner score variance, and prove low-value passing stays disabled until the empty-point endgame threshold.
- Automation tests assert delay bands, duplicate-schedule suppression, capture resign thresholds, and ordinary-capture-only semantics.
- Persistence/view/result tests assert restore metadata, safe bot projection, watch-list exclusion, and no record or rewards.
- Scoring tests assert one conservative bot dead-stone analysis per request and acceptance after human corrections.

## 7. Wrong vs Correct

### Wrong

```js
const move = chooseMove(room.game); // leaks hidden authoritative state
await saveGameRecord(room);         // practice must not persist progression
```

### Correct

```js
const visibleGame = gameViewForColor(room.game, bot.color);
const move = choosePracticeMove(visibleGame, options);
if (room.recordPolicy !== "none") await saveGameRecord(room);

// Frontend quick start
onPracticeStart(PRACTICE_QUICK_START_OPTIONS);
```
