import { describe, expect, test } from "vitest";
import { COLORS } from "../src/shared/game.js";
import {
  arePlayersDisconnected,
  hasConnectedRoomParticipant,
  onlineParticipantCount,
  roomParticipants,
  watchPlayerSummary
} from "./roomPresence.js";

function testRoom() {
  return {
    players: [
      {
        socketId: "black-socket",
        disconnectedAt: null,
        color: COLORS.black,
        user: { id: "black-user" },
        characterId: "sigrika",
        character: { id: "sigrika" }
      },
      {
        socketId: null,
        disconnectedAt: 1234,
        color: COLORS.white,
        user: { id: "white-user" },
        characterId: "denia",
        character: null
      }
    ],
    spectators: [
      { socketId: "spectator-socket", user: { id: "spectator-user" } },
      { socketId: null, user: { id: "offline-spectator" } }
    ]
  };
}

describe("roomPresence", () => {
  test("lists players then spectators", () => {
    expect(roomParticipants(testRoom()).map((participant) => participant.user.id)).toEqual([
      "black-user",
      "white-user",
      "spectator-user",
      "offline-spectator"
    ]);
  });

  test("counts connected players and spectators", () => {
    expect(onlineParticipantCount(testRoom())).toBe(2);
    expect(hasConnectedRoomParticipant(testRoom())).toBe(true);
    expect(hasConnectedRoomParticipant({ players: [{ socketId: null }], spectators: [] })).toBe(false);
  });

  test("detects active rooms with all players disconnected", () => {
    expect(arePlayersDisconnected(testRoom())).toBe(false);
    expect(arePlayersDisconnected({
      players: [{ socketId: null }, { socketId: null }],
      spectators: [{ socketId: "spectator-socket" }]
    })).toBe(true);
    expect(arePlayersDisconnected({ players: [], spectators: [] })).toBe(false);
  });

  test("builds watch summaries for a player color", () => {
    expect(watchPlayerSummary(testRoom(), COLORS.white)).toEqual({
      user: { id: "white-user" },
      characterId: "denia",
      character: null,
      connected: false,
      disconnectedAt: 1234
    });
    expect(watchPlayerSummary(testRoom(), "missing")).toBeNull();
  });
});
