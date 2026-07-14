import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { insertSkillTraitToken } from "./AdminCharacters.jsx";

describe("AdminCharacters skill editor", () => {
  it("keeps skill authoring content-only", () => {
    const source = readFileSync(new URL("./AdminCharacters.jsx", import.meta.url), "utf8");

    expect(source).toContain('text="技能名"');
    expect(source).toContain('label="技能描述"');
    expect(source).toContain('text="超频"');
    expect(source).toContain('text="派生技能名"');
    expect(source).toContain('label="派生技能描述"');
    expect(source).toContain('text="派生超频"');
    expect(source).not.toContain('text="技能效果"');
    expect(source).not.toContain('text="使用次数"');
    expect(source).not.toContain('text="目标规则"');
    expect(source).not.toContain('text="技能参数"');
    expect(source).not.toContain('text="技能系统信息"');
    expect(source).not.toContain("新增派生技能");
    expect(source).not.toContain("删除派生技能");
    expect(source).toContain("插入特性词");
  });

  it("inserts an unused trait at the current selection and rejects duplicates", () => {
    const textarea = { selectionStart: 2, selectionEnd: 4 };
    expect(insertSkillTraitToken("前文后文", "疾走", textarea)).toEqual({
      value: "前文【疾走】",
      cursor: 6
    });
    expect(insertSkillTraitToken("正文【疾走】", "疾走", textarea)).toBeNull();
  });
});
