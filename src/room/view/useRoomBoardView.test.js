import { describe, expect, it } from "vitest";
import { COLORS } from "../../shared/game.js";
import { liveSpectatorGameForColor, roomViewStatusFor } from "./useRoomBoardView.js";

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

describe("room view status", () => {
  it("labels record replay with its active viewpoint", () => {
    expect(roomViewStatusFor({
      isReplay: true,
      isLiveSpectator: false,
      boardStep: 4,
      liveStep: 12,
      viewColor: COLORS.white
    })).toEqual({
      controlMode: "replay",
      isFollowingLive: false,
      kind: "replay",
      label: "棋谱回放 · 白方视角"
    });
  });

  it("distinguishes live watching from spectator history", () => {
    expect(roomViewStatusFor({
      isReplay: false,
      isLiveSpectator: true,
      boardStep: 12,
      liveStep: 12,
      viewColor: COLORS.black
    })).toMatchObject({
      controlMode: "spectator",
      isFollowingLive: true,
      kind: "spectator-live",
      label: "实时观战 · 黑方视角"
    });
    expect(roomViewStatusFor({
      isReplay: false,
      isLiveSpectator: true,
      boardStep: 7,
      liveStep: 12,
      viewColor: COLORS.white
    })).toMatchObject({
      controlMode: "spectator",
      isFollowingLive: false,
      kind: "spectator-history",
      label: "观战回看 · 白方视角"
    });
  });

  it("omits the status for active players", () => {
    expect(roomViewStatusFor({
      isReplay: false,
      isLiveSpectator: false,
      boardStep: null,
      liveStep: 12,
      viewColor: COLORS.black
    })).toBeNull();
  });
});
