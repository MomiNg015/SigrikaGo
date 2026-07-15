import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { CHARACTERS } from "../shared/characters.js";
import { COLORS, createGameState } from "../shared/game.js";
import { effectiveRoomRole, roomCloseCountdownText, roomGameInfoForPlayers, shouldPlayGameStartVoice, shouldShowRoomCloseCountdown } from "./RoomScreen.jsx";
import RoomScreen from "./RoomScreen.jsx";

describe("RoomScreen helpers", () => {
  it("renders a replay room snapshot in spectator view", () => {
    const players = [
      {
        color: COLORS.black,
        user: { id: "black", username: "black", rank: "1段", rating: 1000 },
        characterId: "sigrika",
        character: CHARACTERS.sigrika,
        captures: 0,
        skillRemovals: 0,
        time: { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 }
      },
      {
        color: COLORS.white,
        user: { id: "white", username: "white", rank: "1段", rating: 1000 },
        characterId: "denia",
        character: CHARACTERS.denia,
        captures: 0,
        skillRemovals: 0,
        time: { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 }
      }
    ];
    const game = createGameState(players);
    const html = renderToStaticMarkup(createElement(RoomScreen, {
      room: {
        code: "12345",
        role: "player",
        players,
        spectators: [],
        spectatorCount: 0,
        chat: [],
        game
      },
      user: players[0].user,
      token: "token",
      characters: CHARACTERS,
      replayStep: 0,
      setReplayStep: () => {},
      pendingSkill: false,
      setPendingSkill: () => {},
      audioSettings: { master: 0, bgm: 0, sfx: 0, voice: 0 },
      onOpenSettings: () => {},
      onOpenMessageBoard: () => {},
      onBack: () => {},
      onGameAction: () => {},
      onCountingRequest: () => {},
      onCountingRespond: () => {},
      onDrawRequest: () => {},
      onDrawRespond: () => {},
      onScoringAction: () => {},
      onOpenReplay: () => {}
    }));

    expect(html).toContain("board");
    expect(html).toContain("replay-step-indicator");
  });

  it("renders the skill banner while the room carries a pending skill preview", () => {
    const players = [
      {
        color: COLORS.black,
        user: { id: "black", username: "black", rank: "1段", rating: 1000 },
        characterId: "sigrika",
        character: CHARACTERS.sigrika,
        captures: 0,
        skillRemovals: 0,
        time: { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 }
      },
      {
        color: COLORS.white,
        user: { id: "white", username: "white", rank: "1段", rating: 1000 },
        characterId: "denia",
        character: CHARACTERS.denia,
        captures: 0,
        skillRemovals: 0,
        time: { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 }
      }
    ];
    const game = createGameState(players);
    game.phase = "skill-preview";
    game.pendingSkill = {
      id: "skill-preview-1",
      color: COLORS.black,
      username: "black",
      characterId: "sigrika",
      character: CHARACTERS.sigrika,
      characterName: CHARACTERS.sigrika.name,
      itemEffects: {},
      skillName: CHARACTERS.sigrika.skill.name
    };

    const html = renderToStaticMarkup(createElement(RoomScreen, {
      room: {
        code: "12345",
        role: "player",
        players,
        spectators: [],
        spectatorCount: 0,
        chat: [],
        game
      },
      user: players[0].user,
      token: "token",
      characters: CHARACTERS,
      replayStep: null,
      setReplayStep: () => {},
      pendingSkill: false,
      setPendingSkill: () => {},
      audioSettings: { master: 0, bgm: 0, sfx: 0, voice: 0 },
      onOpenSettings: () => {},
      onOpenMessageBoard: () => {},
      onBack: () => {},
      onGameAction: () => {},
      onCountingRequest: () => {},
      onCountingRespond: () => {},
      onDrawRequest: () => {},
      onDrawRespond: () => {},
      onScoringAction: () => {},
      onOpenReplay: () => {}
    }));

    expect(html).toContain("skill-burst");
    expect(html).toContain(CHARACTERS.sigrika.skill.name);
  });

  it("formats room header game information", () => {
    const blackPlayer = { user: { username: "moming", rank: "9段" } };
    const whitePlayer = { user: { username: "露露米", rank: "2段" } };

    expect(roomGameInfoForPlayers(blackPlayer, whitePlayer, 42)).toEqual({
      black: "moming 9段",
      white: "露露米 2段",
      moves: "42手"
    });
  });

  it("returns null until both players exist", () => {
    expect(roomGameInfoForPlayers(null, { user: { username: "white", rank: "1段" } }, 0)).toBeNull();
  });
  it("formats finished room close countdown text", () => {
    expect(roomCloseCountdownText(1_000 + 4 * 60_000 + 59_000, 1_000)).toBe("关闭倒计时 4:59");
    expect(roomCloseCountdownText(1_000, 2_000)).toBe("关闭倒计时 0:00");
  });

  it("shows room close countdown only for finished rooms with a close timestamp", () => {
    expect(shouldShowRoomCloseCountdown({ game: { phase: "finished" }, closesAt: 10 })).toBe(true);
    expect(shouldShowRoomCloseCountdown({ game: { phase: "playing" }, closesAt: 10 })).toBe(false);
    expect(shouldShowRoomCloseCountdown({ game: { phase: "finished" }, closesAt: null })).toBe(false);
  });

  it("keeps the close countdown timer local to the room header", () => {
    const source = readText(new URL("./RoomScreen.jsx", import.meta.url));
    const headerSource = readText(new URL("./header/RoomHeader.jsx", import.meta.url));

    expect(source).not.toContain("closeCountdownNow");
    expect(source).not.toContain("setInterval(() => setCloseCountdownNow");
    expect(headerSource).toContain("function RoomCloseCountdown");
    expect(headerSource).toContain("const timerId = setInterval(() => setNow(Date.now()), 1000)");
    expect(headerSource).toContain("<RoomCloseCountdown closesAt={room.closesAt} />");
  });

  it("treats finished player rooms as spectator view", () => {
    expect(effectiveRoomRole({ role: "player", game: { phase: "playing" } })).toBe("player");
    expect(effectiveRoomRole({ role: "player", game: { phase: "finished" } })).toBe("spectator");
    expect(effectiveRoomRole({ role: "player", game: { phase: "playing" } }, true)).toBe("spectator");
  });

  it("does not replay game-start voice for spectators or finished rooms", () => {
    expect(shouldPlayGameStartVoice({ role: "player", phase: "playing" })).toBe(true);
    expect(shouldPlayGameStartVoice({ role: "spectator", phase: "playing" })).toBe(false);
    expect(shouldPlayGameStartVoice({ role: "player", phase: "finished" })).toBe(false);
    expect(shouldPlayGameStartVoice({ role: "player", phase: "playing", isReplay: true })).toBe(false);
  });

  it("routes pass through a confirmation dialog before sending the game action", () => {
    const source = readText(new URL("./RoomScreen.jsx", import.meta.url), "utf8");
    const battleSource = readText(new URL("./RoomBattleStage.jsx", import.meta.url), "utf8");

    expect(source).toContain("const requestPassConfirm = useCallback");
    expect(source).toContain("onConfirm: () => onGameAction({ type: \"pass\" })");
    expect(source).toContain("const toggleCoords = useCallback");
    expect(source).toContain("onToggleCoords={toggleCoords}");
    expect(source).toContain("是否弃一手");
    expect(battleSource).toContain("onPass={onPass}");
    expect(battleSource).not.toContain("onPass={() => onGameAction({ type: \"pass\" })}");
  });

  it("does not expose the move-number toggle in room header controls", () => {
    const source = readText(new URL("./RoomScreen.jsx", import.meta.url), "utf8");
    const headerSource = readText(new URL("./header/RoomHeader.jsx", import.meta.url), "utf8");
    const tutorialSource = readText(new URL("../tutorial/TutorialBattleScreen.jsx", import.meta.url), "utf8");

    expect(source).not.toContain("const toggleMoves");
    expect(source).not.toContain("onToggleMoves=");
    expect(headerSource).not.toContain("Hash");
    expect(headerSource).not.toContain("显示手数");
    expect(headerSource).not.toContain("<span>手数</span>");
    expect(tutorialSource).not.toContain("onToggleMoves=");
    expect(tutorialSource).not.toContain("setShowMoves");
  });

  it("passes a stable neutral-point handler into the memoized board", () => {
    const battleSource = readText(new URL("./RoomBattleStage.jsx", import.meta.url), "utf8");

    expect(battleSource).toContain("const handleNeutralPoint = useCallback");
    expect(battleSource).toContain("onNeutral={handleNeutralPoint}");
    expect(battleSource).not.toContain("onNeutral={(id) => onScoringAction");
  });

  it("passes stable floating-layer handlers into tutorial records and member panels", () => {
    const battleSource = readText(new URL("./RoomBattleStage.jsx", import.meta.url), "utf8");

    expect(battleSource).toContain("const handleMembersFloatingLayer = useCallback");
    expect(battleSource).toContain("const handleStoryLogFloatingLayer = useCallback");
    expect(battleSource).toContain("onFloatingLayerRequest={handleMembersFloatingLayer}");
    expect(battleSource).toContain("onFloatingLayerRequest={handleStoryLogFloatingLayer}");
    expect(battleSource).not.toContain("onFloatingLayerRequest={() => bringFloatingLayerToFront(\"story-log\")}");
    expect(battleSource).not.toContain("onFloatingLayerRequest={() => bringFloatingLayerToFront(\"members\")}");
  });

  it("seeds resumed room audio baseline before passive room audio effects", () => {
    const source = readText(new URL("./audio/useRoomAudioEffects.js", import.meta.url), "utf8");

    expect(source).toContain("useLayoutEffect");
    expect(source).toContain("shouldSeedRoomAudioBaseline(room)");
    expect(source.indexOf("shouldSeedRoomAudioBaseline(room)")).toBeLessThan(source.indexOf("playSystemVoice(SYSTEM_VOICE_EVENTS.gameStart"));
  });

  it("passes room mode to the game-start system voice resolver", () => {
    const source = readText(new URL("./audio/useRoomAudioEffects.js", import.meta.url), "utf8");

    expect(source).toContain("playSystemVoice(SYSTEM_VOICE_EVENTS.gameStart");
    expect(source).toContain("params: { mode: displayRoom.mode }");
  });

  it("keeps the board primary while preserving player portraits on mobile", () => {
    const css = readCssWithImports(new URL("../styles/mobile-room.css", import.meta.url));
    const compactMedia = mediaBlock(css, "@media (max-width: 900px)");
    const landscapeMedia = mediaBlock(css, "@media (max-width: 900px) and (orientation: landscape)");

    expect(compactMedia).toContain(".mobile-room-screen .mobile-room-viewport");
    expect(compactMedia).toContain("grid-template-areas:");
    expect(compactMedia).toContain("\"opponent\"");
    expect(compactMedia).toContain("\"board\"");
    expect(compactMedia).toContain("\"self\"");
    expect(compactMedia).toContain("\"dock\"");
    expect(compactMedia).toContain("--mobile-room-board-size");
    expect(compactMedia).toContain("env(safe-area-inset-top)");
    expect(compactMedia).toContain(".mobile-room-screen .player-info");
    expect(compactMedia).toContain("\"portrait meta time\"");
    expect(compactMedia).toContain("\"portrait captures skill\"");
    expect(compactMedia).toContain("min-height: 44px");
    expect(compactMedia).toContain(".mobile-room-screen .timer-label");
    expect(compactMedia).toContain("display: none");
    expect(compactMedia).toContain(".mobile-room-screen .mobile-tab-panel .test-tools");
    expect(compactMedia).toContain("display: inline-flex");
    expect(compactMedia).toContain(".mobile-room-screen .mobile-tab-list .mobile-tab-button");
    expect(landscapeMedia).toContain("\"opponent board self\"");
    expect(landscapeMedia).toContain("\"dock dock dock\"");
    expect(landscapeMedia).toContain("grid-template-columns: minmax(128px, 0.72fr) minmax(280px, 1.4fr) minmax(128px, 0.72fr)");
    expect(landscapeMedia).toContain("min(54dvw, calc(100dvh - 112px), 330px)");
  });

  it("uses extra-compact portrait room cards without pushing the board offscreen", () => {
    const css = readCssWithImports(new URL("../styles/mobile-room.css", import.meta.url));
    const roomCss = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const source = readText(new URL("./RoomScreen.jsx", import.meta.url), "utf8");
    const headerSource = readText(new URL("./header/RoomHeader.jsx", import.meta.url), "utf8");
    const battleSource = readText(new URL("./RoomBattleStage.jsx", import.meta.url), "utf8");
    const playerInfoSource = readText(new URL("./PlayerInfo.jsx", import.meta.url), "utf8");
    const portraitMedia = mediaBlock(css, "@media (max-width: 760px) and (orientation: portrait), (max-width: 420px)");

    expect(headerSource).toContain("className=\"room-title-stack\"");
    expect(headerSource).toContain("DoorOpen");
    expect(headerSource).toContain("room-mobile-exit");
    expect(source).toContain("onBack={requestExitConfirm}");
    expect(source).toContain("mobileBackRequestId = 0");
    expect(source).toContain("handledMobileBackRequestIdRef.current = mobileBackRequestId");
    expect(source).toContain("requestExitConfirm();");
    expect(source).toContain("对局还没结束，是否认输并退出房间？");
    expect(headerSource).toContain("room-mobile-menu");
    expect(headerSource).toContain("room-mobile-menu-toggle");
    expect(headerSource).toContain("room-mobile-menu-panel");
    expect(headerSource).toContain("<span>留言</span>");
    expect(headerSource).toContain("<span>坐标</span>");
    expect(battleSource).toContain("className=\"mobile-room-viewport mobile-battle-layout\"");
    expect(battleSource).toContain("className=\"mobile-board-viewport mobile-board-slot board-column\"");
    expect(battleSource).toContain("className=\"mobile-room-dock mobile-room-tabs\"");
    expect(battleSource).toContain("className=\"mobile-action-panel\"");
    expect(battleSource).not.toContain("content: <>{hintPanel}{actionPanel}</>");
    expect(portraitMedia).toContain(".mobile-room-screen .player-info");
    expect(portraitMedia).toContain("--mobile-room-player-strip-height: clamp(64px, 8.8dvh, 74px)");
    expect(portraitMedia).toContain("grid-template-rows: minmax(0, var(--mobile-room-player-strip-height)) minmax(0, 1fr) minmax(0, var(--mobile-room-player-strip-height)) auto");
    expect(portraitMedia).toContain("min-height: 64px");
    expect(portraitMedia).toContain("overflow: hidden");
    expect(portraitMedia).toContain("grid-template-areas:");
    expect(portraitMedia).toContain("grid-template-columns: 48px minmax(0, 1fr) minmax(118px, 0.7fr)");
    expect(portraitMedia).toContain("\"portrait meta time\"");
    expect(portraitMedia).toContain("\"portrait captures skill\"");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-player-slot");
    expect(portraitMedia).toContain(".mobile-room-screen .portrait-wrap");
    expect(portraitMedia).toContain("align-self: center");
    expect(playerInfoSource).toContain("portrait-viewpoint-button");
    expect(playerInfoSource).toContain("onClick={() => onViewColor?.(player.color)}");
    expect(playerInfoSource).toContain("aria-pressed={isSelectedView}");
    expect(playerInfoSource).not.toContain("onClick={canSwitchView ? () => onViewColor?.(player.color) : undefined}");
    expect(portraitMedia).not.toContain(".mobile-room-screen .viewpoint-button");
    expect(portraitMedia).toContain(".mobile-room-screen .room-toggles");
    expect(portraitMedia).toContain("display: none");
    expect(portraitMedia).toContain(".mobile-room-screen .room-mobile-exit");
    expect(portraitMedia).toContain(".mobile-room-screen .room-mobile-menu");
    expect(portraitMedia).toContain("z-index: var(--room-floating-z, 120)");
    expect(portraitMedia).toContain(".mobile-room-screen .room-mobile-menu-panel");
    expect(portraitMedia).toContain("inline-size: min(176px, calc(100vw - 24px))");
    expect(portraitMedia).toContain("min-inline-size: min(156px, calc(100vw - 24px))");
    expect(portraitMedia).toContain(".mobile-room-screen .room-title-stack");
    expect(portraitMedia).toContain("font-size: 10px");
    expect(portraitMedia).toContain(".mobile-room-screen .room-info-tag.close-countdown");
    expect(portraitMedia).toContain("display: block");
    expect(portraitMedia).toContain("height: 100dvh");
    expect(portraitMedia).toContain("overflow: hidden");
    expect(portraitMedia).toContain("\"opponent\"");
    expect(portraitMedia).toContain("\"board\"");
    expect(portraitMedia).toContain("\"self\"");
    expect(portraitMedia).toContain("\"dock\"");
    expect(portraitMedia).toContain(".mobile-room-screen .board-stage");
    expect(portraitMedia).toContain("var(--mobile-room-board-size)");
    expect(portraitMedia).toContain("aspect-ratio: 1");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-tab-button");
    expect(portraitMedia).toContain("min-height: 40px");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-tab-panel .action-bar button");
    expect(portraitMedia).toContain(".mobile-room-screen .color-badge");
    expect(portraitMedia).toContain("display: none");
    expect(portraitMedia).toContain(".mobile-room-screen .skill-detail-panel");
    expect(portraitMedia).toContain("bottom: calc(100% + 6px)");
    expect(portraitMedia).toContain(".mobile-room-screen .captures .info-stat::after");
    expect(portraitMedia).toContain("max-width: min(192px, calc(100vw - 32px))");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-room-dock");
    expect(portraitMedia).toContain("grid-area: dock");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-tab-panel");
    expect(portraitMedia).toContain("max-height: var(--mobile-room-dock-panel-height)");
    expect(portraitMedia).toContain("overflow: auto");
    expect(portraitMedia).toContain(".mobile-room-screen #mobile-room-panel-actions");
    expect(portraitMedia).toContain("overflow: visible");
    expect(portraitMedia).toContain(".mobile-room-screen #mobile-room-panel-actions .operation-hint");
    expect(portraitMedia).toContain("max-height: 42px");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-tab-panel .action-bar .action-label");
    expect(css).toContain("place-items: center");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-tab-panel .skill-action");
    expect(portraitMedia).toContain("min-width: 0");
    expect(portraitMedia).toContain("grid-column: 2");
    expect(portraitMedia).toContain(".mobile-room-screen .result-badge");
    expect(portraitMedia).toContain("width: 18px");
    expect(portraitMedia).toContain("right: 1px");
    expect(portraitMedia).toContain("bottom: 1px");
    expect(source).toContain("useTimedRoomRequestToast");
    expect(source).toContain("TimedRoomRequestToast");
    expect(roomCss).toContain(".room-request-toast");
  });

  it("keeps touch point confirmation visual-only on mobile", () => {
    const source = readText(new URL("./RoomScreen.jsx", import.meta.url), "utf8");
    const roomCss = readCssWithImports(new URL("../styles/room.css", import.meta.url));

    expect(source).not.toContain("touch-confirm-hint");
    expect(roomCss).toContain(".touch-confirm-marker");
  });

  it("keeps mobile dead-stone decisions compact and readable", () => {
    const mobileRoomCss = readCssWithImports(new URL("../styles/mobile-room.css", import.meta.url));
    const brightMobileCss = readCssWithImports(new URL("../styles/themes/bright-school/mobile.css", import.meta.url));
    const portraitMedia = mediaBlock(mobileRoomCss, "@media (max-width: 760px) and (orientation: portrait), (max-width: 420px)");
    const brightPortraitMedia = mediaBlock(brightMobileCss, "@media (max-width: 760px) and (orientation: portrait)");

    expect(portraitMedia).toContain(".mobile-room-screen .mobile-tab-panel .decision-bar");
    expect(portraitMedia).toContain("grid-template-columns: minmax(0, 1fr) minmax(128px, 0.72fr)");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-tab-panel .decision-actions");
    expect(portraitMedia).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-tab-panel .decision-copy span");
    expect(portraitMedia).toContain("-webkit-line-clamp: 2");
    expect(brightPortraitMedia).toContain(".mobile-room-screen .mobile-tab-panel .decision-bar");
    expect(brightPortraitMedia).toContain("grid-template-columns: minmax(0, 1fr) minmax(128px, 0.72fr) !important");
    expect(brightPortraitMedia).toContain(".mobile-room-screen .mobile-tab-panel .decision-actions button");
    expect(brightPortraitMedia).toContain("min-height: 42px !important");
  });

  it("passes no-target skill board confirmation from the room view into point actions", () => {
    const source = readText(new URL("./RoomScreen.jsx", import.meta.url), "utf8");
    const boardViewSource = readText(new URL("./view/useRoomBoardView.js", import.meta.url), "utf8");
    const pointActionsSource = readText(new URL("./actions/useRoomPointActions.js", import.meta.url), "utf8");

    expect(boardViewSource).toContain("skillUsesBoardConfirmation(skillConfig)");
    expect(source).toContain("skillUsesBoardConfirmation,");
    expect(source).toContain("useRoomPointActions({");
    expect(pointActionsSource).toContain("if (skillUsesBoardConfirmation) return Boolean(point?.valid)");
  });

  it("keeps extra-narrow portrait rooms from overlapping the player cards", () => {
    const css = readCssWithImports(new URL("../styles/mobile-room.css", import.meta.url));
    const narrowPortraitMedia = mediaBlock(css, "@media (max-width: 340px) and (orientation: portrait)");

    expect(narrowPortraitMedia).toContain(".mobile-room-screen");
    expect(narrowPortraitMedia).toContain("--mobile-room-board-size");
    expect(narrowPortraitMedia).toContain("calc(100dvh - 388px)");
    expect(narrowPortraitMedia).toContain("--mobile-room-dock-panel-height: clamp(98px, 15dvh, 120px)");
  });

  it("separates desktop and mobile room layout shells", () => {
    const source = readText(new URL("./RoomScreen.jsx", import.meta.url), "utf8");
    const battleSource = readText(new URL("./RoomBattleStage.jsx", import.meta.url), "utf8");
    const layoutSource = readText(new URL("./layout/RoomLayouts.jsx", import.meta.url), "utf8");
    const stylesEntry = readText(new URL("../styles.css", import.meta.url), "utf8");
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url))
      + readCssWithImports(new URL("../styles/mobile-room.css", import.meta.url));

    expect(source).toContain("useMobileRoomLayout");
    expect(source).toContain("DesktopRoomLayout");
    expect(source).toContain("MobileRoomLayout");
    expect(layoutSource).toContain("desktop-room-screen");
    expect(layoutSource).toContain("mobile-room-screen");
    expect(battleSource).toContain("mobile-room-viewport");
    expect(source).toContain("mobile-battle-layout");
    expect(stylesEntry.indexOf("./styles/responsive.css")).toBeLessThan(stylesEntry.indexOf("./styles/mobile-room.css"));
    expect(css).toContain(".mobile-battle-layout");
    expect(css).toContain("grid-area: board");
  });

  it("renders the mobile dock inside the battle stage instead of extracting composite children", () => {
    const battleSource = readText(new URL("./RoomBattleStage.jsx", import.meta.url), "utf8");
    const layoutSource = readText(new URL("./layout/RoomLayouts.jsx", import.meta.url), "utf8");

    expect(battleSource).toContain("mobile-room-dock mobile-room-tabs");
    expect(battleSource).toContain("mobile-tab-panel");
    expect(layoutSource).not.toContain("Children.toArray");
  });

  it("keeps ordinary mobile rooms chat-free while allowing a readonly tutorial record tab", () => {
    const battleSource = readText(new URL("./RoomBattleStage.jsx", import.meta.url), "utf8");
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url))
      + readCssWithImports(new URL("../styles/mobile-room.css", import.meta.url));

    expect(battleSource).toContain("activeMobilePanel");
    expect(battleSource).toContain("mobile-room-dock");
    expect(battleSource).toContain("mobile-room-tabs");
    expect(battleSource).toContain("mobile-tab-list");
    expect(battleSource).toContain("mobile-tab-panel");
    expect(battleSource).toContain("actionPanel");
    expect(battleSource).toContain("membersPanel");
    expect(battleSource).toContain("showTutorialLog = false");
    expect(battleSource).toContain("storyLogPanel");
    expect(battleSource).toContain("storyLogPanel && { id: \"story-log\", label: \"剧情记录\"");
    expect(battleSource).not.toContain("{ id: \"chat\", label: \"聊天\"");
    expect(battleSource).toContain("presentation={isMobileBattleLayout ? \"embedded\" : \"floating\"}");
    expect(battleSource).toContain("panels.map((panel) => (");
    expect(battleSource).toContain("hidden={panel.id !== selectedPanel.id}");
    expect(battleSource).toContain("panel.badge != null && <strong className=\"mobile-tab-badge\"");
    expect(battleSource).not.toContain("trailingAction={");
    expect(battleSource).not.toContain("chat-exit-action exit-action");
    expect(css).toContain("grid-area: dock");
    expect(css).toContain(".mobile-room-screen .action-bar");
    expect(css).toContain("position: static");
    expect(css).toContain("@media (max-width: 760px) and (orientation: portrait), (max-width: 420px)");
    expect(css).toContain("--mobile-room-dock-panel-height");
    expect(css).toContain("\"opponent\"");
    expect(css).toContain("\"board\"");
    expect(css).toContain("\"self\"");
    expect(css).toContain("\"dock\"");
    expect(css).toContain("\"opponent board self\"");
    expect(css).toContain("\"dock dock dock\"");
  });

  it("keeps audited mobile room controls visible and avoids tiny landscape boards", () => {
    const battleSource = readText(new URL("./RoomBattleStage.jsx", import.meta.url), "utf8");
    const actionSource = readText(new URL("./ActionBar.jsx", import.meta.url), "utf8");
    const mobileRoomCss = readCssWithImports(new URL("../styles/mobile-room.css", import.meta.url));
    const mobileAdaptiveCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const brightMobileCss = readCssWithImports(new URL("../styles/themes/bright-school/mobile.css", import.meta.url));
    const brightRoomCss = readCssWithImports(new URL("../styles/themes/bright-school/room.css", import.meta.url));
    const portraitMedia = mediaBlock(brightMobileCss, "@media (max-width: 760px) and (orientation: portrait)");
    const landscapeMedia = mediaBlock(mobileRoomCss, "@media (max-width: 900px) and (orientation: landscape)");

    expect(actionSource).toContain("mobile-action-button-label");
    expect(battleSource).toContain("aria-label={panel.badge == null ? panel.label : `${panel.label}，${panel.badge}条`}");
    expect(portraitMedia).toContain("--mobile-room-dock-panel-height: clamp(112px, 17dvh, 150px)");
    expect(portraitMedia).toContain("--mobile-room-player-strip-height: clamp(64px, 8.8dvh, 74px)");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-action-panel");
    expect(portraitMedia).toContain("display: grid !important");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-tab-panel .action-bar .action-label");
    expect(portraitMedia).toContain("display: block !important");
    expect(portraitMedia).toContain("font-size: 10px !important");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-tab-panel .action-bar button");
    expect(portraitMedia).toContain("border: 0 !important");
    expect(portraitMedia).toContain("box-shadow: none !important");
    expect(portraitMedia).toContain("background: transparent !important");
    expect(portraitMedia).toContain("grid-template-rows: 1fr !important");
    expect(portraitMedia).toContain("button:has(.action-label)");
    expect(portraitMedia).toContain("max-height: 42px !important");
    expect(brightMobileCss).toContain(".mobile-room-screen :where(");
    expect(mobileRoomCss).toContain(".room-code-label");
    expect(mobileRoomCss).toContain(".room-info-tag");
    expect(mobileRoomCss).toContain(".captures > *");
    expect(mobileRoomCss).toContain(".timer-track span");
    expect(mobileRoomCss).toContain(".action-bar button");
    expect(mobileRoomCss).toContain("text-shadow: none");
    expect(mobileAdaptiveCss).toContain(".room-mobile-menu-panel button");
    expect(mobileAdaptiveCss).toContain(".replay-bar button");
    expect(mobileAdaptiveCss).toContain(".timer-track span");
    expect(mobileAdaptiveCss).toContain(".mobile-room-screen .mobile-tab-button:active:not(:disabled)");
    expect(mobileAdaptiveCss).toContain("transform: none !important");
    expect(mobileAdaptiveCss).toContain(".mobile-room-screen .room-mobile-menu.open");
    expect(mobileAdaptiveCss).toContain("z-index: var(--room-floating-z, 120) !important");
    expect(mobileAdaptiveCss).not.toContain(":has(.chat-widget.open)");
    expect(mobileAdaptiveCss).not.toContain(".mobile-room-screen .chat-widget.open");
    expect(mobileAdaptiveCss).not.toContain(".mobile-room-screen .chat-popover");
    expect(mobileAdaptiveCss).toContain(".mobile-room-screen .captures > *,\n  .app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .mobile-room-screen .digital-timer");
    expect(mobileAdaptiveCss).toContain(".mobile-room-screen .replay-step-indicator");
    expect(mobileAdaptiveCss).toContain("#mobile-room-panel-actions .replay-bar");
    expect(mobileAdaptiveCss).toContain("#mobile-room-panel-actions .replay-bar button");
    expect(mobileAdaptiveCss).toContain("border: 0 !important");
    expect(mobileAdaptiveCss).toContain("background: transparent !important");
    expect(mobileAdaptiveCss).toContain(".message-board-modal > .close-button");
    expect(mobileAdaptiveCss).toContain("right: var(--modal-close-inset, 12px) !important");
    expect(mobileAdaptiveCss).toContain("z-index: 20 !important");
    expect(mobileAdaptiveCss).toContain("text-shadow: none !important");
    expect(brightMobileCss).toContain(".room-mobile-menu-toggle");
    expect(brightMobileCss).toContain(".captures > *");
    expect(brightMobileCss).toContain(".timer-track span");
    expect(brightMobileCss).toContain(".mobile-room-screen .mobile-tab-button:active:not(:disabled)");
    expect(brightMobileCss).toContain(".chat-box");
    expect(brightMobileCss).toContain("box-shadow: none !important");
    expect(brightMobileCss).toContain("filter: none !important");
    expect(brightMobileCss).toContain("text-shadow: none !important");
    expect(brightRoomCss).toContain(".room-screen :where(");
    expect(brightRoomCss).toContain(".action-bar button");
    expect(brightRoomCss).toContain("box-shadow: none !important");
    expect(landscapeMedia).toContain("min(54dvw, calc(100dvh - 112px), 330px)");
    expect(landscapeMedia).toContain("grid-template-columns: minmax(128px, 0.72fr) minmax(280px, 1.4fr) minmax(128px, 0.72fr)");
    expect(landscapeMedia).toContain("--mobile-room-dock-panel-height: 44px");
    expect(landscapeMedia).toContain("transform: translateY(-8px)");
    expect(landscapeMedia).toContain(".mobile-room-screen .mobile-tab-panel");
    expect(landscapeMedia).toContain("padding: 0");
    expect(landscapeMedia).toContain("overflow: hidden !important");
    expect(landscapeMedia).toContain("grid-template-areas: \"meta\" \"time\" \"captures\"");
    expect(landscapeMedia).toContain(".mobile-room-screen .rank-tag,\n  .mobile-room-screen .rating-tag,\n  .mobile-room-screen .captures");
    expect(landscapeMedia).toContain(".mobile-room-screen .skill-detail-panel,\n  .mobile-room-screen .skill-chip-wrap");
    expect(landscapeMedia).toContain(".mobile-room-screen .name-button");
    expect(landscapeMedia).toContain("text-overflow: ellipsis");
    expect(landscapeMedia).toContain(".mobile-room-screen .digital-timer");
    expect(landscapeMedia).toContain(".mobile-room-screen #mobile-room-panel-actions .operation-hint");
    expect(landscapeMedia).toContain("display: none");
    expect(landscapeMedia).toContain("grid-template-columns: repeat(5, minmax(0, 1fr))");
    expect(landscapeMedia).toContain("grid-auto-rows: 44px");
  });

  it("keeps mobile player info strips balanced and flat in Bright School", () => {
    const mobileRoomCss = readCssWithImports(new URL("../styles/mobile-room.css", import.meta.url));
    const mobileAdaptiveCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const brightMobileCss = readCssWithImports(new URL("../styles/themes/bright-school/mobile.css", import.meta.url));
    const chainBadgeSource = readText(new URL("../shared/CharacterChainBadge.jsx", import.meta.url), "utf8");
    const portraitMedia = mediaBlock(mobileRoomCss, "@media (max-width: 760px) and (orientation: portrait), (max-width: 420px)");
    const brightPortraitMedia = mediaBlock(brightMobileCss, "@media (max-width: 760px) and (orientation: portrait)");

    expect(chainBadgeSource).toContain("return null");
    expect(chainBadgeSource).not.toContain("data-chain-count={count}");
    expect(portraitMedia).toContain("grid-template-columns: 48px minmax(0, 1fr) minmax(118px, 0.7fr)");
    expect(portraitMedia).toContain("grid-template-rows: minmax(0, 30px) minmax(0, 26px)");
    expect(portraitMedia).toContain(".mobile-room-screen .player-meta");
    expect(portraitMedia).toContain("grid-template-rows: minmax(0, 1fr)");
    expect(portraitMedia).toContain(".mobile-room-screen .name-button");
    expect(portraitMedia).toContain("grid-column: 1");
    expect(portraitMedia).toContain("font-size: 12.5px");
    expect(portraitMedia).toContain(".mobile-room-screen .color-badge");
    expect(portraitMedia).toContain("display: none");
    expect(portraitMedia).toContain("width: 46px");
    expect(portraitMedia).toContain("height: 46px");
    expect(portraitMedia).toContain(".mobile-room-screen .portrait-wrap .character-chain-badge");
    expect(portraitMedia).toContain("font-size: 0");
    expect(portraitMedia).toContain("content: attr(data-chain-count)");
    expect(portraitMedia).toContain("min-height: 30px");
    expect(mobileAdaptiveCss).toContain("grid-template-columns: 48px minmax(0, 1fr) minmax(118px, 0.7fr)");
    expect(brightPortraitMedia).toContain("grid-template-columns: 48px minmax(0, 1fr) minmax(118px, 0.7fr) !important");
    expect(brightPortraitMedia).toContain("grid-template-rows: minmax(0, 30px) minmax(0, 26px) !important");
    expect(brightPortraitMedia).toContain(".portrait-wrap .character-chain-badge");
    expect(brightPortraitMedia).toContain("font-size: 0 !important");
    expect(brightPortraitMedia).toContain("content: attr(data-chain-count)");
    expect(brightPortraitMedia).toContain("box-shadow: none !important");
    expect(brightPortraitMedia).not.toContain("box-shadow: 3px 4px 0 rgba(61, 43, 37, 0.48) !important");
    expect(mobileAdaptiveCss).toContain(".mobile-room-screen .timer .text-clock-value .timer-primary");
    expect(mobileAdaptiveCss).toContain("min-width: 3.2ch !important");
    expect(mobileAdaptiveCss).toContain("font-size: clamp(14px, 4vw, 16px) !important");
    expect(mobileAdaptiveCss).toContain(".mobile-room-screen .timer .text-clock-value .timer-periods");
    expect(mobileAdaptiveCss).toContain("font-size: clamp(9px, 2.8vw, 10px) !important");
  });

  it("centers mobile replay move counts without extra icon offset", () => {
    const mobileRoomCss = readCssWithImports(new URL("../styles/mobile-room.css", import.meta.url));
    const mobileAdaptiveCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const portraitMedia = mediaBlock(mobileRoomCss, "@media (max-width: 760px) and (orientation: portrait), (max-width: 420px)");

    expect(portraitMedia).toContain(".mobile-room-screen .replay-step-indicator");
    expect(portraitMedia).toContain("justify-content: center");
    expect(portraitMedia).toContain("text-align: center");
    expect(portraitMedia).toContain(".mobile-room-screen .replay-step-indicator svg");
    expect(portraitMedia).toContain("display: none");
    expect(mobileAdaptiveCss).toContain("#mobile-room-panel-actions .replay-step-indicator");
    expect(mobileAdaptiveCss).toContain("justify-content: center !important");
  });

  it("removes ordinary room chat entry points while keeping tutorial records readonly", () => {
    const chatSource = readText(new URL("./ChatBox.jsx", import.meta.url), "utf8");
    const battleSource = readText(new URL("./RoomBattleStage.jsx", import.meta.url), "utf8");
    const roomScreenSource = readText(new URL("./RoomScreen.jsx", import.meta.url), "utf8");
    const appRoutesSource = readText(new URL("../app/AppRoutes.jsx", import.meta.url), "utf8");
    const tutorialSource = readText(new URL("../tutorial/TutorialBattleScreen.jsx", import.meta.url), "utf8");
    const roomCss = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/component-repairs.css", import.meta.url));
    const chatCss = readText(new URL("../styles/room/chat-responsive.css", import.meta.url));
    const mobileShellCss = readText(new URL("../styles/mobile-room/base-shell-dock/shell-header-menu.css", import.meta.url));
    const finalPortraitShellCss = readText(new URL("../styles/mobile-adaptive/mobile-room-portrait/shell-header-menu.css", import.meta.url));
    const finalLandscapeCss = readText(new URL("../styles/mobile-adaptive/mobile-room-landscape.css", import.meta.url));
    const brightShellCss = readText(new URL("../styles/themes/bright-school/mobile/room/shell-header-menu/screen-shell.css", import.meta.url));
    const brightFinalChatCss = readText(new URL("../styles/mobile-adaptive/bright-school-portrait/mobile-room-chat.css", import.meta.url));

    expect(chatSource).toContain("chat-toggle-button");
    expect(chatSource).toContain("aria-expanded={isOpen}");
    expect(chatSource).toContain("aria-controls={panelId}");
    expect(chatSource).toContain("onFloatingLayerRequest");
    expect(chatSource).toContain("--room-floating-z");
    expect(chatSource).toContain("document.addEventListener(\"pointerdown\", handlePointerDown)");
    expect(chatSource).toContain("document.addEventListener(\"keydown\", handleKeyDown)");
    expect(chatSource).toContain("event.key === \"Escape\"");
    expect(chatSource).toContain("setIsOpen(false)");
    expect(chatSource).toContain("chat-box chat-embedded\" : \"chat-box chat-popover");
    expect(chatSource).toContain("!isEmbedded && (");
    expect(chatSource).toContain("label = \"对局聊天\"");
    expect(chatSource).toContain("aria-label={`关闭${label}`}");
    expect(roomScreenSource).not.toContain("onChat");
    expect(appRoutesSource).not.toContain("chat:send");
    expect(battleSource).toContain("showTutorialLog = false");
    expect(battleSource).toContain("const storyLogPanel = showTutorialLog && (");
    expect(battleSource).toContain("label=\"剧情记录\"");
    expect(battleSource).toContain("disabledInputMessage=\"剧情教学记录仅供查看\"");
    expect(battleSource).toContain("readonly");
    expect(tutorialSource).toContain("showTutorialLog");
    expect(battleSource).toContain("presentation={isMobileBattleLayout ? \"embedded\" : \"floating\"}");
    expect(chatSource).toContain("const trimmedText = text.trim()");
    expect(roomCss).toContain(".chat-widget");
    expect(roomCss).toContain(".chat-toggle-button");
    expect(roomCss).not.toContain(".mobile-room-screen .mobile-tab-panel .chat-toggle-button");
    expect(roomCss).toContain(".mobile-room-screen .mobile-tab-panel .chat-widget.embedded");
    expect(roomCss).toContain(".chat-popover");
    expect(roomCss).toContain("bottom: calc(100% + 10px)");
    expect(roomCss).toContain("transform-origin: right bottom");
    expect(roomCss).toContain("@keyframes chat-popover-open");
    expect(roomCss).toContain(".chat-widget.embedded");
    expect(roomCss).toContain(".chat-readonly-note");
    expect(chatCss).not.toContain("calc(7.25em + 44px)");
    expect(mobileShellCss).toContain("--mobile-room-dock-panel-height: clamp(82px, 16dvh, 132px)");
    expect(mobileShellCss).toContain("height: 100dvh");
    expect(mobileShellCss).toContain("overflow: hidden");
    expect(finalPortraitShellCss).toContain("--mobile-room-dock-panel-height: clamp(106px, 16dvh, 134px)");
    expect(finalPortraitShellCss).toContain("overflow: hidden");
    expect(finalLandscapeCss).toContain("--mobile-room-dock-panel-height: 58px");
    expect(finalLandscapeCss).toContain("overflow: hidden");
    expect(brightShellCss).toContain("--mobile-room-dock-panel-height: clamp(112px, 17dvh, 150px)");
    expect(brightShellCss).toContain("overflow: hidden !important");
    expect(brightFinalChatCss).toContain("overflow-y: hidden !important");
    expect(brightFinalChatCss).toContain("touch-action: none !important");
    expect(brightSchoolCss).toContain(".chat-toggle-button");
    expect(brightSchoolCss).toContain(".chat-popover");
  });

  it("anchors room member actions from the clicked point toward the upper right", () => {
    const peopleSource = readText(new URL("./RoomPeopleList.jsx", import.meta.url), "utf8");
    const roomCss = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const brightSchoolModalCss = readCssWithImports(new URL("../styles/themes/bright-school/qa-guard.css", import.meta.url));

    expect(peopleSource).toContain("openPersonMenu(person.id, event)");
    expect(peopleSource).toContain("event.clientX");
    expect(peopleSource).toContain("event.clientY");
    expect(peopleSource).toContain("onFloatingLayerRequest?.()");
    expect(peopleSource).toContain("--room-floating-z");
    expect(peopleSource).toContain("--room-person-popover-x");
    expect(peopleSource).toContain("--room-person-popover-y");
    expect(peopleSource).toContain("<button type=\"button\" disabled>密谈</button>");
    expect(roomCss).toContain("position: fixed");
    expect(roomCss).toContain("left: var(--room-person-popover-x)");
    expect(roomCss).toContain("top: var(--room-person-popover-y)");
    expect(roomCss).toContain("z-index: var(--room-floating-z, 140)");
    expect(roomCss).toContain("transform: translate(8px, calc(-100% - 8px))");
    expect(roomCss).toContain("linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(238, 247, 255, 0.86))");
    expect(roomCss).toContain("border: 1px solid rgba(126, 102, 144, 0.18)");
    expect(roomCss).toContain("backdrop-filter: blur(8px) saturate(1.05)");
    expect(roomCss).toContain(".room-person-popover button:disabled");
    expect(roomCss).toContain("background: linear-gradient(135deg, #ececef, #d9d9dd)");
    expect(brightSchoolModalCss).toContain(".room-person-popover");
    expect(brightSchoolModalCss).toContain("z-index: var(--room-floating-z, 140) !important");
    expect(brightSchoolModalCss).toContain("border: 3px solid #3d2b25 !important");
    expect(brightSchoolModalCss).toContain("var(--theme-paper-grid)");
    expect(brightSchoolModalCss).toContain("box-shadow: 3px 4px 0 rgba(61, 43, 37, 0.72)");
    expect(brightSchoolModalCss).toContain(".room-person-popover button:disabled");
    expect(brightSchoolModalCss).toContain("background: linear-gradient(135deg, #ececef, #d9d9dd) !important");
  });

  it("keeps result modal centered and compact", () => {
    const modalCss = readCssWithImports(new URL("../styles/modals.css", import.meta.url));
    const brightSchoolModalCss = readCssWithImports(new URL("../styles/themes/bright-school/qa-guard.css", import.meta.url));

    expect(modalCss).toContain(".modal-backdrop:has(.result-modal)");
    expect(modalCss).toContain("place-items: center");
    expect(modalCss).toContain("width: 50vw");
    expect(modalCss).toContain("height: 40vh");
    expect(brightSchoolModalCss).toContain("width: 50vw !important");
    expect(brightSchoolModalCss).toContain("height: 40vh !important");
  });

  it("applies the Startorch battlefield terminal skin after mobile room styles", () => {
    const stylesEntry = readText(new URL("../styles.css", import.meta.url), "utf8");
    const terminalCss = readCssWithImports(new URL("../styles/room-terminal.css", import.meta.url));
    const defensiveMedia = mediaBlock(terminalCss, "@media (max-width: 800px)");

    expect(stylesEntry.indexOf("./styles/mobile-room.css")).toBeLessThan(stylesEntry.indexOf("./styles/room-terminal.css"));
    expect(terminalCss).toContain("--battle-bg: #03070a");
    expect(terminalCss).toContain(".app-shell:has(.room-screen)");
    expect(terminalCss).toContain("radial-gradient(circle at 50% 42%");
    expect(terminalCss).toContain(".player-info.self");
    expect(terminalCss).toContain("--side-glow: var(--battle-cyan)");
    expect(terminalCss).toContain(".player-info.opponent");
    expect(terminalCss).toContain("--side-glow: var(--battle-red)");
    expect(terminalCss).toContain(".timer-track span");
    expect(terminalCss).not.toContain(`transition: ${"width"}`);
    expect(terminalCss).toContain("background-color 0.25s linear");
    expect(terminalCss).not.toMatch(/\.skill-detail-panel\s*\{[^}]*background:\s*rgba\(5,\s*17,\s*23,\s*0\.96\)/);
    expect(terminalCss).toContain(".board-stage");
    expect(terminalCss).toContain("2px solid rgba(0, 255, 190, 0.4)");
    expect(terminalCss).toContain(".action-bar button");
    expect(terminalCss).toContain("transform: skewX(-10deg)");
    expect(defensiveMedia).toContain(".mobile-room-screen .mobile-room-viewport");
    expect(defensiveMedia).toContain("grid-template-rows: 75px minmax(0, 1fr) 75px auto");
    expect(defensiveMedia).toContain(".mobile-room-screen .mobile-opponent-slot");
    expect(defensiveMedia).toContain("order: -1");
    expect(defensiveMedia).toContain(".mobile-room-screen .captures");
    expect(defensiveMedia).toContain("display: none");
    expect(defensiveMedia).toContain(".mobile-room-screen .board-stage");
    expect(defensiveMedia).toContain("max-width: 92vw");
    expect(defensiveMedia).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(defensiveMedia).toContain("transform: none");
  });

  it("keeps short landscape mobile rooms within the viewport after removing chat", () => {
    const css = readCssWithImports(new URL("../styles/mobile-room.css", import.meta.url));
    const shortLandscapeMedia = mediaBlock(css, "@media (max-width: 900px) and (orientation: landscape) and (max-height: 520px)");

    expect(shortLandscapeMedia).toContain(".mobile-room-screen");
    expect(shortLandscapeMedia).toContain("height: 100dvh");
    expect(shortLandscapeMedia).toContain("overflow: hidden");
    expect(shortLandscapeMedia).toContain(".mobile-room-screen .mobile-room-viewport");
    expect(shortLandscapeMedia).toContain("grid-template-areas:");
    expect(shortLandscapeMedia).toContain("\"opponent board self\"");
    expect(shortLandscapeMedia).toContain("\"dock dock dock\"");
    expect(shortLandscapeMedia).toContain(".mobile-room-screen .board-stage");
    expect(shortLandscapeMedia).toContain("calc(100dvh - 112px)");
    expect(shortLandscapeMedia).toContain(".mobile-room-screen .player-info");
    expect(shortLandscapeMedia).toContain("grid-template-areas: \"meta\" \"time\" \"captures\"");
  });

  it("keeps desktop room controls aligned and overlays above side controls", () => {
    const roomCss = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const modalCss = readCssWithImports(new URL("../styles/modals.css", import.meta.url));
    const brightRoomCss = readCssWithImports(new URL("../styles/themes/bright-school/room.css", import.meta.url));
    const battleSource = readText(new URL("./RoomBattleStage.jsx", import.meta.url));
    const modalBackdropZ = cssZIndexForSelector(modalCss, ".modal-backdrop");
    const floatingLayerBaseZ = Number(
      battleSource.match(/const ROOM_FLOATING_LAYER_BASE_Z = (\d+);/)?.[1]
    );
    const firstFloatingLayerZ = floatingLayerBaseZ + 1;

    expect(battleSource).not.toContain("chat-exit-action exit-action");
    expect(battleSource).not.toContain("layerCounterRef");
    expect(battleSource).toContain("bringFloatingLayerToFront");
    expect(battleSource).toContain("setFloatingLayers({ [layerId]: ROOM_FLOATING_LAYER_BASE_Z + 1 });");
    expect(battleSource).toContain("floatingLayerZ={floatingLayers[\"story-log\"]}");
    expect(battleSource).toContain("floatingLayerZ={floatingLayers.members}");
    expect(battleSource).toContain("<div className=\"room-side\">\n        {selfInfo}\n        {hintPanel}\n        {storyLogPanel}");
    expect(battleSource).not.toContain("{membersPanel}\n        {hintPanel}\n      </div>");
    expect(firstFloatingLayerZ).toBeGreaterThan(140);
    expect(firstFloatingLayerZ).toBeLessThan(modalBackdropZ);
    expect(modalBackdropZ).toBeGreaterThan(140);
    expect(roomCss).toContain(".desktop-room-screen .room-header");
    expect(roomCss).toContain("grid-template-columns: minmax(0, 1fr) auto auto");
    expect(roomCss).toContain(".desktop-room-screen .room-toggles");
    expect(roomCss).toContain("justify-self: end");
    expect(roomCss).toContain(".room-mobile-exit {\n  background: linear-gradient(135deg, #eaf8ff, #d5efff)");
    expect(roomCss).toContain("min-height: 34px");
    expect(roomCss).toContain(".skill-chip-wrap {\n  position: relative;\n  overflow: visible;\n  z-index: var(--room-floating-z, 60);");
    expect(roomCss).toContain(".skill-detail-panel");
    expect(roomCss).toContain("z-index: var(--room-floating-z, 80)");
    expect(roomCss).toContain("z-index: var(--room-floating-z, 20)");
    expect(roomCss).toContain("z-index: var(--room-floating-z, 24)");
    expect(roomCss).toContain("justify-content: center");
    expect(roomCss).toContain("text-align: center");

    expect(brightRoomCss).toContain(".desktop-room-screen .room-header");
    expect(brightRoomCss).toContain("grid-template-columns: minmax(0, 1fr) auto auto !important");
    expect(brightRoomCss).toContain("box-shadow: 3px 3px 0 #4a3736 !important");
    expect(brightRoomCss).toContain("background-image: linear-gradient(135deg, #eaf8ff, #d5efff) !important");
    expect(brightRoomCss).toContain("min-height: 36px !important");
    expect(brightRoomCss).toContain(".replay-step-indicator");
    expect(brightRoomCss).toContain("place-items: center !important");
    expect(brightRoomCss).toContain(".skill-detail-panel");
    expect(brightRoomCss).toContain("z-index: var(--room-floating-z, 80) !important");
  });

  it("lets tutorial battle hide utility tools and people panels while keeping the real room shell", () => {
    const headerSource = readText(new URL("./header/RoomHeader.jsx", import.meta.url));
    const battleSource = readText(new URL("./RoomBattleStage.jsx", import.meta.url));
    const tutorialSource = readText(new URL("../tutorial/TutorialBattleScreen.jsx", import.meta.url));

    expect(headerSource).toContain("showUtilityControls = true");
    expect(headerSource).toContain("{showUtilityControls && <div className=\"room-toggles\">");
    expect(headerSource).toContain("{showUtilityControls && <div className={`room-mobile-menu");
    expect(battleSource).toContain("showPeoplePanel = true");
    expect(battleSource).toContain("showPeoplePanel && !isReplay");
    expect(battleSource).toContain("showTutorialLog = false");
    expect(battleSource).toContain("compactMessages");
    expect(battleSource).toContain("membersPanel && { id: \"members\"");
    expect(tutorialSource).toContain("showUtilityControls={false}");
    expect(tutorialSource).toContain("showPeoplePanel={false}");
    expect(tutorialSource).toContain("showTutorialLog");
    expect(tutorialSource).not.toContain("onChat=");
  });
});

function readText(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

function mediaBlock(css, marker) {
  const blocks = [];
  let start = css.indexOf(marker);
  while (start >= 0) {
    const next = css.indexOf("\n@media", start + 1);
    blocks.push(css.slice(start, next >= 0 ? next : undefined));
    start = css.indexOf(marker, start + marker.length);
  }
  return blocks.join("\n");
}

function readCssWithImports(url, seen = new Set()) {
  const key = url.href;
  if (seen.has(key)) return "";
  seen.add(key);

  const css = readText(url, "utf8");
  return css.replace(/@import\s+"([^"]+)";/g, (_match, importPath) =>
    readCssWithImports(new URL(importPath, url), seen),
  );
}

function cssZIndexForSelector(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...css.matchAll(new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`, "g"))];
  const values = matches
    .map((match) => match[1].match(/z-index:\s*(\d+)/)?.[1])
    .filter(Boolean)
    .map(Number);
  return values.at(-1) ?? 0;
}
