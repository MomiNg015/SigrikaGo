import { describe, expect, it } from "vitest";
import { validateDraftForAction } from "./AdminAnnouncements.jsx";

describe("AdminAnnouncements", () => {
  it("validates draft and publish actions differently", () => {
    expect(validateDraftForAction({ title: "Draft", body: "" }, "save-draft")).toBe("");
    expect(validateDraftForAction({ title: "Draft", body: "" }, "publish")).toBe("\u53d1\u5e03\u65f6\u5185\u5bb9\u4e0d\u80fd\u4e3a\u7a7a");
    expect(validateDraftForAction({ title: "   ", body: "Body" }, "publish")).toBe("\u6807\u9898\u4e0d\u80fd\u4e3a\u7a7a");
  });
});
