import { describe, expect, it } from "vitest";
import { classNames } from "./classNames.js";

describe("classNames", () => {
  it("joins string, array, and conditional class values", () => {
    expect(classNames("base", ["nested", false, ["deep"]], { active: true, hidden: false })).toBe(
      "base nested deep active"
    );
  });

  it("ignores falsy and non-class primitive values", () => {
    expect(classNames(null, undefined, false, 0, "", "visible")).toBe("visible");
  });
});
