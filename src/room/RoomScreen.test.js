import { describe, expect, it } from "vitest";
import { roomGameInfoForPlayers } from "./RoomScreen.jsx";

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
});
