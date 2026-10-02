import { describe, expect, it, vi } from "vitest";
import { COLORS, GAME_PHASES, createGameState, createScoringState, getPoint } from "../src/shared/game.js";
import { applyScoringAction } from "./roomScoringFlow.js";

function scoringRoom(matchSource) {
  const game = createGameState([
    { userId: "human", color: COLORS.black },
    { userId: "other", color: COLORS.white }
  ]);
  game.phase = GAME_PHASES.markingDead;
  game.scoring = createScoringState();
  getPoint(game, "3,3").stone = COLORS.white;
  return { matchSource, game };
}

function apply(room) {
  return applyScoringAction({
    room,
    player: { color: COLORS.black, user: { id: "human", username: "player" } },
    userId: "human",
    action: { type: "mark-dead", pointId: "3,3" },
    appendSystem: vi.fn(),
    appendNotices: vi.fn(),
    broadcastToast: vi.fn(),
    scheduleResultReviewTimeout: vi.fn(),
    scheduleRoomClose: vi.fn(),
    io: {}
  });
}

describe("practice scoring corrections", () => {
  it("lets the human correct either color in a practice room", () => {
    const room = scoringRoom("practice");
    expect(apply(room).ok).toBe(true);
    expect(room.game.scoring.deadStones).toContain("3,3");
  });

  it("keeps the ordinary own-color restriction outside practice", () => {
    expect(apply(scoringRoom("matchmaking"))).toMatchObject({ ok: false, error: "只能标记自己颜色的死子" });
  });
});
