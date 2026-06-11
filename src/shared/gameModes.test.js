import { describe, expect, it } from "vitest";
import {
  GAME_MODE_IDS,
  GAME_MODES,
  gameModeById,
  normalizeGameModeId,
  modeOrderedEntries
} from "./gameModes.js";

describe("game modes", () => {
  it("defines star mode before standard mode with shared rule metadata", () => {
    expect(GAME_MODE_IDS).toEqual(["spark", "standard"]);
    expect(modeOrderedEntries().map((mode) => mode.id)).toEqual(["spark", "standard"]);
    expect(GAME_MODES.spark).toMatchObject({
      id: "spark",
      title: "星炬对弈",
      boardSize: 13,
      komi: 2.75,
      skillEnabled: true
    });
    expect(GAME_MODES.standard).toMatchObject({
      id: "standard",
      title: "标准对弈",
      boardSize: 19,
      komi: 3.75,
      skillEnabled: false
    });
  });

  it("normalizes unknown mode ids to star mode for legacy records", () => {
    expect(normalizeGameModeId("standard")).toBe("standard");
    expect(normalizeGameModeId("spark")).toBe("spark");
    expect(normalizeGameModeId("")).toBe("spark");
    expect(normalizeGameModeId(null)).toBe("spark");
    expect(gameModeById("missing")).toBe(GAME_MODES.spark);
  });
});
