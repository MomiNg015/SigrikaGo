import { describe, expect, it } from "vitest";
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
});
