import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Qiuyuan legacy system voice generator", () => {
  it("stays retired after all fixed events receive approved recordings", () => {
    expect(
      existsSync(new URL("./generate-qiuyuan-system-voices.ps1", import.meta.url))
    ).toBe(false);
  });
});
