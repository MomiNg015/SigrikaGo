# Remove room chat entry, refine spectator state, and preserve player identity

## Goal

Improve the shared battle surface for live rooms, spectators, and replays without changing the deferred tablet geometry. Ordinary rooms should expose no chat entry while preserving server compatibility, spectator/replay state should be unambiguous, viewpoint switching should use valid interactive semantics, and player usernames must never be ellipsized.

## Requirements

- Ordinary live rooms, spectator views, and record replays render no chat button, chat tab, chat panel, composer, or client `chat:send` binding.
- Server chat events and existing room chat data remain intact for compatibility and possible future use.
- Desktop operation hints move below the self player panel into the former chat-control location.
- Mobile room shells return to the compact fixed-viewport dock budget because ordinary rooms no longer need expanded chat height or page scrolling.
- Battle tutorials may expose an explicitly gated readonly `剧情记录`; it has no send callback and is not ordinary room chat.
- Room view state is derived centrally from replay/spectator mode, current step, live step, and viewpoint color.
- Live spectators see `实时观战`; spectators browsing earlier moves see `观战回看` plus a visible `回到实时` action; replays remain explicitly labeled `棋谱回放`.
- The current black/white viewpoint is expressed with text and a non-color-only selected marker.
- `PlayerInfo` remains a semantic information container. Only the portrait becomes a real viewpoint-switch button when switching is available.
- The inert username button becomes non-interactive markup. Tooltip statistics use real buttons where interaction remains.
- Clicking names, statistics, or skills must never switch viewpoint.
- Mobile battle usernames have layout priority over titles, rank, and rating. Valid usernames (maximum display width 8) remain on one line; legacy over-limit values wrap and remain fully visible.
- No mobile battle username may use ellipsis, marquee motion, horizontal scrolling, or a smaller fallback font to conceal overflow.
- Existing title, emblem, and nameplate equipment remains visible; the nameplate container must accommodate the full username.
- Preserve the existing Bright School visual language and control vocabulary.
- Mobile member-row actions and their follow-up profile/confirmation overlays must escape the dock's scroll and clipping containers while retaining theme and floating-layer ownership.

## Acceptance Criteria

- [ ] Live, spectator, and replay rooms contain no chat button, chat tab, readable chat panel, composer, or `chat:send` client wiring.
- [ ] Server chat handlers and stored chat data remain unchanged.
- [ ] Desktop player operation hints render below the self player panel and no longer render below the opponent/member column.
- [ ] Mobile ordinary rooms use compact action/member dock ceilings and remain inside the fixed viewport.
- [ ] Battle tutorials retain a readonly `剧情记录` with no send input or callback.
- [ ] Live spectator, spectator history, and replay states render the agreed distinct labels and controls.
- [ ] Spectator history exposes a visible `回到实时` action and returns to the latest step.
- [ ] Viewpoint selection is available from the player portrait and exposes an accessible pressed state.
- [ ] Player cards no longer put `role="button"` on the outer `aside` and contain no nested interactive ownership conflict.
- [ ] Clicking a tooltip stat or skill does not change viewpoint.
- [ ] `Alice_12`, `测试玩家`, `가나다라`, a mixed maximum-width username, and identities with title/emblem/nameplate render without username ellipsis.
- [ ] A legacy over-limit username wraps without being clipped.
- [ ] Live, spectator, and replay variants are visually checked at 375x667 and 375x812.
- [ ] Targeted room/component tests and the broad repository check pass.
- [ ] Clicking a mobile member row reveals the full action area above the dock; interacting inside it does not trigger click-away, while an outside press closes it.
- [ ] System-design Markdown and generated HTML describe the updated mobile room contracts.

## Definition of Done

- Production behavior, component semantics, CSS, and tests are updated together.
- Browser-level visual and geometry checks cover the agreed mobile states and username fixtures.
- `npm run docs:system-design` has regenerated `docs/system-design.html`.
- `npm run check` passes, or any unrelated pre-existing failure is recorded with evidence.
- Existing unrelated dirty-worktree changes remain untouched.

## Technical Approach

- Stop composing `ChatBox` from ordinary `RoomScreen` flows and remove the client room-route send binding while leaving backend handling intact.
- Gate the existing compact `ChatBox` renderer behind `showTutorialLog`, label it `剧情记录`, and force it readonly.
- Move `OperationHint` from the desktop opponent column to the self column, after `PlayerInfo`.
- Restore compact fixed-viewport mobile dock and overflow contracts now that the chat tab is absent.
- Add a small pure room-view-status helper and pass its result to `RoomHeader` and `ReplayActionBar` rather than duplicating boolean logic.
- Give `ReplayActionBar` explicit replay and spectator variants, including a visible return-to-live action.
- Refactor `PlayerInfo` so the portrait owns viewpoint selection, the outer card is non-interactive, and the username uses non-button markup.
- Add a battle-specific `UserIdentity` layout contract that gives the username intrinsic/full visibility and moves secondary metadata out of its way.
- Keep the change component-owned; theme files should only preserve Bright School visual treatment, not redefine behavior.
- Portal member actions and their follow-up overlays to the nearest `.app-shell`, and keep click-away containment aware of both the list and portaled action node.

## Decision (ADR-lite)

**Context**: Public room chat adds moderation/review surface without enough product value; spectator history also looks like replay, and the full player card owns viewpoint switching despite containing other controls. Username ellipsis hides identity information.

**Decision**: Remove ordinary frontend chat entry points while retaining server compatibility, reserve readonly story history for tutorials, move desktop operation hints into the vacated right-column slot, and keep the centralized view-state and full-visibility username contracts.

**Consequences**: Ordinary users cannot send or read room chat from the UI; the mobile dock becomes smaller again; tutorials retain scripted history without exposing public chat; spectator/replay status becomes explicit; player-card interaction remains narrower but predictable.

## Out of Scope

- Repairing the 769–900px portrait/tablet layout.
- Changing `MOBILE_ROOM_MEDIA_QUERY` or coarse-pointer routing.
- Redesigning 844x390 or other short-landscape board/dock geometry beyond restoring the pre-chat compact budget.
- Changing board sizing, viewport grid formulas, or the 44px touch-target policy.
- Applying the no-ellipsis username rule to unrelated surfaces such as friends, rankings, or replay-list cards.
- Redesigning the Bright School theme.

## Technical Notes

- Primary component owners: `src/room/RoomBattleStage.jsx`, `src/room/ChatBox.jsx`, `src/room/header/RoomHeader.jsx`, `src/room/actionBar/ReplayActionBar.jsx`, and `src/room/PlayerInfo.jsx`.
- Username validity is currently defined in `src/auth/AuthScreen.jsx` as display width 2–8; valid maximum examples are 8 half-width characters or 4 CJK characters.
- Shared identity primitives live under `src/styles/hud-components/user-identity/`; mobile room overrides are split across `src/styles/mobile-room/` and `src/styles/mobile-adaptive/`.
- Existing room tests assert many CSS source strings; this task must add behavioral DOM checks and browser geometry checks rather than relying only on substring contracts.
- Relevant design documentation is `docs/system-design.md` and `docs/system-design/06-ui-theme-mobile.md`.
