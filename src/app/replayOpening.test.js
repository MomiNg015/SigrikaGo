import { describe, expect, it } from "vitest";
import { replayOpeningState } from "./replayOpening.js";

describe("replay opening state", () => {
  it("uses the record snapshot as the room and starts at the latest history step", () => {
    const snapshot = {
      code: "12345",
      game: {
        history: [{ move: 1 }, { move: 2 }]
      }
    };

    expect(replayOpeningState({ record: { snapshot } })).toEqual({
      room: snapshot,
      replayStep: 2,
      pendingSkill: false,
      view: "room"
    });
  });

  it("treats missing history as an empty replay", () => {
    const snapshot = { code: "67890", game: {} };

    expect(replayOpeningState({ record: { snapshot } })).toMatchObject({
      room: snapshot,
      replayStep: 0
    });
  });
});
