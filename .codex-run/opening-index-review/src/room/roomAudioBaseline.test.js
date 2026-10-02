import { describe, expect, it } from "vitest";
import { buildRoomAudioBaseline, shouldSeedRoomAudioBaseline } from "./roomAudioBaseline.js";

describe("room audio baseline", () => {
  it("captures the current room audio state so reconnect does not replay old events", () => {
    const baseline = buildRoomAudioBaseline({
      __audioResumeBaseline: true,
      game: {
        history: [
          { type: "move", id: "3,3", moveNumber: 1 },
          { type: "skill", id: "4,4", moveNumber: 2, captures: ["4,5"] }
        ],
        points: [
          { id: "4,4", hiddenHand: { exposed: true } },
          { id: "5,5", hiddenHand: { exposed: true } }
        ]
      },
      players: [
        { color: "black", time: { main: 0, periods: 2, periodRemaining: 8 } },
        { color: "white", time: { main: 120, periods: 3, periodRemaining: 30 } }
      ],
      chat: [
        { id: "chat-1", kind: "game-start" }
      ]
    });

    expect(baseline.boardSoundKey).toBe("skill-2-4,4");
    expect(baseline.hiddenRevealKey).toBe("4,4|5,5");
    expect(baseline.voiceState).toMatchObject({
      "black-main": 0,
      "black-periods": 2,
      "black-2-2-8": true,
      "white-main": 120,
      "white-periods": 3
    });
    expect(baseline.systemVoiceState).toEqual({ gameStart: "chat-1" });
  });

  it("only seeds baseline for resumed live rooms", () => {
    expect(shouldSeedRoomAudioBaseline({ __audioResumeBaseline: true, game: { phase: "playing" } })).toBe(true);
    expect(shouldSeedRoomAudioBaseline({ game: { phase: "playing" } })).toBe(false);
    expect(shouldSeedRoomAudioBaseline({ __audioResumeBaseline: true, game: { phase: "finished" } })).toBe(false);
  });
});
