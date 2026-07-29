import { describe, expect, it } from "vitest";
import {
  PRACTICE_DIFFICULTY_OPTIONS,
  practiceCaptureResignThreshold,
  practiceDifficulty,
  requestedPracticeDifficulty
} from "./practiceMode.js";

describe("practice mode difficulty contract", () => {
  it("publishes exactly three 22-capture difficulty levels", () => {
    expect(PRACTICE_DIFFICULTY_OPTIONS.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: "beginner", label: "入门" },
      { id: "intermediate", label: "中级" },
      { id: "advanced", label: "高级" }
    ]);
    expect(PRACTICE_DIFFICULTY_OPTIONS.every((difficulty) => (
      difficulty.captureResignThreshold === 22
    ))).toBe(true);
  });

  it("accepts only public levels for new requests while retaining the basic restore alias", () => {
    expect(requestedPracticeDifficulty("beginner")).toMatchObject({
      strategy: "gnugo",
      engine: { name: "gnugo", level: 1 }
    });
    expect(requestedPracticeDifficulty("intermediate")).toMatchObject({
      strategy: "gnugo",
      engine: { name: "gnugo", level: 5 }
    });
    expect(requestedPracticeDifficulty("advanced")).toMatchObject({
      strategy: "gnugo",
      engine: {
        name: "gnugo",
        level: 10,
        timeoutMs: 5000,
        cacheSizeMb: 8
      }
    });
    expect(requestedPracticeDifficulty("basic")).toBeNull();
    expect(practiceDifficulty("basic")).toMatchObject({
      id: "basic",
      strategy: "gnugo",
      engine: { level: 1 },
      legacy: true
    });
  });

  it("uses explicit new-room thresholds without changing old beginner saves", () => {
    expect(practiceCaptureResignThreshold({
      difficulty: "beginner",
      captureResignThreshold: 22
    })).toBe(22);
    expect(practiceCaptureResignThreshold({ difficulty: "beginner" })).toBe(11);
    expect(practiceCaptureResignThreshold({ difficulty: "basic" })).toBe(22);
  });
});
