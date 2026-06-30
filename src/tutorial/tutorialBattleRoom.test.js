import { describe, expect, it } from "vitest";
import { CHARACTERS } from "../shared/characters.js";
import { COLORS, createGameState } from "../shared/game.js";
import { createTutorialBattleRoom, tutorialPlayersForSetup } from "./tutorialBattleRoom.js";

describe("tutorial battle room helpers", () => {
  it("builds a player side without rank, portrait character, or skill when setup selects no character", () => {
    const players = tutorialPlayersForSetup({
      playerColor: COLORS.white,
      playerCharacterId: "",
      npcCharacterId: "denia",
      npcName: "Denia"
    }, { id: "user-1", username: "moming", rank: "9段", rating: 1800 }, CHARACTERS);

    expect(players[0]).toMatchObject({
      color: COLORS.white,
      characterId: "",
      character: null,
      user: {
        id: "user-1",
        username: "moming",
        rank: "",
        rating: ""
      }
    });
    expect(players[1]).toMatchObject({
      color: COLORS.black,
      characterId: "denia",
      user: { username: "Denia" }
    });
  });

  it("syncs captures and skill removals from the local tutorial game into the room snapshot", () => {
    const players = tutorialPlayersForSetup({ npcCharacterId: "denia" }, { id: "user-1", username: "moming" }, CHARACTERS);
    const game = createGameState(players);
    game.captures.black = 2;
    game.skillRemovals.white = 1;

    const room = createTutorialBattleRoom({ game, players });

    expect(room.role).toBe("player");
    expect(room.players.find((player) => player.color === COLORS.black).captures).toBe(2);
    expect(room.players.find((player) => player.color === COLORS.white).skillRemovals).toBe(1);
  });
});
