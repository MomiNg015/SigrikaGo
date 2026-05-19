# Result Rewards, Home Layout, Character Voices, And Room Controls Design

## Goal

Implement a focused UI and audio-system upgrade for the next SigrikaGo iteration:

- Show rating and coin changes in the game result modal.
- Make the home screen visually prioritize "空想对局", with "棋舍" as a secondary character/profile entry.
- Clarify character voice event categories and prepare countdown voice playback for per-second files.
- Restyle room clocks as nixie/digital displays.
- Replace the room action bar with request/scoring decision controls when the game phase requires it.
- Mark winner and loser portraits with round result badges after the game ends.
- Keep desktop and tablet layouts structurally consistent, and preserve that structure on mobile as much as practical.

## Confirmed Decisions

### Home Layout

Use layout option A:

- "空想对局" is the largest, primary home action.
- "棋舍" is smaller and secondary, but still includes the selected character portrait/profile signal.
- "商城", "观战", "排行榜", and "后台管理" are medium icon buttons.
- Desktop and tablet keep the same layout and shrink down to a minimum viable width.
- Mobile should avoid changing the information architecture. If space is too tight, use scaling or horizontal overflow before replacing the screen with a different layout.

### Countdown Voice Files

Use 10 separate countdown voice events/files:

- `countdown-10`
- `countdown-9`
- `countdown-8`
- `countdown-7`
- `countdown-6`
- `countdown-5`
- `countdown-4`
- `countdown-3`
- `countdown-2`
- `countdown-1`

To avoid voice/file-switch stutter, these assets must be preloadable and decodable before playback. Playback should be driven by timer state changes and should never wait on file loading during the live countdown. If a second is skipped by state updates, the client should only play the current second and should not replay stale countdown voice.

### Room Control Replacement

The action area under the board is a stateful decision area:

- Normal play: show the regular action buttons.
- Request phases: replace the receiver's action area with request text, countdown, and agree/disagree buttons. The requester sees a waiting state.
- Dead-stone marking and result review: replace both players' action areas with the appropriate scoring workflow controls.
- The lower-left side panel is reserved for text operation hints only.

### Time Display

The player info time section should use a nixie/digital-clock visual treatment:

- Main time and byo-yomi seconds are shown as primary digital numbers.
- Byo-yomi periods are also digital numbers with leading zeroes, for example `03`, `02`, `01`.
- The period number is smaller than the current time/seconds number so it reads as a secondary counter.
- Avoid the current compact math-like text such as `30s × 3`.

## Feature Design

### 1. Result Rewards

Create a shared result reward helper so both frontend display and backend persistence use one rule table:

- Rating:
  - win: `+20`
  - loss: `-20`
  - draw: `0`
- Coins:
  - win: `+50`
  - loss: `+20`
  - draw: `0`

Backend result save should continue using the existing structured `winnerColor` field. When a game has a winner, increment winner coins by 50 and loser coins by 20. When the result is a draw, do not change either player's coins. Rating changes remain the existing win/loss/draw values, but should be exposed through the same helper for display consistency.

The result modal should display the current user's personal change:

- Win: `积分 +20`, `金币 +50`
- Loss: `积分 -20`, `金币 +20`
- Draw: `积分 0`, `金币 0`

The display is informational; the backend remains the source of truth for persisted user assets.

### 2. Home Screen Layout

Refactor `HomeScreen` markup just enough to support the selected hierarchy:

- Primary match panel:
  - large visual surface
  - clear "空想对局" label
  - prominent start-match button
  - brief rules summary
- Secondary house panel:
  - selected character portrait
  - username, rank, rating
  - "棋舍" entry affordance
- Utility icon buttons:
  - shop
  - watch
  - leaderboard
  - admin, only for admins

This is a layout change, not a navigation change. Existing handlers and page state remain unchanged.

### 3. Character Voice Event Map

Replace the loose "system voice" concept with an explicit character voice event map while keeping backward-compatible behavior.

Events:

- `game-start`: role voice for game start.
- `skill-cast`: role voice for skill activation.
- `byo-yomi-start`: role voice for entering byo-yomi.
- `byo-yomi-period-2`: role voice for two periods remaining.
- `byo-yomi-period-1`: role voice for one period remaining.
- `countdown-10` through `countdown-1`: per-second countdown voices.
- `timeout`: role voice for timeout.
- `result-victory`: role voice for victory.
- `result-defeat`: role voice for defeat.
- `result-draw`: role voice for draw.
- `house-detail`: role voice when opening or clicking character detail in the house screen.

Resolution order:

1. Character-specific voice for the event.
2. Generic/default voice asset for the event, if configured later.
3. TTS fallback text, where the event has text fallback.
4. No playback for optional events without assets or fallback.

The existing `playVoiceSound` path with voice volume and reverb remains the playback channel for character voice assets.

### 4. Countdown Voice Preload

Add a voice preload/cache boundary before per-second countdown voice is actively used:

- Preload current player's character countdown voice assets when a room opens or when the active player enters byo-yomi.
- Decode files to Web Audio buffers where possible.
- Play from decoded buffers during countdown.
- Do not block timer rendering or game state on preload failure.
- If a file is missing or fails to decode, fall back to TTS or silence according to the event resolver.

This mirrors the BGM lesson: files that must be time-sensitive should not be fetched at the exact moment they are needed.

### 5. Room Time UI

`TimeBar` should be split into explicit display parts:

- primary digital value: main time while main time remains, otherwise current byo-yomi seconds.
- secondary digital period counter: leading-zero period count, e.g. `03`, `02`, `01`.
- label text: "主时间" or "读秒".
- existing progress bar can remain, but it should no longer be the main visual identity.

CSS should use a restrained digital-clock/nixie style:

- dark display background
- glowing segmented/digital numeric typography using existing fonts/fallbacks
- smaller secondary period counter
- no negative letter spacing
- stable dimensions so numbers do not resize the player card.

### 6. Action Area State Model

The existing `StatusPanel` and `ActionBar` responsibilities should be reorganized into a single state-aware action area:

- `ActionBar` stays responsible for player/spectator actions in normal states.
- A new or refactored decision component renders:
  - draw request response
  - counting request response
  - dead-stone confirmation/reset
  - scoring result accept/reject
  - requester waiting messages
- The board-column action area is the canonical home for these controls.
- Side status slots should become text-only hints or be removed where redundant.

This keeps the main decisions near the board and avoids scattering flow buttons across side panels.

### 7. Result Badges

After a game ends:

- winner portrait shows a red circular "胜" badge at the lower-right of the portrait.
- loser portrait shows a black circular "负" badge at the lower-right of the portrait.
- badges can overlap part of the portrait.
- draws show no win/loss badge.

Badges should be CSS-rendered UI, not image assets, so they scale cleanly and do not add asset-management work.

### 8. Responsive Layout

Update responsive behavior so desktop and tablet keep the same screen structure:

- Avoid switching `.battle-layout` to a one-column stack at tablet widths.
- Use min/max widths, scale constraints, or horizontal overflow for the room surface.
- Keep the board, left player panel, and right player/chat panel spatially consistent.
- Mobile should preserve the same layout where possible. If exact preservation would make controls unusable, prefer a controlled scroll container over rearranging the meaning of the screen.

This is a product direction, not a promise that every viewport can fit without scrolling.

## Testing Strategy

- Unit-test shared result reward helper for win/loss/draw and both colors.
- Unit-test character voice event resolution, including per-second countdown event names and missing-asset fallback.
- Unit-test time announcement mapping for `byo-yomi-period-2`, `byo-yomi-period-1`, and countdown seconds.
- Add component-level or DOM tests where existing tooling makes it practical:
  - result modal displays rating and coin deltas.
  - player info displays win/loss badges only after finished non-draw games.
  - action area swaps from normal controls to request/scoring controls based on phase.
- Run `npm test` and `npm run build`.

## Out Of Scope For This Iteration

- Admin upload UI for every voice category.
- Actual new voice assets for every event.
- Persistent music/voice inventory and player-owned voice selection.
- A full mobile-specific redesign.
- Browser automation for real audio playback timing. This remains a future risk area.
