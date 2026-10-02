import { describe, expect, it } from "vitest";
import { recruitmentReadyDelayMs, recruitmentReadyFromTask } from "./useRecruitmentReadyState.js";

describe("recruitment ready state", () => {
  it("derives ready badge state from task status", () => {
    expect(recruitmentReadyFromTask({ status: "ready" })).toBe(true);
    expect(recruitmentReadyFromTask({ status: "pending" })).toBe(false);
    expect(recruitmentReadyFromTask(null)).toBe(false);
  });

  it("schedules a refresh at readyAt with a small settlement buffer", () => {
    expect(recruitmentReadyDelayMs({ readyAt: "2026-06-23T12:00:05.000Z" }, Date.parse("2026-06-23T12:00:00.000Z"))).toBe(5400);
    expect(recruitmentReadyDelayMs({ readyAt: "bad-date" }, Date.parse("2026-06-23T12:00:00.000Z"))).toBe(400);
  });
});
