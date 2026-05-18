import { describe, expect, it } from "vitest";
import { BOARD_SOUND_TYPES, boardSoundActionAtStep, latestBoardSoundAction } from "./boardAudio.js";

describe("board audio helpers", () => {
  it("uses the stone sound for normal moves", () => {
    expect(latestBoardSoundAction([
      { type: "move", color: "black", id: "4,4", captures: [], moveNumber: 1 }
    ])).toMatchObject({
      key: "move-1-4,4",
      sound: BOARD_SOUND_TYPES.stone
    });
  });

  it("uses the capture sound when the latest board action captures stones", () => {
    expect(latestBoardSoundAction([
      { type: "move", color: "black", id: "4,4", captures: [], moveNumber: 1 },
      { type: "move", color: "white", id: "5,4", captures: ["4,4"], moveNumber: 2 }
    ])).toMatchObject({
      key: "move-2-5,4",
      sound: BOARD_SOUND_TYPES.capture
    });
  });

  it("does not replay the previous stone sound when the replay step is a pass", () => {
    expect(boardSoundActionAtStep([
      { type: "move", color: "black", id: "4,4", captures: [], moveNumber: 1 },
      { type: "pass", color: "white", moveNumber: 2 }
    ], 2)).toBeNull();
  });
});
