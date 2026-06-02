import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { effectiveRoomRole, roomCloseCountdownText, roomGameInfoForPlayers, shouldPlayGameStartVoice, shouldShowRoomCloseCountdown } from "./RoomScreen.jsx";

describe("RoomScreen helpers", () => {
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

  it("seeds resumed room audio baseline before passive room audio effects", () => {
    const source = readFileSync(new URL("./RoomScreen.jsx", import.meta.url), "utf8");

    expect(source).toContain("useLayoutEffect");
    expect(source).toContain("shouldSeedRoomAudioBaseline(room)");
    expect(source.indexOf("shouldSeedRoomAudioBaseline(room)")).toBeLessThan(source.indexOf("playSystemVoice(SYSTEM_VOICE_EVENTS.gameStart"));
  });

  it("keeps the board primary while preserving player portraits on mobile", () => {
    const css = readFileSync(new URL("../styles/mobile-room.css", import.meta.url), "utf8");
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
    expect(landscapeMedia).toContain("grid-template-columns: minmax(96px, 0.52fr) minmax(220px, 1.36fr) minmax(96px, 0.52fr)");
    expect(landscapeMedia).toContain("min(100%, calc(100dvh - 132px), calc(100vw - 232px))");
  });

  it("uses extra-compact portrait room cards without pushing the board offscreen", () => {
    const css = readFileSync(new URL("../styles/mobile-room.css", import.meta.url), "utf8");
    const source = readFileSync(new URL("./RoomScreen.jsx", import.meta.url), "utf8");
    const playerInfoSource = readFileSync(new URL("./PlayerInfo.jsx", import.meta.url), "utf8");
    const portraitMedia = mediaBlock(css, "@media (max-width: 760px) and (orientation: portrait), (max-width: 420px)");

    expect(source).toContain("className=\"room-title-stack\"");
    expect(source).toContain("className=\"mobile-room-viewport mobile-battle-layout\"");
    expect(source).toContain("className=\"mobile-board-viewport mobile-board-slot board-column\"");
    expect(source).toContain("className=\"mobile-room-dock mobile-room-tabs\"");
    expect(source).toContain("className=\"mobile-action-panel\"");
    expect(source).not.toContain("content: <>{hintPanel}{actionPanel}</>");
    expect(portraitMedia).toContain(".mobile-room-screen .player-info");
    expect(portraitMedia).toContain("min-height: 56px");
    expect(portraitMedia).toContain("overflow: visible");
    expect(portraitMedia).toContain("grid-template-areas:");
    expect(portraitMedia).toContain("\"portrait meta time\"");
    expect(portraitMedia).toContain("\"captures captures skill\"");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-player-slot");
    expect(portraitMedia).toContain(".mobile-room-screen .portrait-wrap");
    expect(portraitMedia).toContain("align-self: center");
    expect(playerInfoSource).not.toContain("viewpoint-button");
    expect(playerInfoSource).toContain("onClick={canSwitchView ? () => onViewColor?.(player.color) : undefined}");
    expect(playerInfoSource).toContain("aria-pressed={canSwitchView ? viewColor === player.color : undefined}");
    expect(portraitMedia).not.toContain(".mobile-room-screen .viewpoint-button");
    expect(portraitMedia).toContain(".mobile-room-screen .room-toggles .toggle");
    expect(portraitMedia).toContain("width: 44px");
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
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-tab-button");
    expect(portraitMedia).toContain("min-height: 44px");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-tab-panel .action-bar button");
    expect(portraitMedia).toContain(".mobile-room-screen .color-badge");
    expect(portraitMedia).toContain("width: 12px");
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
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-tab-panel .action-bar .action-label");
    expect(portraitMedia).toContain(".mobile-room-screen .mobile-tab-panel .skill-action");
    expect(portraitMedia).toContain("min-width: 0");
    expect(portraitMedia).toContain("grid-column: 2");
    expect(portraitMedia).toContain(".mobile-room-screen .result-badge");
    expect(portraitMedia).toContain("width: 18px");
    expect(portraitMedia).toContain("right: 1px");
    expect(portraitMedia).toContain("bottom: 1px");
    expect(portraitMedia).toContain(".mobile-room-screen .decision-bar.result-review-decision");
    expect(portraitMedia).toContain("max-height: var(--mobile-room-dock-panel-height)");
  });

  it("keeps touch point confirmation visual-only on mobile", () => {
    const source = readFileSync(new URL("./RoomScreen.jsx", import.meta.url), "utf8");
    const roomCss = readFileSync(new URL("../styles/room.css", import.meta.url), "utf8");

    expect(source).not.toContain("touch-confirm-hint");
    expect(roomCss).toContain(".touch-confirm-marker");
  });

  it("keeps extra-narrow portrait rooms from overlapping the player cards", () => {
    const css = readFileSync(new URL("../styles/mobile-room.css", import.meta.url), "utf8");
    const narrowPortraitMedia = mediaBlock(css, "@media (max-width: 340px) and (orientation: portrait)");

    expect(narrowPortraitMedia).toContain(".mobile-room-screen");
    expect(narrowPortraitMedia).toContain("--mobile-room-board-size");
    expect(narrowPortraitMedia).toContain("calc(100dvh - 370px)");
  });

  it("separates desktop and mobile room layout shells", () => {
    const source = readFileSync(new URL("./RoomScreen.jsx", import.meta.url), "utf8");
    const stylesEntry = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    const css = readFileSync(new URL("../styles/room.css", import.meta.url), "utf8")
      + readFileSync(new URL("../styles/mobile-room.css", import.meta.url), "utf8");

    expect(source).toContain("useMobileRoomLayout");
    expect(source).toContain("function DesktopRoomLayout");
    expect(source).toContain("function MobileRoomLayout");
    expect(source).toContain("desktop-room-screen");
    expect(source).toContain("mobile-room-screen");
    expect(source).toContain("mobile-room-viewport");
    expect(source).toContain("mobile-battle-layout");
    expect(stylesEntry.indexOf("./styles/responsive.css")).toBeLessThan(stylesEntry.indexOf("./styles/mobile-room.css"));
    expect(css).toContain(".mobile-battle-layout");
    expect(css).toContain("grid-area: board");
  });

  it("collapses low-priority mobile room tools into a shared tab dock", () => {
    const source = readFileSync(new URL("./RoomScreen.jsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../styles/room.css", import.meta.url), "utf8")
      + readFileSync(new URL("../styles/mobile-room.css", import.meta.url), "utf8");

    expect(source).toContain("activeMobilePanel");
    expect(source).toContain("mobile-room-dock");
    expect(source).toContain("mobile-room-tabs");
    expect(source).toContain("mobile-tab-list");
    expect(source).toContain("mobile-tab-panel");
    expect(source).toContain("actionPanel");
    expect(source).toContain("membersPanel");
    expect(source).toContain("chatPanel");
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

  it("keeps short landscape mobile rooms within the viewport", () => {
    const css = readFileSync(new URL("../styles/mobile-room.css", import.meta.url), "utf8");
    const shortLandscapeMedia = mediaBlock(css, "@media (max-width: 900px) and (orientation: landscape) and (max-height: 520px)");

    expect(shortLandscapeMedia).toContain(".mobile-room-screen");
    expect(shortLandscapeMedia).toContain("height: 100dvh");
    expect(shortLandscapeMedia).toContain("overflow: hidden");
    expect(shortLandscapeMedia).toContain(".mobile-room-screen .mobile-room-viewport");
    expect(shortLandscapeMedia).toContain("grid-template-areas:");
    expect(shortLandscapeMedia).toContain("\"opponent board self\"");
    expect(shortLandscapeMedia).toContain("\"dock dock dock\"");
    expect(shortLandscapeMedia).toContain(".mobile-room-screen .board-stage");
    expect(shortLandscapeMedia).toContain("calc(100dvh - 170px)");
    expect(shortLandscapeMedia).toContain(".mobile-room-screen .player-info");
    expect(shortLandscapeMedia).toContain("grid-template-areas: \"meta\" \"portrait\" \"time\" \"captures\" \"skill\"");
  });
});

function mediaBlock(css, marker) {
  const start = css.indexOf(marker);
  if (start < 0) return "";
  const next = css.indexOf("\n@media", start + 1);
  return css.slice(start, next >= 0 ? next : undefined);
}
