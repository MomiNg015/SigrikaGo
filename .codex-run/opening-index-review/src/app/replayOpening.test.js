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

    expect(replayOpeningState({ record: { snapshot } })).toMatchObject({
      room: {
        code: "12345",
        game: {
          history: [{ move: 1 }, { move: 2 }],
          phase: "finished"
        }
      },
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

  it("hydrates replay snapshots with the record result for portrait badges", () => {
    const snapshot = {
      code: "13579",
      game: {
        history: [{ move: 1 }]
      }
    };

    expect(replayOpeningState({
      record: {
        snapshot,
        winnerColor: "white",
        resultText: "白中盘胜"
      }
    }).room.game).toMatchObject({
      phase: "finished",
      winner: {
        winnerColor: "white",
        text: "白中盘胜"
      }
    });
  });
});
