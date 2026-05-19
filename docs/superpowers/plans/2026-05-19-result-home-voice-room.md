# Result Rewards, Home Layout, Voice Events, And Room UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add result reward display/persistence, revise the home hierarchy, formalize character voice events, restyle room timers, replace phase-specific room controls, and add win/loss portrait badges.

**Architecture:** Start with shared deterministic helpers, then wire backend persistence and frontend display to those helpers. UI changes stay in the existing `src/main.jsx` component structure for this iteration, with CSS changes isolated to existing style files.

**Tech Stack:** React, Vite, Socket.IO room state, Prisma, Vitest, CSS modules by file convention, Web Audio helpers in `src/audio/playback.jsx`.

---

## File Structure

- Create `src/shared/resultRewards.js`: shared rating/coin reward rules and player-perspective helper.
- Create `src/shared/resultRewards.test.js`: win/loss/draw reward coverage.
- Modify `server/rooms.js`: increment coins alongside existing win/loss/rating persistence.
- Modify `server/rooms.test.js`: verify result persistence awards coins.
- Modify `src/shared/systemVoices.js`: rename/extend event map into explicit character voice events while preserving existing imports.
- Modify `src/shared/systemVoices.test.js`: cover new voice events, countdown resolution, and fallback behavior.
- Modify `src/shared/timeAnnouncements.js`: emit period-specific and countdown voice events.
- Modify `src/shared/timeAnnouncements.test.js`: cover period 2, period 1, timeout, and countdown event mapping.
- Modify `src/audio/playback.jsx`: add decoded voice buffer cache/preload helpers for short character voice files.
- Modify `src/main.jsx`: update `HomeScreen`, `RoomScreen`, `PlayerInfo`, `TimeBar`, `ActionBar`, `StatusPanel`, `ResultModal`, and voice playback wiring.
- Modify `src/styles/base.css`: home layout hierarchy.
- Modify `src/styles/room.css`: digital timer, action decision area, result portrait badges.
- Modify `src/styles/responsive.css`: preserve desktop/tablet layout structure.
- Modify `src/styles/modals.css`: result reward display.
- Modify `docs/system-design.md`: record completed implementation details after code changes.

## Task 1: Shared Result Rewards

**Files:**
- Create: `src/shared/resultRewards.js`
- Create: `src/shared/resultRewards.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// src/shared/resultRewards.test.js
import { COLORS } from "./game.js";
import {
  COIN_DRAW_DELTA,
  COIN_LOSS_DELTA,
  COIN_WIN_DELTA,
  resultRewardDelta
} from "./resultRewards.js";

describe("result rewards", () => {
  it("awards win, loss, and draw rating and coin deltas", () => {
    expect(resultRewardDelta(COLORS.black, COLORS.black)).toEqual({
      outcome: "win",
      rating: 20,
      coins: COIN_WIN_DELTA
    });
    expect(resultRewardDelta(COLORS.white, COLORS.black)).toEqual({
      outcome: "loss",
      rating: -20,
      coins: COIN_LOSS_DELTA
    });
    expect(resultRewardDelta(COLORS.black, null)).toEqual({
      outcome: "draw",
      rating: 0,
      coins: COIN_DRAW_DELTA
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/shared/resultRewards.test.js`

Expected: FAIL because `src/shared/resultRewards.js` does not exist.

- [ ] **Step 3: Add the shared helper**

```js
// src/shared/resultRewards.js
import { COLORS } from "./game.js";
import { ratingDeltaForResult } from "./gameRecords.js";

export const COIN_WIN_DELTA = 50;
export const COIN_LOSS_DELTA = 20;
export const COIN_DRAW_DELTA = 0;

export function resultRewardDelta(playerColor, winnerColor) {
  const normalizedWinner = winnerColor === COLORS.black || winnerColor === COLORS.white ? winnerColor : null;
  const normalizedPlayer = playerColor === COLORS.black || playerColor === COLORS.white ? playerColor : null;
  if (!normalizedPlayer || !normalizedWinner) {
    return {
      outcome: "draw",
      rating: ratingDeltaForResult(normalizedPlayer, normalizedWinner),
      coins: COIN_DRAW_DELTA
    };
  }
  const won = normalizedPlayer === normalizedWinner;
  return {
    outcome: won ? "win" : "loss",
    rating: ratingDeltaForResult(normalizedPlayer, normalizedWinner),
    coins: won ? COIN_WIN_DELTA : COIN_LOSS_DELTA
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/shared/resultRewards.test.js`

Expected: PASS.

## Task 2: Persist Result Coin Rewards

**Files:**
- Modify: `server/rooms.js`
- Modify: `server/rooms.test.js`

- [ ] **Step 1: Write the failing backend test**

Add a test near the existing `saveGameRecord`/finished-room coverage in `server/rooms.test.js`:

```js
it("awards result coins when saving a decisive game", async () => {
  const io = fakeIo();
  const blackUser = makeUser({ id: "black-user", username: "black", coins: 300, rating: 1000 });
  const whiteUser = makeUser({ id: "white-user", username: "white", coins: 300, rating: 1000 });
  const room = createRoomForTest({ blackUser, whiteUser, io });
  room.game.phase = GAME_PHASES.finished;
  room.game.winner = { winnerColor: COLORS.black, reason: "resign", text: "黑中盘胜" };

  await saveGameRecordForTest(room);

  expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: "black-user" },
    data: expect.objectContaining({ coins: { increment: 50 } })
  }));
  expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: "white-user" },
    data: expect.objectContaining({ coins: { increment: 20 } })
  }));
});
```

If helper names differ in the file, adapt only the test setup names to the local test helpers; keep the assertions exactly about `coins.increment`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- server/rooms.test.js`

Expected: FAIL because coin increments are not included in `prisma.user.update`.

- [ ] **Step 3: Update persistence**

In `server/rooms.js`, import the helper:

```js
import { resultRewardDelta } from "../src/shared/resultRewards.js";
```

Inside `saveGameRecord`, before the transaction:

```js
const winnerRewards = resultRewardDelta(winner.color, room.game.winner.winnerColor);
const loserRewards = resultRewardDelta(loser.color, room.game.winner.winnerColor);
```

Update the transaction user updates:

```js
data: {
  wins: { increment: 1 },
  rating: { increment: winnerRewards.rating },
  coins: { increment: winnerRewards.coins }
}
```

```js
data: {
  losses: { increment: 1 },
  rating: { increment: loserRewards.rating },
  coins: { increment: loserRewards.coins }
}
```

Do not change draw persistence in this task. Existing draw behavior should still only save the record.

- [ ] **Step 4: Run backend tests**

Run: `npm test -- server/rooms.test.js src/shared/resultRewards.test.js`

Expected: PASS.

## Task 3: Show Result Rewards In The Modal

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/styles/modals.css`

- [ ] **Step 1: Add modal display logic**

In `src/main.jsx`, import:

```js
import { resultRewardDelta } from "./shared/resultRewards.js";
```

Inside `ResultModal`, derive the current player's reward:

```jsx
const currentPlayer = room.players.find((player) => player.user.id === user?.id);
const reward = currentPlayer ? resultRewardDelta(currentPlayer.color, winnerColor) : null;
const signed = (value) => value > 0 ? `+${value}` : String(value);
```

Render below `room.game.winner?.text`:

```jsx
{reward && (
  <div className="result-rewards" aria-label="本局收益">
    <span><strong>积分</strong>{signed(reward.rating)}</span>
    <span><strong>金币</strong>{signed(reward.coins)}</span>
  </div>
)}
```

- [ ] **Step 2: Add modal reward styles**

In `src/styles/modals.css`:

```css
.result-rewards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0;
}

.result-rewards span {
  border: 1px solid rgba(126, 102, 144, 0.18);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  padding: 10px 12px;
  display: grid;
  gap: 4px;
  font-weight: 900;
  color: #2d2430;
}

.result-rewards strong {
  color: #7b6a7f;
  font-size: 12px;
}
```

- [ ] **Step 3: Run frontend build**

Run: `npm run build`

Expected: PASS.

## Task 4: Character Voice Event Map

**Files:**
- Modify: `src/shared/systemVoices.js`
- Modify: `src/shared/systemVoices.test.js`
- Modify: `src/shared/musicLibrary.js`
- Modify: `src/shared/musicLibrary.test.js`

- [ ] **Step 1: Write voice event tests**

Extend `src/shared/systemVoices.test.js`:

```js
it("exposes explicit character voice events", () => {
  expect(SYSTEM_VOICE_EVENTS.skillCast).toBe("skill-cast");
  expect(SYSTEM_VOICE_EVENTS.byoYomiPeriod2).toBe("byo-yomi-period-2");
  expect(SYSTEM_VOICE_EVENTS.byoYomiPeriod1).toBe("byo-yomi-period-1");
  expect(SYSTEM_VOICE_EVENTS.houseDetail).toBe("house-detail");
  expect(SYSTEM_VOICE_EVENTS.countdown(10)).toBe("countdown-10");
  expect(SYSTEM_VOICE_EVENTS.countdown(1)).toBe("countdown-1");
});

it("resolves countdown voice events with TTS fallback text", () => {
  expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.countdown(7))).toEqual({
    type: "tts",
    text: "7"
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/shared/systemVoices.test.js`

Expected: FAIL because the new events are missing.

- [ ] **Step 3: Extend event definitions**

Replace the event object in `src/shared/systemVoices.js` with:

```js
export const SYSTEM_VOICE_EVENTS = {
  gameStart: "game-start",
  skillCast: "skill-cast",
  byoYomiStart: "byo-yomi-start",
  byoYomiPeriods: "byo-yomi-periods",
  byoYomiPeriod2: "byo-yomi-period-2",
  byoYomiPeriod1: "byo-yomi-period-1",
  byoYomiCountdown: "byo-yomi-countdown",
  timeout: "timeout",
  resultVictory: "result-victory",
  resultDefeat: "result-defeat",
  resultDraw: "result-draw",
  houseDetail: "house-detail",
  countdown: (seconds) => `countdown-${seconds}`
};
```

Update default text:

```js
const DEFAULT_SYSTEM_VOICE_TEXT = {
  [SYSTEM_VOICE_EVENTS.gameStart]: "对局开始",
  [SYSTEM_VOICE_EVENTS.skillCast]: "",
  [SYSTEM_VOICE_EVENTS.byoYomiStart]: "开始读秒",
  [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: "还剩2次读秒",
  [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: "还剩1次读秒",
  [SYSTEM_VOICE_EVENTS.timeout]: "超时",
  [SYSTEM_VOICE_EVENTS.resultVictory]: "对局胜利",
  [SYSTEM_VOICE_EVENTS.resultDefeat]: "对局失败",
  [SYSTEM_VOICE_EVENTS.resultDraw]: "和棋",
  [SYSTEM_VOICE_EVENTS.houseDetail]: ""
};
```

Keep backward compatibility in `resolveSystemVoice`:

```js
if (event === SYSTEM_VOICE_EVENTS.byoYomiPeriods) {
  if (params.periods === 2) return resolveSystemVoice(SYSTEM_VOICE_EVENTS.byoYomiPeriod2, { character, params });
  if (params.periods === 1) return resolveSystemVoice(SYSTEM_VOICE_EVENTS.byoYomiPeriod1, { character, params });
  return { type: "tts", text: `还剩${params.periods}次读秒` };
}
if (event === SYSTEM_VOICE_EVENTS.byoYomiCountdown || /^countdown-\d+$/.test(event)) {
  const seconds = params.seconds ?? Number(String(event).replace("countdown-", ""));
  return { type: "tts", text: String(seconds) };
}
```

- [ ] **Step 4: Move skill voice resolution onto the event map**

In `src/shared/musicLibrary.js`, keep existing `CHARACTER_SKILL_VOICES`, but add:

```js
import { SYSTEM_VOICE_EVENTS } from "./systemVoices.js";

export function characterVoiceMapForSkill(voices = CHARACTER_SKILL_VOICES) {
  return Object.fromEntries(
    Object.entries(voices).map(([characterId, src]) => [
      characterId,
      { [SYSTEM_VOICE_EVENTS.skillCast]: src }
    ])
  );
}
```

Update `resolveSkillVoice` to use `SYSTEM_VOICE_EVENTS.skillCast` internally where practical while preserving its exported signature.

- [ ] **Step 5: Run tests**

Run: `npm test -- src/shared/systemVoices.test.js src/shared/musicLibrary.test.js`

Expected: PASS.

## Task 5: Time Announcements And Countdown Events

**Files:**
- Modify: `src/shared/timeAnnouncements.js`
- Modify: `src/shared/timeAnnouncements.test.js`
- Modify: `src/main.jsx`

- [ ] **Step 1: Write announcement tests**

Extend `src/shared/timeAnnouncements.test.js`:

```js
it("uses period-specific voice events for remaining two and one periods", () => {
  expect(nextTimeAnnouncement({
    previous: { main: 0, periods: 3 },
    current: { main: 0, periods: 2 }
  })).toMatchObject({ event: SYSTEM_VOICE_EVENTS.byoYomiPeriod2, text: "还剩2次读秒" });

  expect(nextTimeAnnouncement({
    previous: { main: 0, periods: 2 },
    current: { main: 0, periods: 1 }
  })).toMatchObject({ event: SYSTEM_VOICE_EVENTS.byoYomiPeriod1, text: "还剩1次读秒" });
});

it("announces countdown seconds as per-second events", () => {
  expect(nextCountdownAnnouncement({ seconds: 10 })).toEqual({
    type: "voice",
    event: "countdown-10",
    params: { seconds: 10 },
    text: "10"
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/shared/timeAnnouncements.test.js`

Expected: FAIL because `nextCountdownAnnouncement` and period-specific events do not exist.

- [ ] **Step 3: Update helper**

In `src/shared/timeAnnouncements.js`, update period event mapping:

```js
if (typeof previous.periods === "number" && current.periods < previous.periods) {
  if (current.periods <= 0) return { type: "voice", event: SYSTEM_VOICE_EVENTS.timeout, text: "超时" };
  const event = current.periods === 2
    ? SYSTEM_VOICE_EVENTS.byoYomiPeriod2
    : current.periods === 1
      ? SYSTEM_VOICE_EVENTS.byoYomiPeriod1
      : SYSTEM_VOICE_EVENTS.byoYomiPeriods;
  return {
    type: "voice",
    event,
    params: { periods: current.periods },
    text: `还剩${current.periods}次读秒`
  };
}
```

Add:

```js
export function nextCountdownAnnouncement({ seconds } = {}) {
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 10) return null;
  return {
    type: "voice",
    event: SYSTEM_VOICE_EVENTS.countdown(seconds),
    params: { seconds },
    text: String(seconds)
  };
}
```

- [ ] **Step 4: Wire countdown voice in `RoomScreen`**

In `src/main.jsx`, import `nextCountdownAnnouncement`.

Replace the countdown beep-only block with:

```js
if (timer.main <= 0 && timer.periodRemaining <= 10 && timer.periodRemaining > 0) {
  const countdownKey = `${activePlayer.color}-${timer.periods}-${timer.periodRemaining}`;
  if (!voiceRef.current[countdownKey]) {
    voiceRef.current[countdownKey] = true;
    const countdown = nextCountdownAnnouncement({ seconds: timer.periodRemaining });
    if (countdown) {
      playSystemVoice(countdown.event, {
        character: activePlayer.character,
        params: countdown.params,
        fallbackText: countdown.text,
        audioSettings
      });
    } else {
      playCountdownBeep(timer.periodRemaining, audioSettings);
    }
  }
}
```

If both voice and beep should coexist, call `playCountdownBeep` after `playSystemVoice`. If voice should replace beep, remove the beep in this block.

- [ ] **Step 5: Run tests**

Run: `npm test -- src/shared/timeAnnouncements.test.js src/shared/systemVoices.test.js`

Expected: PASS.

## Task 6: Voice Preload Cache

**Files:**
- Modify: `src/audio/playback.jsx`
- Modify: `src/main.jsx`

- [ ] **Step 1: Add decoded voice helpers**

In `src/audio/playback.jsx`, add module-level caches:

```jsx
const voiceBufferCache = new Map();
const voiceBufferPromises = new Map();
let sharedVoiceContext = null;
```

Add:

```jsx
function voiceContext() {
  if (!sharedVoiceContext || sharedVoiceContext.state === "closed") {
    sharedVoiceContext = new AudioContext();
  }
  return sharedVoiceContext;
}

export async function preloadVoiceSound(src) {
  if (!src || voiceBufferCache.has(src)) return voiceBufferCache.get(src) ?? null;
  if (voiceBufferPromises.has(src)) return voiceBufferPromises.get(src);
  const promise = fetch(src)
    .then((response) => response.ok ? response.arrayBuffer() : Promise.reject(new Error(`Voice load failed: ${src}`)))
    .then((arrayBuffer) => voiceContext().decodeAudioData(arrayBuffer.slice(0)))
    .then((buffer) => {
      voiceBufferCache.set(src, buffer);
      voiceBufferPromises.delete(src);
      return buffer;
    })
    .catch(() => {
      voiceBufferPromises.delete(src);
      return null;
    });
  voiceBufferPromises.set(src, promise);
  return promise;
}
```

Add:

```jsx
export function playPreloadedVoiceSound(src, audioSettings) {
  const buffer = voiceBufferCache.get(src);
  if (!buffer) return playVoiceSound(src, audioSettings);
  const context = voiceContext();
  const source = context.createBufferSource();
  source.buffer = buffer;
  return connectVoiceSource(context, source, audioSettings);
}
```

If `playVoiceSound` currently contains inline graph setup, extract that graph setup into `connectVoiceSource(context, source, audioSettings)` in the same file.

- [ ] **Step 2: Preload countdown voices from active player character**

In `src/main.jsx`, import `preloadVoiceSound` and use `resolveSystemVoice` for countdown events:

```js
useEffect(() => {
  if (isReplay || !activePlayer?.character) return;
  if (activePlayer.time?.main > 0) return;
  for (let seconds = 1; seconds <= 10; seconds += 1) {
    const voice = resolveSystemVoice(SYSTEM_VOICE_EVENTS.countdown(seconds), {
      character: activePlayer.character,
      params: { seconds }
    });
    if (voice.type === "audio" && voice.src) preloadVoiceSound(voice.src);
  }
}, [activePlayer?.character, activePlayer?.time?.main, isReplay]);
```

Update `playSystemVoice` to call `playPreloadedVoiceSound` for audio assets.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

## Task 7: Home Screen Layout A

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/styles/base.css`
- Modify: `src/styles/responsive.css`

- [ ] **Step 1: Update `HomeScreen` markup**

In `src/main.jsx`, restructure `HomeScreen` section:

```jsx
<section className="home-grid home-grid-featured">
  <Panel title="空想对局" icon={<Swords />}>
    <div className="home-match-feature">
      <button className="match-button match-button-large" onClick={onStartMatch}>
        <Sparkles size={22} />
        开始匹配
      </button>
      <p className="quiet-text">13路，中国数子规则，黑贴 2又3/4 子。</p>
    </div>
  </Panel>
  <button className="home-entry house-entry house-entry-secondary" onClick={onOpenHouse}>
    <div className="entry-copy">
      <UserRound size={30} />
      <strong>棋舍</strong>
      <span>{user.username} · {user.rank} · {user.rating}分</span>
    </div>
    <img className="entry-portrait" src={findCharacter(characters, user.selectedCharacter).portrait} alt="出战角色" />
  </button>
  <div className="home-utility-grid">
    <button className="home-entry utility-entry watch-entry" onClick={onOpenWatch}>...</button>
    <button className="home-entry utility-entry leaderboard-entry" onClick={onOpenLeaderboard}>...</button>
    <button className="home-entry utility-entry shop-entry" onClick={onOpenShop}>...</button>
    {user.role === "admin" && <button className="home-entry utility-entry admin-entry" onClick={onOpenAdmin}>...</button>}
  </div>
</section>
```

Keep current icon/text content inside the utility buttons.

- [ ] **Step 2: Add CSS hierarchy**

In `src/styles/base.css`:

```css
.home-grid-featured {
  grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.8fr);
  grid-template-areas:
    "match house"
    "utilities utilities";
}

.home-grid-featured > .panel {
  grid-area: match;
  min-height: clamp(230px, 26vw, 340px);
}

.house-entry-secondary {
  grid-area: house;
  min-height: clamp(230px, 26vw, 340px);
}

.home-utility-grid {
  grid-area: utilities;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--fluid-gap);
}

.utility-entry {
  min-height: clamp(104px, 11vw, 138px);
}

.match-button-large {
  min-height: 72px;
  font-size: clamp(20px, 2vw, 26px);
}
```

- [ ] **Step 3: Preserve tablet structure**

In `src/styles/responsive.css`, remove `.home-grid` from the `max-width: 900px` one-column override and add:

```css
@media (max-width: 900px) {
  .home-grid-featured {
    min-width: 760px;
  }

  .home-screen {
    overflow-x: auto;
  }
}
```

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS.

## Task 8: Digital Timer And Result Badges

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/styles/room.css`

- [ ] **Step 1: Update `TimeBar` markup**

Replace `TimeBar` return markup:

```jsx
const displayValue = inMain ? formatClock(time.main) : String(time.periodRemaining ?? time.byoYomi).padStart(2, "0");
const periodValue = String(Math.max(0, time.periods ?? 0)).padStart(2, "0");
return (
  <div className={`timer digital-timer ${inMain ? "main-time" : isFinalByoYomi ? "final-byo-yomi" : "byo-yomi"}`}>
    <div className="timer-label">{inMain ? "主时间" : "读秒"}</div>
    <div className="timer-digits">
      <span className="timer-primary">{displayValue}</span>
      {!inMain && (
        <span className="timer-periods" title={`还剩${time.periods}次读秒`}>
          {periodValue}
        </span>
      )}
    </div>
    <div className="timer-track"><span style={{ width: `${progress}%` }} /></div>
  </div>
);
```

- [ ] **Step 2: Add result badge props**

In `PlayerInfo`, derive result badge:

```jsx
const resultBadge = isDrawResult ? null : isWinner ? "胜" : game.phase === "finished" ? "负" : null;
```

Render inside `.portrait-wrap` after the image:

```jsx
{resultBadge && (
  <span className={`result-badge ${resultBadge === "胜" ? "win" : "loss"}`}>
    {resultBadge}
  </span>
)}
```

- [ ] **Step 3: Add CSS**

In `src/styles/room.css`:

```css
.digital-timer {
  background: linear-gradient(180deg, #161923, #10131a);
  color: #f8efe0;
  border: 1px solid rgba(255, 186, 92, 0.28);
  box-shadow: inset 0 0 16px rgba(255, 132, 62, 0.16), 0 10px 22px rgba(20, 16, 24, 0.12);
}

.timer-label {
  color: rgba(255, 239, 208, 0.72);
  font-size: 11px;
  font-weight: 800;
}

.timer-digits {
  min-height: 34px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
  font-family: "Consolas", "Courier New", monospace;
  letter-spacing: 0;
}

.timer-primary {
  min-width: 74px;
  font-size: clamp(24px, 2.4vw, 34px);
  line-height: 1;
  color: #ffcf78;
  text-shadow: 0 0 12px rgba(255, 151, 62, 0.58);
}

.timer-periods {
  min-width: 34px;
  font-size: clamp(15px, 1.35vw, 19px);
  color: #9af0ff;
  text-shadow: 0 0 10px rgba(95, 211, 255, 0.48);
}

.result-badge {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: clamp(42px, 4.4vw, 54px);
  aspect-ratio: 1;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.94);
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 900;
  font-size: clamp(18px, 1.8vw, 24px);
  box-shadow: 0 10px 22px rgba(35, 24, 40, 0.22);
}

.result-badge.win { background: #e13939; }
.result-badge.loss { background: #17171d; }
```

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS.

## Task 9: Phase-Aware Room Action Area

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/styles/room.css`

- [ ] **Step 1: Replace side status with text hint**

In `RoomScreen`, remove the opponent-side `StatusPanel` control block and add a text-only hint slot where the empty center status slot currently exists:

```jsx
<OperationHint room={displayRoom} user={user} scoring={scoring} drawRequest={drawRequest} />
```

Add:

```jsx
function OperationHint({ room, user, scoring, drawRequest }) {
  if (room.game.phase === "draw-requested" && drawRequest) {
    return <p className="operation-hint">{drawRequest.requestedBy === user.id ? "等待对方回应和棋申请。" : "对方申请和棋，请在下方功能区回应。"}</p>;
  }
  if (room.game.phase === "counting-requested" && scoring) {
    return <p className="operation-hint">{scoring.requestedBy === user.id ? "等待对方确认是否进入数子。" : "对方申请数子，请在下方功能区回应。"}</p>;
  }
  if (room.game.phase === "marking-dead") {
    return <p className="operation-hint">数子阶段：点击棋子标记死子，右键空点标记非目。</p>;
  }
  if (room.game.phase === "result-review") {
    return <p className="operation-hint">请确认数子结果，双方同意后结束对局。</p>;
  }
  return <p className="operation-hint">对局中。</p>;
}
```

- [ ] **Step 2: Pass request/scoring props into `ActionBar`**

Add props to `ActionBar` call:

```jsx
scoring={scoring}
drawRequest={drawRequest}
onCountingRespond={onCountingRespond}
onDrawRespond={onDrawRespond}
onConfirmScoring={() => onScoringAction({ type: "confirm-dead" })}
onResetScoring={() => onScoringAction({ type: "reset-dead" })}
onAcceptResult={() => onScoringAction({ type: "accept-result" })}
onRejectResult={() => onScoringAction({ type: "reject-result" })}
```

- [ ] **Step 3: Render decision states before normal player controls**

At the top of non-spectator `ActionBar`, before the normal return:

```jsx
const isRequester = scoring?.requestedBy === me?.user.id || drawRequest?.requestedBy === me?.user.id;
if (phase === "draw-requested" && drawRequest) {
  return (
    <DecisionBar title="和棋申请" message={isRequester ? "等待对方确认和棋。" : "对方申请和棋。"} waiting={isRequester}>
      {!isRequester && <>
        <button onClick={() => onDrawRespond(true)}>同意</button>
        <button onClick={() => onDrawRespond(false)}>不同意</button>
      </>}
    </DecisionBar>
  );
}
if (phase === "counting-requested" && scoring) {
  return (
    <DecisionBar title="数子申请" message={isRequester ? "等待对方确认数子。" : "对方申请数子。"} waiting={isRequester}>
      {!isRequester && <>
        <button onClick={() => onCountingRespond(true)}>同意</button>
        <button onClick={() => onCountingRespond(false)}>不同意</button>
      </>}
    </DecisionBar>
  );
}
if (phase === "marking-dead") {
  const confirmed = scoring?.confirmedBy?.includes(me?.user.id);
  return (
    <DecisionBar title="确认死子" message="标记完成后确认死子，或重新确认。">
      <button onClick={onConfirmScoring} disabled={confirmed}>{confirmed ? "已确认" : "确认死子"}</button>
      <button onClick={onResetScoring}>重新确认</button>
    </DecisionBar>
  );
}
if (phase === "result-review") {
  const accepted = scoring?.resultAcceptedBy?.includes(me?.user.id);
  return (
    <DecisionBar title={scoring?.result?.text ?? "数子结果"} message="确认结果后对局结束。">
      <button onClick={onAcceptResult} disabled={accepted}>{accepted ? "已同意" : "同意结果"}</button>
      <button onClick={onRejectResult}>不同意</button>
    </DecisionBar>
  );
}
```

Add `DecisionBar`:

```jsx
function DecisionBar({ title, message, waiting = false, children }) {
  return (
    <nav className={`action-bar decision-bar ${waiting ? "waiting" : ""}`}>
      <div className="decision-copy">
        <strong>{title}</strong>
        <span>{message}</span>
      </div>
      <div className="decision-actions">{children}</div>
    </nav>
  );
}
```

- [ ] **Step 4: Add styles**

In `src/styles/room.css`:

```css
.operation-hint {
  margin: 0;
  min-height: 38px;
  color: #7b6a7f;
  font-weight: 700;
  text-align: center;
}

.decision-bar {
  align-items: center;
  justify-content: space-between;
}

.decision-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.decision-copy strong {
  color: #2d2430;
  font-size: 15px;
}

.decision-copy span {
  color: #7b6a7f;
  font-size: 13px;
}

.decision-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.decision-bar.waiting .decision-actions {
  display: none;
}
```

- [ ] **Step 5: Run build**

Run: `npm run build`

Expected: PASS.

## Task 10: Responsive Room Structure

**Files:**
- Modify: `src/styles/responsive.css`
- Modify: `src/styles/room.css`

- [ ] **Step 1: Remove tablet stacking**

In `src/styles/responsive.css`, remove `.battle-layout` from the `max-width: 900px` `grid-template-columns: 1fr` override and remove these order overrides:

```css
.player-info.opponent { order: 1; }
.board-column { order: 2; }
.room-side { order: 3; }
```

- [ ] **Step 2: Add controlled overflow**

Add:

```css
@media (max-width: 900px) {
  .room-screen {
    overflow-x: auto;
  }

  .battle-layout {
    min-width: 840px;
  }
}

@media (max-width: 620px) {
  .battle-layout {
    min-width: 780px;
  }
}
```

- [ ] **Step 3: Ensure stable layout dimensions**

In `src/styles/room.css`, ensure:

```css
.battle-layout {
  grid-template-columns: minmax(150px, var(--left-panel)) minmax(360px, var(--board-size)) minmax(190px, var(--right-panel));
}
```

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS.

## Task 11: Documentation And Verification

**Files:**
- Modify: `docs/system-design.md`

- [ ] **Step 1: Update docs after implementation**

In `docs/system-design.md`, replace the "Next UI And Voice Design" future wording with current implementation notes:

```md
## Result Rewards And Room UI

- Finished games display current-player reward deltas in the result modal.
- Rating deltas are win +20, loss -20, draw 0.
- Coin deltas are win +50, loss +20, draw 0; decisive games persist those coin increments server-side.
- Home screen prioritizes "空想对局" as the primary action and keeps "棋舍" as a secondary character/profile entry.
- Player timers use a digital display; byo-yomi periods render as smaller leading-zero counters such as 03, 02, and 01.
- Request and scoring phases replace the board action area with the relevant decision controls.
- Finished decisive games mark winner/loser portraits with circular 胜/负 badges.
```

Also update the audio notes with the explicit voice events and countdown preload behavior implemented.

- [ ] **Step 2: Run full verification**

Run: `npm test`

Expected: all tests pass.

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 3: Review git diff**

Run: `git diff --check`

Expected: no whitespace errors.

Run: `git status --short`

Expected: only intended files changed.

- [ ] **Step 4: Commit**

```powershell
git add src/shared/resultRewards.js src/shared/resultRewards.test.js server/rooms.js server/rooms.test.js src/shared/systemVoices.js src/shared/systemVoices.test.js src/shared/timeAnnouncements.js src/shared/timeAnnouncements.test.js src/audio/playback.jsx src/main.jsx src/styles/base.css src/styles/room.css src/styles/responsive.css src/styles/modals.css docs/system-design.md
git commit -m "feat: add result rewards and room UI updates"
```

Expected: commit succeeds.
