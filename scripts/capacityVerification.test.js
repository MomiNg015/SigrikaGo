import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { capacityProfile, evaluateThresholds, nextCapacityMove, percentile, summarizeLatency } from "./capacityVerification.mjs";
import { createGameState } from "../src/shared/game.js";
import { playMove } from "../src/shared/gameStoneActions.js";

describe("capacity verification", () => {
  it("defines the requested 2-core/2-GB target topology", () => {
    expect(capacityProfile("target")).toEqual({
      name: "target",
      actionMode: "layout",
      registrationConcurrency: 8,
      staggerActions: false,
      recycleAfterMoves: 0,
      httpReadsPerCycle: 0,
      sockets: 500,
      rooms: 100,
      spectatorsPerRoom: 2,
      durationMs: 120_000,
      actionIntervalMs: 7_500,
      reconnectRatio: 0.2
    });
  });

  it("supports idle-only topology and explicitly zero reconnects", () => {
    expect(capacityProfile("target", { rooms: 0, reconnectRatio: 0 })).toMatchObject({ rooms: 0, reconnectRatio: 0 });
    expect(() => capacityProfile("target", { actionMode: "bogus" })).toThrow("Unknown capacity action mode");
    expect(() => capacityProfile("target", { actionMode: "move", recycleAfterMoves: 10 })).toThrow("at least 20 moves");
  });

  it("does not pass when a client action or reconnect failed", () => {
    const result = evaluateThresholds({
      profile: { name: "target", rooms: 0 }, ackLatencies: [], restartResumeLatencies: [],
      errors: ["reconnect 1: timeout"], serverEnd: { capacity: { current: { activeRooms: 0 } } },
      serverPeak: { eventLoopDelayP95Ms: 10, rssBytes: 100_000_000 },
      serverSamples: [{ capacity: { process: {} }, runtimeStability: {} }]
    });
    expect(result.checks.ackP95Under200Ms).toBe(true);
    expect(result.passed).toBe(false);
  });

  it("requires the observed online topology even for idle-only load", () => {
    const common = {
      profile: { name: "target", sockets: 100, rooms: 0 }, ackLatencies: [], restartResumeLatencies: [], errors: [],
      serverPeak: { eventLoopDelayP95Ms: 20, rssBytes: 100_000_000 },
      serverSamples: [{ capacity: { process: {} }, runtimeStability: {} }]
    };
    expect(evaluateThresholds({ ...common, serverEnd: { capacity: { current: { onlineUsers: 100, activeRooms: 0 } } } }).passed).toBe(true);
    expect(evaluateThresholds({ ...common, serverEnd: { capacity: { current: { onlineUsers: 99, activeRooms: 0 } } } }).passed).toBe(false);
    expect(evaluateThresholds({ ...common, serverEnd: null }).passed).toBe(false);
  });

  it("does not pass a requested lifecycle before at least one audited settlement per room", () => {
    const common = {
      profile: { name: "target", sockets: 4, rooms: 1, recycleAfterMoves: 20 },
      ackLatencies: [10], restartResumeLatencies: [], errors: [],
      serverEnd: { capacity: { current: { onlineUsers: 4, activeRooms: 1 } } },
      serverPeak: { eventLoopDelayP95Ms: 20, rssBytes: 100_000_000 },
      serverSamples: [{ capacity: { process: {} }, runtimeStability: {} }]
    };
    expect(evaluateThresholds({ ...common, completedGames: 0 }).passed).toBe(false);
    expect(evaluateThresholds({ ...common, completedGames: 1 }).passed).toBe(true);
  });

  it("selects legal alternating moves without mutating the received board", () => {
    let game = createGameState([], { mode: "standard" });
    game.phase = "playing";
    for (let i = 0; i < 80; i += 1) {
      const before = JSON.stringify(game);
      const action = nextCapacityMove(game);
      expect(action?.type).toBe("move");
      expect(JSON.stringify(game)).toBe(before);
      const result = playMove(game, game.turn, action.pointId);
      expect(result.ok).toBe(true);
      game = result.state;
    }
  });

  it("keeps target event-loop acceptance stricter than the local smoke diagnostic", () => {
    const common = {
      ackLatencies: [20],
      restartResumeLatencies: [100],
      errors: [],
      serverEnd: null,
      serverPeak: { eventLoopDelayP95Ms: 100, rssBytes: 200_000_000 },
      serverSamples: [{ capacity: { process: {} }, runtimeStability: {} }]
    };

    expect(evaluateThresholds({ ...common, profile: { name: "smoke" } }).passed).toBe(true);
    expect(evaluateThresholds({ ...common, profile: { name: "target" } }).passed).toBe(false);
    expect(evaluateThresholds({ ...common, profile: { name: "target" } }).limits.eventLoopDelayP95Ms).toBe(50);
  });

  it("rejects profiles that cannot provide two players per room", () => {
    expect(() => capacityProfile("smoke", { sockets: 9, rooms: 5 })).toThrow(
      "at least 10 sockets"
    );
  });

  it("reports stable nearest-rank latency percentiles", () => {
    expect(percentile([40, 10, 30, 20, 50], 0.95)).toBe(50);
    expect(summarizeLatency([10, 20, 30])).toEqual({
      count: 3,
      minMs: 10,
      averageMs: 20,
      p95Ms: 30,
      p99Ms: 30,
      maxMs: 30
    });
  });

  it("wires the isolated capacity server, report command, and restart path", () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"));
    const runner = fs.readFileSync(path.resolve("scripts/verify-capacity.mjs"), "utf8");
    const server = fs.readFileSync(path.resolve("scripts/start-capacity-server.mjs"), "utf8");

    expect(pkg.scripts["verify:capacity"]).toBe("node scripts/verify-capacity.mjs");
    expect(runner).toContain("preparePlaywrightTestDatabase");
    expect(runner).toContain("restartServer");
    expect(server).toContain('process.env.NODE_ENV = "capacity"');
    expect(server).toContain('process.env.ENABLE_TEST_ACTIONS = "true"');
  });
});
