import { describe, expect, it } from "vitest";
import { mismatchedAdminDefaultDomains } from "./check-admin-default-snapshot.mjs";
import {
  buildAdminDefaultSyncPlan,
  hasAdminDefaultSyncChanges
} from "./sync-admin-default-config.mjs";

describe("admin default deployment sync", () => {
  it("plans create and update operations while preserving cloud-only rows", () => {
    const current = emptyConfig({
      siteSettings: [
        { key: "homeTitle", value: "Cloud" },
        { key: "cloudOnly", value: "keep" }
      ]
    });
    const desired = emptyConfig({
      siteSettings: [
        { key: "homeTitle", value: "Local" },
        { key: "recruitmentConfig", value: "{}" }
      ]
    });

    const plan = buildAdminDefaultSyncPlan(current, desired);

    expect(plan.siteSettings).toEqual({
      create: 1,
      update: 1,
      unchanged: 0,
      preservedCloudOnly: 1
    });
    expect(hasAdminDefaultSyncChanges(plan)).toBe(true);
  });

  it("reports local database domains that were not exported to the committed snapshot", () => {
    const snapshot = emptyConfig({
      siteSettings: [{ key: "homeTitle", value: "Old" }]
    });
    const local = emptyConfig({
      siteSettings: [{ key: "homeTitle", value: "New" }],
      skillTraits: [{ id: "trait-new", name: "新词", definition: "说明", sortOrder: 0 }]
    });

    expect(mismatchedAdminDefaultDomains(local, snapshot)).toEqual([
      "siteSettings",
      "skillTraits"
    ]);
  });
});

function emptyConfig(overrides = {}) {
  return {
    siteSettings: [],
    skillTraits: [],
    characters: [],
    decorations: [],
    shopItems: [],
    gachaPools: [],
    achievementRewardAssets: [],
    achievements: [],
    musicTrackSettings: [],
    storyScripts: [],
    announcementEntries: [],
    onboardingStoryScripts: [],
    ...overrides
  };
}
