import { describe, expect, it } from "vitest";
import { COLORS, createGameState, passMove, playMove } from "../src/shared/game.js";
import {
  buildKataGoPositionCommands,
  decodeZhiziSocketPayload,
  internalKomiToGtpKomi,
  kataCandidateToAction,
  parseKataAnalyzeLine
} from "./zhiziKataGoProtocol.js";

describe("Zhizi KataGo protocol", () => {
  it("decodes every documented Socket.IO stdout payload shape", () => {
    const bytes = new TextEncoder().encode("info move K10\n");
    expect(decodeZhiziSocketPayload("plain")).toBe("plain");
    expect(decodeZhiziSocketPayload(bytes)).toBe("info move K10\n");
    expect(decodeZhiziSocketPayload(bytes.buffer)).toBe("info move K10\n");
    expect(decodeZhiziSocketPayload({ data: bytes })).toBe("info move K10\n");
  });

  it("converts the project's stone-unit komi to GTP point komi", () => {
    expect(internalKomiToGtpKomi(2.75)).toBe(5.5);
    expect(internalKomiToGtpKomi(3.75)).toBe(7.5);
  });

  it("replays the complete ordinary move and pass history", () => {
    let game = createGameState([
      { userId: "black", color: COLORS.black },
      { userId: "white", color: COLORS.white }
    ]);
    game.komi = 2.75;
    game = playMove(game, COLORS.black, "3,3").state;
    game = passMove(game, COLORS.white).state;
    game = playMove(game, COLORS.black, "8,3").state;

    expect(buildKataGoPositionCommands(game)).toEqual({
      ok: true,
      size: 13,
      commands: [
        "boardsize 13",
        "kata-set-rules chinese",
        "komi 5.5",
        "clear_board",
        "play B D10",
        "play W pass",
        "play B J10"
      ]
    });
  });

  it("rejects Spark-only history instead of showing KataGo a false position", () => {
    const game = createGameState();
    game.history.push({ type: "skill", effectType: "row-slash" });
    expect(buildKataGoPositionCommands(game)).toEqual({
      ok: false,
      reason: "unsupported-history"
    });
  });

  it("parses concatenated candidates, root info, priors, and PVs", () => {
    const parsed = parseKataAnalyzeLine([
      "=5 info move K10 visits 802 winrate 0.6194 scoreLead 1.08 prior 0.08 order 0 pv K10 C3",
      "info move D10 visits 377 winrate 0.601 scoreLead 0.72 prior 0.15 order 1 pv D10 K4",
      "rootInfo visits 1300 winrate 0.61 scoreLead 0.91"
    ].join(" "));

    expect(parsed.candidates).toEqual([
      expect.objectContaining({ move: "K10", visits: 802, winrate: 0.6194, scoreLead: 1.08, prior: 0.08, order: 0, pv: ["K10", "C3"] }),
      expect.objectContaining({ move: "D10", visits: 377, order: 1, pv: ["D10", "K4"] })
    ]);
    expect(parsed.rootInfo).toMatchObject({ visits: 1300, winrate: 0.61, scoreLead: 0.91 });
  });

  it("maps candidates back to authoritative point actions and never accepts resign", () => {
    expect(kataCandidateToAction({ move: "J10" }, 13)).toEqual({ type: "move", pointId: "8,3" });
    expect(kataCandidateToAction({ move: "pass" }, 13)).toEqual({ type: "pass" });
    expect(kataCandidateToAction({ move: "resign" }, 13)).toBeNull();
    expect(kataCandidateToAction({ move: "I10" }, 13)).toBeNull();
  });
});
