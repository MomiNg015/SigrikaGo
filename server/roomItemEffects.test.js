import { describe, expect, it } from "vitest";
import { GAME_PHASES } from "../src/shared/game.js";
import { candyEffectData, prepareCandyEffectUpdates } from "./roomItemEffects.js";

describe("room item effects", () => {
  it("clears matching candy effects for valid finished games and updates room players", () => {
    const room = {
      game: {
        phase: GAME_PHASES.finished,
        winner: { winnerColor: "black" }
      },
      players: [
        {
          characterId: "sigrika",
          user: {
            id: "sigrika-user",
            itemEffects: { sigrikaCandyDisabled: true }
          }
        },
        {
          characterId: "denia",
          user: {
            id: "denia-user",
            itemEffects: { deniaRainbowGlow: true }
          }
        },
        {
          characterId: "aemeath",
          user: {
            id: "aemeath-user",
            itemEffects: { aemeathRainbowMove: true }
          }
        }
      ]
    };

    const updates = prepareCandyEffectUpdates(room);

    expect(updates).toHaveLength(3);
    expect(room.players[0].user.itemEffects).toEqual({});
    expect(room.players[1].user.itemEffects).toEqual({});
    expect(room.players[2].user.itemEffects).toEqual({});
    expect(candyEffectData(room.players[0], updates)).toEqual({ itemEffects: "{}" });
  });

  it("keeps Aemeath's rainbow move effect when another character completes the game", () => {
    const room = {
      game: {
        phase: GAME_PHASES.finished,
        winner: { winnerColor: "black" }
      },
      players: [{
        characterId: "denia",
        user: {
          id: "aemeath-user",
          itemEffects: { aemeathRainbowMove: true }
        }
      }]
    };

    expect(prepareCandyEffectUpdates(room)).toEqual([]);
    expect(room.players[0].user.itemEffects).toEqual({ aemeathRainbowMove: true });
  });

  it("does not clear candy effects for invalid games", () => {
    const room = {
      game: {
        phase: GAME_PHASES.finished,
        winner: { winnerColor: "black", invalid: true }
      },
      players: [
        {
          characterId: "denia",
          user: {
            id: "denia-user",
            itemEffects: { deniaRainbowGlow: true }
          }
        }
      ]
    };

    expect(prepareCandyEffectUpdates(room)).toEqual([]);
    expect(room.players[0].user.itemEffects).toEqual({ deniaRainbowGlow: true });
  });
});
