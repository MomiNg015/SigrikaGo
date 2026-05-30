import { describe, expect, it, vi } from "vitest";
import { loadPublicSiteSettings } from "./siteSettingsCatalog.js";

describe("public site settings loading", () => {
  it("merges API settings over defaults", async () => {
    const defaults = {
      homeTitle: "Default title",
      homeSubtitle: "Default subtitle",
      aboutText: "Default about"
    };
    const apiClient = vi.fn(async () => ({
      settings: { homeTitle: "Remote title" }
    }));

    await expect(loadPublicSiteSettings({ apiClient, defaults })).resolves.toEqual({
      homeTitle: "Remote title",
      homeSubtitle: "Default subtitle",
      aboutText: "Default about"
    });
    expect(apiClient).toHaveBeenCalledWith("/api/site-settings");
  });

  it("falls back to defaults when loading fails", async () => {
    const defaults = { homeTitle: "Default title" };
    const apiClient = vi.fn(async () => {
      throw new Error("offline");
    });

    await expect(loadPublicSiteSettings({ apiClient, defaults })).resolves.toBe(defaults);
  });
});
