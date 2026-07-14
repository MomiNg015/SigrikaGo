import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SKILL_TRAITS } from "../shared/skillTraits.js";
import {
  getSkillTraitCatalogSnapshot,
  loadCachedPublicSkillTraitCatalog,
  loadPublicSkillTraitCatalog,
  resetSkillTraitCatalogCacheForTests,
  subscribeSkillTraitCatalog
} from "./skillTraitCatalog.js";

afterEach(() => {
  resetSkillTraitCatalogCacheForTests();
  vi.useRealTimers();
});

describe("public skill trait catalog", () => {
  it("loads the public glossary without authentication", async () => {
    const apiClient = vi.fn(async () => ({ traits: [{ id: "trait-1", name: "疾走" }] }));
    await expect(loadPublicSkillTraitCatalog({ apiClient })).resolves.toEqual([
      { id: "trait-1", name: "疾走" }
    ]);
    expect(apiClient).toHaveBeenCalledWith("/api/skill-traits");
  });

  it("surfaces request failures instead of caching an empty glossary as success", async () => {
    const apiClient = vi.fn(async () => {
      throw new Error("offline");
    });
    await expect(loadPublicSkillTraitCatalog({ apiClient })).rejects.toThrow("offline");
    expect(getSkillTraitCatalogSnapshot()).toBe(DEFAULT_SKILL_TRAITS);
  });

  it("keeps a synchronous fallback and retries a transient first failure", async () => {
    vi.useFakeTimers();
    const remoteTraits = [{ id: "trait-remote", name: "疾走", definition: "远端释义" }];
    const apiClient = vi.fn()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce({ traits: remoteTraits });
    const listener = vi.fn();
    const unsubscribe = subscribeSkillTraitCatalog(listener);

    expect(getSkillTraitCatalogSnapshot()).toBe(DEFAULT_SKILL_TRAITS);
    await expect(loadCachedPublicSkillTraitCatalog({ apiClient, retryDelayMs: 20 }))
      .rejects.toThrow("temporary");
    expect(getSkillTraitCatalogSnapshot()).toBe(DEFAULT_SKILL_TRAITS);

    await vi.advanceTimersByTimeAsync(20);

    expect(apiClient).toHaveBeenCalledTimes(2);
    expect(getSkillTraitCatalogSnapshot()).toEqual(remoteTraits);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("cancels pending retries after the last description unsubscribes", async () => {
    vi.useFakeTimers();
    const apiClient = vi.fn(async () => {
      throw new Error("offline");
    });
    const unsubscribe = subscribeSkillTraitCatalog(() => {});

    await expect(loadCachedPublicSkillTraitCatalog({ apiClient, retryDelayMs: 20 }))
      .rejects.toThrow("offline");
    unsubscribe();
    await vi.advanceTimersByTimeAsync(20);

    expect(apiClient).toHaveBeenCalledTimes(1);
  });
});
