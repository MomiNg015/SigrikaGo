import { describe, expect, test } from "vitest";
import {
  buildBoardLines,
  coordLabel,
  formatClock,
  replayRoomAt,
  roomPeople,
  signedStoneTerm,
  stoneDecorationsForRoom
} from "./roomView.js";
import { COLORS, GAME_PHASES, createGameState, pointId } from "../shared/game.js";

describe("roomView helpers", () => {
  test("formats room members from players and spectators", () => {
    const room = {
      players: [
        {
          color: COLORS.black,
          user: { id: "user-black", username: "black-player", rank: "9段", rating: 2020 }
        },
        {
          color: COLORS.white,
          user: { id: "user-white", username: "white-player", rank: "3段", rating: 1160 }
        }
      ],
      spectators: [
        { user: { id: "watcher", username: "watcher-name", rank: "1级", rating: 850 } }
      ]
    };

    expect(roomPeople(room)).toEqual([
      {
        id: "player-black-user-black",
        userId: "user-black",
        role: "player",
        color: COLORS.black,
        username: "black-player",
        rank: "9段",
        rating: 2020
      },
      {
        id: "player-white-user-white",
        userId: "user-white",
        role: "player",
        color: COLORS.white,
        username: "white-player",
        rank: "3段",
        rating: 1160
      },
      {
        id: "spectator-watcher",
        userId: "watcher",
        role: "spectator",
        color: null,
        username: "watcher-name",
        rank: "1级",
        rating: 850
      }
    ]);
  });

  test("collects each player's selected stone decoration by color", () => {
    const room = {
      players: [
        { color: COLORS.black, user: { selectedStoneDecoration: "paw-stone" } },
        { color: COLORS.white, user: {} }
      ]
    };

    expect(stoneDecorationsForRoom(room)).toEqual({
      black: "paw-stone",
      white: ""
    });
  });

  test("formats board labels and timer text", () => {
    expect(coordLabel(0, 0)).toBe("A13");
    expect(coordLabel(8, 12)).toBe("J1");
    expect(formatClock(181)).toBe("3:01");
  });

  test("formats signed scoring terms as fractions", () => {
    expect(signedStoneTerm(-2.75, "贴目")).toBe("- 贴目 2又3/4");
    expect(signedStoneTerm(1.5, "对方超频")).toBe("+ 对方超频 1又1/2");
    expect(signedStoneTerm(0, "己方超频")).toBe("+ 己方超频 0");
  });

  test("draws continuous board lines and marks first-line lines as edges", () => {
    const points = Array.from({ length: 13 * 13 }, (_, index) => {
      const x = index % 13;
      const y = Math.floor(index / 13);
      return { id: `${x},${y}`, x, y, valid: true };
    });

    const lines = buildBoardLines(points);
    const edgeLines = lines.filter((line) => line.edge);

    expect(lines).toHaveLength(26);
    expect(edgeLines).toHaveLength(4);
    expect(lines.find((line) => line.key === "row-0-0-12")?.edge).toBe(true);
    expect(lines.find((line) => line.key === "col-0-0-12")?.edge).toBe(true);
    expect(lines.find((line) => line.key === "row-6-0-12")?.edge).toBe(false);
  });

  test("breaks board lines only around invalid intersections", () => {
    const points = Array.from({ length: 13 * 13 }, (_, index) => {
      const x = index % 13;
      const y = Math.floor(index / 13);
      return { id: `${x},${y}`, x, y, valid: !(x === 6 && y === 6) };
    });

    const lines = buildBoardLines(points);

    expect(lines.map((line) => line.key)).toContain("row-6-0-5");
    expect(lines.map((line) => line.key)).toContain("row-6-7-12");
    expect(lines.map((line) => line.key)).toContain("col-6-0-5");
    expect(lines.map((line) => line.key)).toContain("col-6-7-12");
    expect(lines.map((line) => line.key)).not.toContain("row-6-0-12");
    expect(lines.map((line) => line.key)).not.toContain("col-6-0-12");
  });

  test("opens replay snapshots that do not contain chat history", () => {
    const players = [
      { color: COLORS.black, user: { id: "black", username: "black", rank: "1段", rating: 1000 } },
      { color: COLORS.white, user: { id: "white", username: "white", rank: "1段", rating: 1000 } }
    ];
    const room = {
      code: "12345",
      role: "player",
      players,
      game: createGameState(players)
    };

    expect(replayRoomAt(room, 0)).toMatchObject({
      role: "spectator",
      chat: []
    });
  });

  test("keeps finished replay winner metadata while replaying moves", () => {
    const room = {
      players: [
        { color: COLORS.black, user: { id: "black" } },
        { color: COLORS.white, user: { id: "white" } }
      ],
      game: {
        ...createGameState([
          { color: COLORS.black },
          { color: COLORS.white }
        ]),
        phase: GAME_PHASES.finished,
        winner: { winnerColor: COLORS.white, text: "白中盘胜" },
        history: [
          { type: "move", color: COLORS.black, id: pointId(3, 3) }
        ]
      }
    };

    expect(replayRoomAt(room, 1).game).toMatchObject({
      phase: GAME_PHASES.finished,
      winner: { winnerColor: COLORS.white, text: "白中盘胜" }
    });
  });
});
