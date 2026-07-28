import { describe, expect, it } from "vitest";
import { settingsDraftFromApi } from "./AdminSiteSettings.jsx";

describe("AdminSiteSettings", () => {
  it("keeps mascot-owned fields out of the system-settings draft", () => {
    const draft = settingsDraftFromApi({
      irisGreeting: "欢迎",
      irisLinks: "[]",
      shopMascotDialogues: "{}"
    });
    expect(draft).not.toHaveProperty("irisGreeting");
    expect(draft).not.toHaveProperty("irisLinks");
    expect(draft).not.toHaveProperty("shopMascotDialogues");
  });
});
