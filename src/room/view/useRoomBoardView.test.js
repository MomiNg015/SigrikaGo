import { describe, expect, it } from "vitest";
import { COLORS } from "../../shared/game.js";
import { liveSpectatorGameForColor } from "./useRoomBoardView.js";

describe("live spectator room views", () => {
  it("uses the canonical game field for the black perspective", () => {
    const blackGame = { id: "black" };
    const room = { game: blackGame, gameViews: { white: { id: "white" } } };

    expect(liveSpectatorGameForColor(room, COLORS.black)).toBe(blackGame);
  });

  it("uses the alternate white view and falls back for legacy partial payloads", () => {
    const blackGame = { id: "black" };
    const whiteGame = { id: "white" };

    expect(liveSpectatorGameForColor({
      game: blackGame,
      gameViews: { white: whiteGame }
    }, COLORS.white)).toBe(whiteGame);
    expect(liveSpectatorGameForColor({ game: blackGame }, COLORS.white)).toBe(blackGame);
  });
});
