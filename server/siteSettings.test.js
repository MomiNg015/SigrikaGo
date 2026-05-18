import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_SETTINGS, getPublicSiteSettings, updateSiteSettings } from "./siteSettings.js";

describe("site settings", () => {
  it("returns default home title settings when the database has no overrides", async () => {
    const prisma = {
      siteSetting: {
        findMany: async () => []
      }
    };

    await expect(getPublicSiteSettings(prisma)).resolves.toEqual(DEFAULT_SITE_SETTINGS);
  });

  it("trims and limits editable home title settings", async () => {
    const writes = [];
    const auditWrites = [];
    const prisma = {
      $transaction: async (callback) => callback({
        siteSetting: {
          upsert: async ({ where, create, update }) => {
            writes.push({ where, create, update });
            return { key: where.key, value: update.value };
          },
          findMany: async () => writes.map((write) => ({
            key: write.where.key,
            value: write.update.value
          }))
        },
        adminAuditLog: {
          create: async ({ data }) => {
            auditWrites.push(data);
            return data;
          }
        }
      })
    };

    const result = await updateSiteSettings({
      prisma,
      adminUser: { id: "admin-1" },
      body: {
        homeTitle: "  新大厅标题  ",
        homeSubtitle: ` ${"副".repeat(90)} `
      }
    });

    expect(result.settings.homeTitle).toBe("新大厅标题");
    expect(result.settings.homeSubtitle).toHaveLength(80);
    expect(writes.map((write) => write.where.key)).toEqual(["homeTitle", "homeSubtitle"]);
    expect(auditWrites[0]).toMatchObject({
      action: "site-settings.update",
      targetType: "site-settings",
      targetId: "global"
    });
  });
});
