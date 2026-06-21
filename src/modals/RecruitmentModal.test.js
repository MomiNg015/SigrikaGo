import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("RecruitmentModal", () => {
  it("renders a clock fast-forward action during pending recruitment", () => {
    const modalSource = readFileSync(new URL("./RecruitmentModal.jsx", import.meta.url), "utf8");
    const hookSource = readFileSync(new URL("./recruitment/useRecruitmentCatalog.js", import.meta.url), "utf8");

    expect(modalSource).toContain("Clock");
    expect(modalSource).toContain("playRecruitmentResultSound");
    expect(modalSource).toContain("playedResultSoundRef");
    expect(modalSource).toContain("audioSettings");
    expect(modalSource).not.toContain("\u56de\u5e94\u5df2\u7ecf\u9001\u5230\u90e8\u5ba4\u95e8\u53e3");
    expect(modalSource).not.toContain("\u8fd9\u6b21\u8fd8\u6ca1\u6709\u65b0\u56de\u5e94");
    expect(modalSource).toContain("<h2>部员招募栏</h2>");
    expect(modalSource).not.toContain("围棋部招新现场");
    expect(modalSource).not.toContain("公示板已经摆好");
    expect(modalSource).not.toContain("等待招新回应");
    expect(modalSource).toContain("canUse ? \"使用\" : \"不可用\"");
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
