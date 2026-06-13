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
      onChat: () => {},
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
      onChat: () => {},
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

    expect(source).toContain("function requestPassConfirm()");
    expect(source).toContain("onConfirm: () => onGameAction({ type: \"pass\" })");
    expect(source).toContain("是否弃一手");
    expect(battleSource).toContain("onPass={onPass}");
    expect(battleSource).not.toContain("onPass={() => onGameAction({ type: \"pass\" })}");
  });

  it("seeds resumed room audio baseline before passive room audio effects", () => {
    const source = readText(new URL("./audio/useRoomAudioEffects.js", import.meta.url), "utf8");

    expect(source).toContain("useLayoutEffect");
    expect(source).toContain("shouldSeedRoomAudioBaseline(room)");
    expect(source.indexOf("shouldSeedRoomAudioBaseline(room)")).toBeLessThan(source.indexOf("playSystemVoice(SYSTEM_VOICE_EVENTS.gameStart"));
  });

  it("keeps the board primary while preserving player portraits on mobile", () => {
    const css = readText(new URL("../styles/mobile-room.css", import.meta.url), "utf8");
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
    expect(compactMedia).toContain("display: none");
    expect(compactMedia).toContain(".mobile-room-screen .mobile-tab-list .mobile-tab-button");
    expect(landscapeMedia).toContain("\"opponent board self\"");
    expect(landscapeMedia).toContain("\"dock dock dock\"");
    expect(landscapeMedia).toContain("grid-template-columns: minmax(128px, 0.72fr) minmax(280px, 1.4fr) minmax(128px, 0.72fr)");
    expect(landscapeMedia).toContain("min(54dvw, calc(100dvh - 112px), 330px)");
  });

  it("uses extra-compact portrait room cards without pushing the board offscreen", () => {
    const css = readText(new URL("../styles/mobile-room.css", import.meta.url), "utf8");
    const roomCss = readText(new URL("../styles/room.css", import.meta.url), "utf8");
    const source = readText(new URL("./RoomScreen.jsx", import.meta.url), "utf8");
    const headerSource = readText(new URL("./header/RoomHeader.jsx", import.meta.url), "utf8");
    const battleSource = readText(new URL("./RoomBattleStage.jsx", import.meta.url), "utf8");
    const playerInfoSource = readText(new URL("./PlayerInfo.jsx", import.meta.url), "utf8");
    const portraitMedia = mediaBlock(css, "@media (max-width: 760px) and (orientation: portrait), (max-width: 420px)");

    expect(headerSource).toContain("className=\"room-title-stack\"");
    expect(headerSource).toContain("DoorOpen");
    expect(headerSource).toContain("room-mobile-exit");
    expect(source).toContain("onBack={requestExitConfirm}");
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
    expect(playerInfoSource).not.toContain("viewpoint-button");
    expect(playerInfoSource).toContain("onClick={canSwitchView ? () => onViewColor?.(player.color) : undefined}");
    expect(playerInfoSource).toContain("aria-pressed={canSwitchView ? viewColor === player.color : undefined}");
    expect(portraitMedia).not.toContain(".mobile-room-screen .viewpoint-button");
    expect(portraitMedia).toContain(".mobile-room-screen .room-toggles");
    expect(portraitMedia).toContain("display: none");
    expect(portraitMedia).toContain(".mobile-room-screen .room-mobile-exit");
    expect(portraitMedia).toContain(".mobile-room-screen .room-mobile-menu");
    expect(portraitMedia).toContain("z-index: 4");
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
    const roomCss = readText(new URL("../styles/room.css", import.meta.url), "utf8");

    expect(source).not.toContain("touch-confirm-hint");
    expect(roomCss).toContain(".touch-confirm-marker");
  });

  it("keeps mobile dead-stone decisions compact and readable", () => {
    const mobileRoomCss = readText(new URL("../styles/mobile-room.css", import.meta.url), "utf8");
    const brightMobileCss = readText(new URL("../styles/themes/bright-school/mobile.css", import.meta.url), "utf8");
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
    const css = readText(new URL("../styles/mobile-room.css", import.meta.url), "utf8");
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
    const css = readText(new URL("../styles/room.css", import.meta.url), "utf8")
      + readText(new URL("../styles/mobile-room.css", import.meta.url), "utf8");

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

  it("collapses low-priority mobile room tools into a shared tab dock", () => {
    const battleSource = readText(new URL("./RoomBattleStage.jsx", import.meta.url), "utf8");
    const css = readText(new URL("../styles/room.css", import.meta.url), "utf8")
      + readText(new URL("../styles/mobile-room.css", import.meta.url), "utf8");

    expect(battleSource).toContain("activeMobilePanel");
    expect(battleSource).toContain("mobile-room-dock");
    expect(battleSource).toContain("mobile-room-tabs");
    expect(battleSource).toContain("mobile-tab-list");
    expect(battleSource).toContain("mobile-tab-panel");
    expect(battleSource).toContain("actionPanel");
    expect(battleSource).toContain("membersPanel");
    expect(battleSource).toContain("chatPanel");
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
    const mobileRoomCss = readText(new URL("../styles/mobile-room.css", import.meta.url), "utf8");
    const mobileAdaptiveCss = readText(new URL("../styles/mobile-adaptive.css", import.meta.url), "utf8");
    const brightMobileCss = readText(new URL("../styles/themes/bright-school/mobile.css", import.meta.url), "utf8");
    const brightRoomCss = readText(new URL("../styles/themes/bright-school/room.css", import.meta.url), "utf8");
    const portraitMedia = mediaBlock(brightMobileCss, "@media (max-width: 760px) and (orientation: portrait)");
    const landscapeMedia = mediaBlock(mobileRoomCss, "@media (max-width: 900px) and (orientation: landscape)");

    expect(actionSource).toContain("mobile-action-button-label");
    expect(battleSource).toContain("aria-label={panel.label}");
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
    expect(mobileRoomCss).toContain(".captures span");
    expect(mobileRoomCss).toContain(".timer-track span");
    expect(mobileRoomCss).toContain(".action-bar button");
    expect(mobileRoomCss).toContain("text-shadow: none");
    expect(mobileAdaptiveCss).toContain(".room-mobile-menu-panel button");
    expect(mobileAdaptiveCss).toContain(".replay-bar button");
    expect(mobileAdaptiveCss).toContain(".timer-track span");
    expect(mobileAdaptiveCss).toContain(".mobile-room-screen .room-mobile-menu.open");
    expect(mobileAdaptiveCss).toContain(".mobile-tab-panel:has(.chat-widget.open)");
    expect(mobileAdaptiveCss).toContain(".mobile-room-screen .chat-popover");
    expect(mobileAdaptiveCss).toContain(".mobile-room-screen .captures span,\n  .app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .mobile-room-screen .digital-timer");
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
    expect(brightMobileCss).toContain(".captures span");
    expect(brightMobileCss).toContain(".timer-track span");
    expect(brightMobileCss).toContain(".chat-toggle-button");
    expect(brightMobileCss).toContain(".chat-exit-action");
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
    const mobileRoomCss = readText(new URL("../styles/mobile-room.css", import.meta.url), "utf8");
    const mobileAdaptiveCss = readText(new URL("../styles/mobile-adaptive.css", import.meta.url), "utf8");
    const brightMobileCss = readText(new URL("../styles/themes/bright-school/mobile.css", import.meta.url), "utf8");
    const portraitMedia = mediaBlock(mobileRoomCss, "@media (max-width: 760px) and (orientation: portrait), (max-width: 420px)");
    const brightPortraitMedia = mediaBlock(brightMobileCss, "@media (max-width: 760px) and (orientation: portrait)");

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
    expect(portraitMedia).toContain("min-height: 30px");
    expect(mobileAdaptiveCss).toContain("grid-template-columns: 48px minmax(0, 1fr) minmax(118px, 0.7fr)");
    expect(brightPortraitMedia).toContain("grid-template-columns: 48px minmax(0, 1fr) minmax(118px, 0.7fr) !important");
    expect(brightPortraitMedia).toContain("grid-template-rows: minmax(0, 30px) minmax(0, 26px) !important");
    expect(brightPortraitMedia).toContain("box-shadow: none !important");
    expect(brightPortraitMedia).not.toContain("box-shadow: 3px 4px 0 rgba(61, 43, 37, 0.48) !important");
  });

  it("centers mobile replay move counts without extra icon offset", () => {
    const mobileRoomCss = readText(new URL("../styles/mobile-room.css", import.meta.url), "utf8");
    const mobileAdaptiveCss = readText(new URL("../styles/mobile-adaptive.css", import.meta.url), "utf8");
    const portraitMedia = mediaBlock(mobileRoomCss, "@media (max-width: 760px) and (orientation: portrait), (max-width: 420px)");

    expect(portraitMedia).toContain(".mobile-room-screen .replay-step-indicator");
    expect(portraitMedia).toContain("justify-content: center");
    expect(portraitMedia).toContain("text-align: center");
    expect(portraitMedia).toContain(".mobile-room-screen .replay-step-indicator svg");
    expect(portraitMedia).toContain("display: none");
    expect(mobileAdaptiveCss).toContain("#mobile-room-panel-actions .replay-step-indicator");
    expect(mobileAdaptiveCss).toContain("justify-content: center !important");
  });

  it("turns room chat into an anchored popover button", () => {
    const chatSource = readText(new URL("./ChatBox.jsx", import.meta.url), "utf8");
    const roomCss = readText(new URL("../styles/room.css", import.meta.url), "utf8");
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/component-repairs.css", import.meta.url));

    expect(chatSource).toContain("chat-toggle-button");
    expect(chatSource).toContain("aria-expanded={isOpen}");
    expect(chatSource).toContain("aria-controls={panelId}");
    expect(chatSource).toContain("onFloatingLayerRequest");
    expect(chatSource).toContain("--room-floating-z");
    expect(chatSource).toContain("document.addEventListener(\"pointerdown\", handlePointerDown)");
    expect(chatSource).toContain("document.addEventListener(\"keydown\", handleKeyDown)");
    expect(chatSource).toContain("event.key === \"Escape\"");
    expect(chatSource).toContain("setIsOpen(false)");
    expect(chatSource).toContain("className=\"chat-box chat-popover\"");
    expect(chatSource).toContain("const trimmedText = text.trim()");
    expect(roomCss).toContain(".chat-widget");
    expect(roomCss).toContain(".chat-toggle-button");
    expect(roomCss).toContain(".mobile-room-screen .mobile-tab-panel .chat-toggle-button");
    expect(roomCss).toContain("margin-left: auto");
    expect(roomCss).toContain(".chat-popover");
    expect(roomCss).toContain("bottom: calc(100% + 10px)");
    expect(roomCss).toContain("transform-origin: right bottom");
    expect(roomCss).toContain("@keyframes chat-popover-open");
    expect(brightSchoolCss).toContain(".chat-toggle-button");
    expect(brightSchoolCss).toContain(".chat-popover");
  });

  it("anchors room member actions from the clicked point toward the upper right", () => {
    const peopleSource = readText(new URL("./RoomPeopleList.jsx", import.meta.url), "utf8");
    const roomCss = readText(new URL("../styles/room.css", import.meta.url), "utf8");
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
    const modalCss = readText(new URL("../styles/modals.css", import.meta.url), "utf8");
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
    const terminalCss = readText(new URL("../styles/room-terminal.css", import.meta.url), "utf8");
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
    expect(terminalCss).toContain("transition: width 0.25s linear");
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

  it("keeps short landscape mobile rooms within the viewport", () => {
    const css = readText(new URL("../styles/mobile-room.css", import.meta.url), "utf8");
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
    const roomCss = readText(new URL("../styles/room.css", import.meta.url));
    const brightRoomCss = readText(new URL("../styles/themes/bright-school/room.css", import.meta.url));
    const battleSource = readText(new URL("./RoomBattleStage.jsx", import.meta.url));

    expect(battleSource).not.toContain("chat-exit-action exit-action");
    expect(battleSource).toContain("bringFloatingLayerToFront");
    expect(battleSource).toContain("floatingLayerZ={floatingLayers.chat}");
    expect(battleSource).toContain("floatingLayerZ={floatingLayers.members}");
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
});

function readText(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

function mediaBlock(css, marker) {
  const start = css.indexOf(marker);
  if (start < 0) return "";
  const next = css.indexOf("\n@media", start + 1);
  return css.slice(start, next >= 0 ? next : undefined);
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
