import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ADMIN_TABS, ADMIN_TAB_LABELS } from "./AdminShell.jsx";

describe("AdminSkillTraits", () => {
  it("is a top-level admin destination with CRUD and reference inspection", () => {
    const source = readFileSync(new URL("./AdminSkillTraits.jsx", import.meta.url), "utf8");
    expect(ADMIN_TABS).toContain("skill-traits");
    expect(ADMIN_TAB_LABELS["skill-traits"]).toBe("特性词");
    expect(source).toContain("新增特性词");
    expect(source).toContain("引用位置");
    expect(source).toContain('draft.id ? "PATCH" : "POST"');
    expect(source).toContain('method: "DELETE"');
    expect(source).toContain("Boolean(draft.references?.length)");
  });
});
