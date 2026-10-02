import { describe, expect, test } from "vitest";
import { pointId } from "../src/shared/game.js";
import { validateActionPoint } from "./roomActionValidation.js";

describe("roomActionValidation", () => {
  test("allows actions without point targets", () => {
    expect(validateActionPoint({ type: "pass" }, 13)).toBeNull();
  });

  test("allows valid board point targets", () => {
    expect(validateActionPoint({ type: "move", pointId: pointId(3, 3) }, 13)).toBeNull();
  });

  test("returns validation errors for invalid board point targets", () => {
    expect(validateActionPoint({ type: "move", pointId: "z-99" }, 13)).toBe("棋盘点位无效");
  });

  test("rejects missing or non-object actions", () => {
    expect(validateActionPoint(null, 13)).toBe("未知操作");
    expect(validateActionPoint("move", 13)).toBe("未知操作");
  });
});
