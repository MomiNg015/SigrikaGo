import { afterEach, describe, expect, test } from "vitest";
import { COLORS, pointId } from "../src/shared/game.js";
import { handleGameAction, joinMatchmaking, leaveMatchmaking } from "./rooms.js";

function fakeIo() {
  return {
    messages: [],
    to(socketId) {
      return {
        emit: (event, payload) => {
          this.messages.push({ socketId, event, payload });
        }
      };
    }
  };
}

function user(id, selectedCharacter, characterConfig = null) {
  return {
    id,
    username: id,
    role: "player",
    status: "active",
    rank: "Rookie",
    rating: 1000,
    wins: 0,
    losses: 0,
    coins: 0,
    selectedCharacter,
    characterConfig,
    ownedCharacters: [selectedCharacter],
    ownedItems: [],
    ownedDecorations: []
  };
}

describe("rooms character integration", () => {
  afterEach(() => {
    leaveMatchmaking("alice");
    leaveMatchmaking("bob");
    leaveMatchmaking("cleanup");
  });

  test("uses room player character config for skill handling and notices", () => {
    const characterConfig = {
      id: "sigrika",
      name: "Admin Sigrika",
      portrait: "/custom.png",
      palette: "#123456",
      skill: {
        id: "custom-erase",
        effectType: "erase-point",
        name: "Admin Rune",
        uses: 1,
        description: "Custom admin skill",
        systemMessage: "{color}{player}发动{character}的{skill}，目标{point}",
        freeTurn: true,
        targetRule: "empty-point",
        params: {}
      }
    };
    const io = fakeIo();
    joinMatchmaking({ user: user("alice", "sigrika", characterConfig), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("bob", "sigrika", characterConfig), socketId: "socket-b" }, io);
    clearInterval(room.timerId);

    const black = room.players.find((player) => player.color === COLORS.black);
    const result = handleGameAction(room.code, black.user.id, { type: "skill", pointId: pointId(3, 3) }, io);

    expect(result.ok).toBe(true);
    expect(black.character).toEqual(black.user.characterConfig);
    expect(room.game.history.at(-1).skill).toBe(black.character.skill.name);
    expect(room.chat.at(-1)).toMatchObject({ kind: "skill" });
    expect(room.chat.at(-1).text).toContain(black.character.name);
    expect(room.chat.at(-1).text).toContain(black.character.skill.name);
    expect(room.chat.at(-1).text).toContain("目标D-10");
  });
});
