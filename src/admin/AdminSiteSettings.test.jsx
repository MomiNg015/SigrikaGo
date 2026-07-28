import { describe, expect, it } from "vitest";
import { settingsDraftFromApi } from "./AdminSiteSettings.jsx";

describe("AdminSiteSettings", () => {
  it("keeps IRIS links out of the system-settings draft", () => {
    const draft = settingsDraftFromApi({ irisLinks: "[]" });
    expect(draft).not.toHaveProperty("irisLinks");
  });
});
