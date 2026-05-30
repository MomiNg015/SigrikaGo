import { describe, expect, it, vi } from "vitest";
import { loadPublicCharacterCatalog } from "./characterCatalog.js";

describe("public character catalog loading", () => {
  it("loads and merges public characters from the API", async () => {
    const apiClient = vi.fn(async () => ({
      characters: [{ id: "sigrika", name: "Custom Sigrika", portrait: "/custom.png" }],
      disabledSlugs: ["danea"]
    }));

    const catalog = await loadPublicCharacterCatalog({ apiClient, token: "token-1" });

    expect(apiClient).toHaveBeenCalledWith("/api/characters", { token: "token-1" });
    expect(catalog.sigrika).toMatchObject({ name: "Custom Sigrika", portrait: "/custom.png" });
    expect(catalog.denia).toBeUndefined();
  });

  it("falls back to the provided catalog if the API fails", async () => {
    const fallback = { fallback: { id: "fallback" } };
    const apiClient = vi.fn(async () => {
      throw new Error("offline");
    });

    await expect(loadPublicCharacterCatalog({ apiClient, token: "token-1", fallback }))
      .resolves.toBe(fallback);
  });
});
