import { describe, expect, it } from "vitest";
import { settingsDraftFromApi } from "./AdminSiteSettings.jsx";

describe("AdminSiteSettings", () => {
  it("keeps mascot-owned and legacy subtitle fields out of the system-settings draft", () => {
    const draft = settingsDraftFromApi({
      homeSubtitle: "测试服",
      homeVersion: "v0.2.0",
      irisGreeting: "欢迎",
      irisLinks: "[]",
      shopMascotDialogues: "{}"
    });
    expect(draft).not.toHaveProperty("irisGreeting");
    expect(draft).not.toHaveProperty("irisLinks");
    expect(draft).not.toHaveProperty("shopMascotDialogues");
    expect(draft).not.toHaveProperty("homeSubtitle");
    expect(draft.homeVersion).toBe("v0.2.0");
  });
});
