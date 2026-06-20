import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("RecruitmentModal", () => {
  it("renders a clock fast-forward action during pending recruitment", () => {
    const modalSource = readFileSync(new URL("./RecruitmentModal.jsx", import.meta.url), "utf8");
    const hookSource = readFileSync(new URL("./recruitment/useRecruitmentCatalog.js", import.meta.url), "utf8");

    expect(modalSource).toContain("Clock");
    expect(modalSource).toContain("recruitment-fast-forward-button");
    expect(modalSource).toContain("canFastForward");
    expect(modalSource).toContain("aria-label=\"快速计时到 5 秒\"");
    expect(modalSource).toContain("onFastForward={fastForward}");
    expect(hookSource).toContain("/api/recruitment/fast-forward");
    expect(hookSource).toContain("import.meta.env.DEV");
    expect(hookSource).toContain("import.meta.env.MODE === \"development\"");
    expect(hookSource).toContain("import.meta.env.VITE_ENABLE_TEST_TOOLS === \"true\"");
  });
});
