import { describe, expect, it } from "vitest";
import {
  GAME_MODE_IDS,
  GAME_MODES,
  gameModeById,
  normalizeGameModeId,
  modeOrderedEntries
} from "./gameModes.js";

describe("game modes", () => {
  it("defines star, standard, and gomoku modes with shared rule metadata", () => {
    expect(GAME_MODE_IDS).toEqual(["spark", "standard", "gomoku"]);
    expect(modeOrderedEntries().map((mode) => mode.id)).toEqual(["spark", "standard", "gomoku"]);
    expect(GAME_MODES.spark).toMatchObject({
      id: "spark",
      englishLabel: "SIGRIKAGO MODE",
      iconUrl: "/assets/match-modes/mode-spark.png",
      boardSize: 13,
      komi: 2.75,
      skillEnabled: true
    });
    expect(GAME_MODES.standard).toMatchObject({
      id: "standard",
      englishLabel: "STANDARD MODE",
      iconUrl: "/assets/match-modes/mode-standard.png",
      boardSize: 19,
      komi: 3.75,
      skillEnabled: false
    });
    expect(GAME_MODES.gomoku).toMatchObject({
      id: "gomoku",
      title: "来下五子棋吗？",
      shortTitle: "五子棋",
      englishLabel: "GOMOKU MODE",
      iconUrl: "/assets/match-modes/mode-gomoku.png",
      boardSize: 13,
      skillEnabled: false,
      family: "gomoku"
    });
  });

  it("normalizes unknown mode ids to star mode for legacy records", () => {
    expect(normalizeGameModeId("standard")).toBe("standard");
    expect(normalizeGameModeId("gomoku")).toBe("gomoku");
    expect(normalizeGameModeId("spark")).toBe("spark");
    expect(normalizeGameModeId("")).toBe("spark");
    expect(normalizeGameModeId(null)).toBe("spark");
    expect(gameModeById("missing")).toBe(GAME_MODES.spark);
  });
});
