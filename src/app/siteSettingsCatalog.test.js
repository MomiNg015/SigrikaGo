import { describe, expect, it, vi } from "vitest";
import { createSiteSettingsLoader, loadPublicSiteSettings } from "./siteSettingsCatalog.js";

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

  it("shares an in-flight settings request between startup callers", async () => {
    let resolveRequest;
    const loadSettings = vi.fn(() => new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    const load = createSiteSettingsLoader({ loadSettings });

    const first = load();
    const second = load();
    resolveRequest({ homeTitle: "Remote title" });

    await expect(first).resolves.toEqual({ homeTitle: "Remote title" });
    await expect(second).resolves.toEqual({ homeTitle: "Remote title" });
    expect(loadSettings).toHaveBeenCalledTimes(1);
  });
});
