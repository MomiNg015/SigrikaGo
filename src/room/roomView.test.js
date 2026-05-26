import { describe, expect, test } from "vitest";
import {
  buildBoardLines,
  coordLabel,
  formatClock,
  roomPeople,
  signedStoneTerm,
  stoneDecorationsForRoom
} from "./roomView.js";
import { COLORS } from "../shared/game.js";

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

  test("marks first-line board segments as edge lines", () => {
    const points = Array.from({ length: 13 * 13 }, (_, index) => {
      const x = index % 13;
      const y = Math.floor(index / 13);
      return { id: `${x},${y}`, x, y, valid: true };
    });

    const lines = buildBoardLines(points);
    const edgeLines = lines.filter((line) => line.edge);

    expect(lines).toHaveLength(312);
    expect(edgeLines).toHaveLength(48);
    expect(lines.find((line) => line.key === "0,0-h")?.edge).toBe(true);
    expect(lines.find((line) => line.key === "0,0-v")?.edge).toBe(true);
    expect(lines.find((line) => line.key === "6,6-h")?.edge).toBe(false);
  });
});
