import { describe, expect, test, vi } from "vitest";
import { chooseSigrikaDuelAction } from "./sigrikaDuelEngine.js";

describe("Sigrika duel engine fallback chain", () => {
  test("falls from advanced GNU Go to intermediate GNU Go in the same turn", async () => {
    const search = vi.fn()
      .mockResolvedValueOnce({ ok: false, reason: "unavailable" })
      .mockResolvedValueOnce({ ok: true, action: { type: "move", pointId: "4,4" } });
    const onFallback = vi.fn();

    const result = await chooseSigrikaDuelAction({
      view: {},
      botColor: "black",
      practiceEngine: { search },
      chooseHeuristicAction: vi.fn(),
      isLegalAction: (_view, _color, action) => action?.pointId === "4,4",
      onFallback
    });

    expect(result).toEqual({
      ok: true,
      action: { type: "move", pointId: "4,4" },
      difficultyId: "intermediate"
    });
    expect(search.mock.calls.map((call) => call[2].engine.level)).toEqual([10, 5]);
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith("advanced");
  });

  test("uses the beginner heuristic after both GNU Go levels fail", async () => {
    const heuristicAction = { type: "move", pointId: "3,3" };
    const chooseHeuristicAction = vi.fn(() => heuristicAction);

    const result = await chooseSigrikaDuelAction({
      view: {},
      botColor: "white",
      practiceEngine: { search: vi.fn(async () => ({ ok: false, reason: "timeout" })) },
      chooseHeuristicAction,
      isLegalAction: (_view, _color, action) => action === heuristicAction
    });

    expect(result).toMatchObject({ action: heuristicAction, difficultyId: "beginner" });
    expect(chooseHeuristicAction).toHaveBeenCalledTimes(1);
  });

  test("returns a safe pass if every engine result is unusable", async () => {
    const result = await chooseSigrikaDuelAction({
      view: {},
      botColor: "black",
      practiceEngine: { search: vi.fn(async () => ({ ok: true, action: null })) },
      chooseHeuristicAction: () => null,
      isLegalAction: () => false
    });

    expect(result).toEqual({ ok: true, action: { type: "pass" }, difficultyId: "safe-pass" });
  });
});
