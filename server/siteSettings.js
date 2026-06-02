export { DEFAULT_SITE_SETTINGS } from "../src/shared/siteSettings.js";
import { DEFAULT_SITE_SETTINGS } from "../src/shared/siteSettings.js";

const SITE_SETTING_KEYS = Object.keys(DEFAULT_SITE_SETTINGS);
const SITE_SETTING_LIMITS = {
  homeTitle: 24,
  homeSubtitle: 80,
  aboutText: 3000
};

export async function getPublicSiteSettings(prisma) {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: SITE_SETTING_KEYS } }
  });
  return rowsToSettings(rows);
}

export async function ensureDefaultSiteSettings(prisma) {
  for (const [key, value] of Object.entries(DEFAULT_SITE_SETTINGS)) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: {}
    });
  }
}

export async function updateSiteSettings({ prisma, adminUser, body }) {
  const nextSettings = sanitizeSiteSettings(body);
  return prisma.$transaction(async (tx) => {
    const before = await getPublicSiteSettings(tx);
    for (const [key, value] of Object.entries(nextSettings)) {
      await tx.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value }
      });
    }
    const settings = await getPublicSiteSettings(tx);
    await tx.adminAuditLog.create({
      data: {
        adminUserId: adminUser.id,
        action: "site-settings.update",
        targetType: "site-settings",
        targetId: "global",
        beforeJson: JSON.stringify(before),
        afterJson: JSON.stringify(settings)
      }
    });
    return { settings };
  });
}

export function sanitizeSiteSettings(body = {}) {
  return Object.fromEntries(
    SITE_SETTING_KEYS.map((key) => {
      const fallback = DEFAULT_SITE_SETTINGS[key];
      const value = String(body?.[key] ?? fallback).trim().slice(0, SITE_SETTING_LIMITS[key]);
      return [key, value || fallback];
    })
  );
}

function rowsToSettings(rows) {
  const settings = { ...DEFAULT_SITE_SETTINGS };
  for (const row of rows) {
    if (!Object.hasOwn(settings, row.key)) continue;
    const value = String(row.value ?? "").trim();
    if (value) settings[row.key] = value;
  }
  return settings;
}
