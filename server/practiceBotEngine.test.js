import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  COLORS,
  NEUTRAL_STONES,
  createGameState,
  gameViewForColor,
  getPoint
} from "../src/shared/game.js";
import { PRACTICE_DIFFICULTIES } from "../src/shared/practiceMode.js";
import {
  createPracticeBotEngine,
  gtpVertexToPointId,
  legalPracticeGtpVertices,
  pointIdToGtpVertex,
  runPracticeEngineProcess,
  serializePracticePositionToSgf
} from "./practiceBotEngine.js";

describe("GNU Go practice engine adapter", () => {
  it("serializes only the bot-visible black and white position", () => {
    const game = createGameState([
      { userId: "bot", color: COLORS.black },
      { userId: "human", color: COLORS.white }
    ]);
    getPoint(game, "0,0").stone = COLORS.black;
    getPoint(game, "12,12").stone = COLORS.white;
    getPoint(game, "6,6").stone = NEUTRAL_STONES.spray;
    const hidden = getPoint(game, "3,3");
    hidden.stone = COLORS.white;
    hidden.hiddenHand = { owner: COLORS.white, exposed: false, effect: "hidden-hand" };

    const sgf = serializePracticePositionToSgf(
      gameViewForColor(game, COLORS.black),
      COLORS.black
    );

    expect(sgf).toContain("SZ[13]");
    expect(sgf).toContain("KM[2.75]");
    expect(sgf).toContain("PL[B]");
    expect(sgf).toContain("AB[aa]");
    expect(sgf).toContain("AW[mm]");
    expect(sgf).not.toContain("[dd]");
    expect(sgf).not.toContain("[gg]");
  });

  it("maps coordinates while skipping the GTP I column", () => {
    expect(pointIdToGtpVertex("7,3", 13)).toBe("H10");
    expect(pointIdToGtpVertex("8,3", 13)).toBe("J10");
    expect(gtpVertexToPointId("J10", 13)).toBe("8,3");
    expect(gtpVertexToPointId("I10", 13)).toBeNull();
  });

  it("gives GNU Go only points that Spark currently considers legal", () => {
    const game = createGameState([
      { userId: "bot", color: COLORS.black },
      { userId: "human", color: COLORS.white }
    ]);
    getPoint(game, "0,0").stone = COLORS.white;
    getPoint(game, "2,0").protocolBan = { bannedColor: COLORS.black };
    getPoint(game, "3,0").valid = false;
    game.ko = "1,0";

    const vertices = legalPracticeGtpVertices(game, COLORS.black);

    expect(vertices).not.toContain("A13");
    expect(vertices).not.toContain("B13");
    expect(vertices).not.toContain("C13");
    expect(vertices).not.toContain("D13");
    expect(vertices).toContain("E13");
  });

  it.each([
    ["beginner", 1],
    ["intermediate", 5],
    ["advanced", 10]
  ])("uses GNU Go %s level %i", async (difficultyId, level) => {
    let loadedSgf = "";
    const runProcess = vi.fn(async ({ args, input }) => {
      expect(args).toContain("--never-resign");
      expect(args.slice(args.indexOf("--level"), args.indexOf("--level") + 2)).toEqual([
        "--level",
        String(level)
      ]);
      const sgfPath = /^1 loadsgf (.+)$/m.exec(input)?.[1];
      loadedSgf = await readFile(sgfPath, "utf8");
      expect(input).toContain("2 restricted_genmove black");
      return { stdout: "=1 black\n\n=2 D10\n\n=3\n\n", stderr: "" };
    });
    const engine = createPracticeBotEngine({
      enginePath: "fake-gnugo",
      runProcess
    });
    const game = createGameState([
      { userId: "bot", color: COLORS.black },
      { userId: "human", color: COLORS.white }
    ]);

    const result = await engine.search(
      game,
      COLORS.black,
      PRACTICE_DIFFICULTIES[difficultyId]
    );

    expect(result).toEqual({
      ok: true,
      action: { type: "move", pointId: "3,3" },
      engine: { name: "GNU Go", level }
    });
    expect(loadedSgf).toContain("SZ[13]");
  });

  it("keeps one engine process active and rejects concurrent searches as busy", async () => {
    let resolveProcess;
    const runProcess = vi.fn(() => new Promise((resolve) => {
      resolveProcess = resolve;
    }));
    const engine = createPracticeBotEngine({
      enginePath: "fake-gnugo",
      runProcess
    });
    const game = createGameState([
      { userId: "bot", color: COLORS.black },
      { userId: "human", color: COLORS.white }
    ]);

    const first = engine.search(game, COLORS.black, PRACTICE_DIFFICULTIES.beginner);
    await expect(
      engine.search(game, COLORS.black, PRACTICE_DIFFICULTIES.advanced)
    ).resolves.toEqual({ ok: false, reason: "busy" });
    await vi.waitFor(() => {
      expect(runProcess).toHaveBeenCalledTimes(1);
    });
    resolveProcess({ stdout: "=1 black\n\n=2 D10\n\n=3\n\n", stderr: "" });
    await expect(first).resolves.toMatchObject({ ok: true });
    expect(runProcess).toHaveBeenCalledTimes(1);
  });

  it("probes and caches the configured executable before room creation", async () => {
    const runProcess = vi.fn().mockResolvedValue({
      stdout: "GNU Go 3.8\n",
      stderr: ""
    });
    const engine = createPracticeBotEngine({
      enginePath: "fake-gnugo",
      runProcess
    });

    await expect(engine.ensureAvailable()).resolves.toMatchObject({
      ok: true,
      name: "GNU Go",
      version: "GNU Go 3.8"
    });
    await engine.ensureAvailable();

    expect(runProcess).toHaveBeenCalledTimes(1);
    expect(runProcess).toHaveBeenCalledWith(expect.objectContaining({
      command: "fake-gnugo",
      args: ["--version"]
    }));
  });

  it("returns an explicit failure instead of falling back to a homemade move", async () => {
    const engine = createPracticeBotEngine({
      enginePath: "missing-gnugo",
      runProcess: vi.fn().mockRejectedValue(Object.assign(new Error("missing"), {
        code: "ENOENT"
      }))
    });
    const game = createGameState([
      { userId: "bot", color: COLORS.black },
      { userId: "human", color: COLORS.white }
    ]);

    await expect(
      engine.search(game, COLORS.black, PRACTICE_DIFFICULTIES.beginner)
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
  });

  it("maps a killed GNU Go process to a retryable timeout result", async () => {
    const engine = createPracticeBotEngine({
      enginePath: "slow-gnugo",
      runProcess: vi.fn().mockRejectedValue(Object.assign(new Error("slow"), {
        code: "ENGINE_TIMEOUT"
      }))
    });
    const game = createGameState([
      { userId: "bot", color: COLORS.black },
      { userId: "human", color: COLORS.white }
    ]);

    await expect(
      engine.search(game, COLORS.black, PRACTICE_DIFFICULTIES.advanced)
    ).resolves.toEqual({ ok: false, reason: "timeout" });
  });

  it("runs the real child-process boundary without a shell", async () => {
    const result = await runPracticeEngineProcess({
      command: process.execPath,
      args: ["-e", "process.stdin.resume();process.stdin.on('end',()=>process.stdout.write('=2 D10\\n\\n'))"],
      input: "test\n",
      timeoutMs: 1000
    });

    expect(result.stdout).toBe("=2 D10\n\n");
  });

  it("kills and reaps a child that exceeds its hard timeout", async () => {
    await expect(runPracticeEngineProcess({
      command: process.execPath,
      args: ["-e", "setTimeout(()=>{},5000)"],
      timeoutMs: 100
    })).rejects.toMatchObject({ code: "ENGINE_TIMEOUT" });
  });
});
