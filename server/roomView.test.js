import { describe, expect, it } from "vitest";
import { COLORS, GAME_PHASES, createGameState, getPoint, pointId } from "../src/shared/game.js";
import { buildRoomView } from "./roomView.js";

function testPlayer(id, color) {
  return {
    user: { id, username: id, rank: "1段" },
    socketId: `socket-${id}`,
    disconnectedAt: null,
    color,
    characterId: "sigrika",
    character: null,
    time: { main: 300, byoYomi: 30, periods: 3 }
  };
}

function testRoom() {
  const players = [testPlayer("black-user", COLORS.black), testPlayer("white-user", COLORS.white)];
  const game = createGameState(players.map((player) => ({
    userId: player.user.id,
    color: player.color,
    characterId: player.characterId,
    character: player.character
  })));
  game.captures.black = 2;
  game.skillRemovals.white = 1;
  const hiddenPoint = getPoint(game, pointId(3, 3));
  hiddenPoint.stone = COLORS.black;
  hiddenPoint.hiddenHand = { owner: COLORS.black, exposed: false, effect: "hidden-hand" };

  return {
    code: "12345",
    players,
    spectators: [{ user: { id: "spectator", username: "spectator" } }],
    game,
    chat: [],
    openingEndsAt: null,
    closesAt: null,
    countingDeadline: null,
    drawDeadline: null
  };
}

describe("room view serialization", () => {
  it("returns the player-specific board view and player counters", () => {
    const view = buildRoomView(testRoom(), "white-user");

    expect(view.role).toBe("player");
    expect(view.gameViews).toBeNull();
    expect(getPoint(view.game, pointId(3, 3)).stone).toBeNull();
    expect(view.players.find((player) => player.color === COLORS.black).captures).toBe(2);
    expect(view.players.find((player) => player.color === COLORS.white).skillRemovals).toBe(1);
  });

  it("includes player connection state", () => {
    const room = testRoom();
    room.players[1].socketId = null;
    room.players[1].disconnectedAt = 12345;

    const view = buildRoomView(room, "black-user");
    const black = view.players.find((player) => player.color === COLORS.black);
    const white = view.players.find((player) => player.color === COLORS.white);

    expect(black).toMatchObject({ connected: true, disconnectedAt: null });
    expect(white).toMatchObject({ connected: false, disconnectedAt: 12345 });
  });

  it("includes both color views for spectators", () => {
    const view = buildRoomView(testRoom(), "spectator");

    expect(view.role).toBe("spectator");
    expect(view.gameViews.black).toBeTruthy();
    expect(view.gameViews.white).toBeTruthy();
    expect(getPoint(view.gameViews.black, pointId(3, 3)).stone).toBe(COLORS.black);
    expect(getPoint(view.gameViews.white, pointId(3, 3)).stone).toBeNull();
  });

  it("treats finished room players as spectator viewers", () => {
    const room = testRoom();
    room.game.phase = GAME_PHASES.finished;
    const view = buildRoomView(room, "white-user");

    expect(view.role).toBe("spectator");
    expect(view.gameViews.black).toBeTruthy();
    expect(view.gameViews.white).toBeTruthy();
  });

  it("builds only the needed color view for players", () => {
    const calls = [];
    buildRoomView(testRoom(), "white-user", {
      gameView: (game, color) => {
        calls.push(color);
        return game;
      }
    });

    expect(calls).toEqual([COLORS.white]);
  });

  it("builds both color views once for spectators", () => {
    const calls = [];
    buildRoomView(testRoom(), "spectator", {
      gameView: (game, color) => {
        calls.push(color);
        return game;
      }
    });

    expect(calls).toEqual([COLORS.black, COLORS.white]);
  });
});
