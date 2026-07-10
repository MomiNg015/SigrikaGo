import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { capacityProfile, percentile, summarizeLatency } from "./capacityVerification.mjs";

describe("capacity verification", () => {
  it("defines the requested 2-core/2-GB target topology", () => {
    expect(capacityProfile("target")).toEqual({
      sockets: 500,
      rooms: 100,
      spectatorsPerRoom: 2,
      durationMs: 120_000,
      actionIntervalMs: 7_500,
      reconnectRatio: 0.2
    });
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
