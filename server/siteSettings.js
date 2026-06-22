export { DEFAULT_SITE_SETTINGS } from "../src/shared/siteSettings.js";
import { DEFAULT_SITE_SETTINGS } from "../src/shared/siteSettings.js";
import { RATING_RULES_SETTING_KEY, normalizeRatingRules } from "../src/shared/ratingRules.js";

const SITE_SETTING_KEYS = Object.keys(DEFAULT_SITE_SETTINGS);
let cachedPublicSiteSettings = { ...DEFAULT_SITE_SETTINGS };
const SITE_SETTING_LIMITS = {
  homeTitle: 24,
  homeSubtitle: 80,
  aboutText: 3000,
  footerText: 3000,
  preloadTips: 1000,
  characterLoadingLines: 3000,
  ratingRules: 8000
};
const BOOLEAN_SITE_SETTING_KEYS = new Set(["skillEffectsEnabled"]);

export async function getPublicSiteSettings(prisma) {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: SITE_SETTING_KEYS } }
  });
  cachedPublicSiteSettings = rowsToSettings(rows);
  return cachedPublicSiteSettings;
}

export function getCachedPublicSiteSettings() {
  return cachedPublicSiteSettings;
}

export async function ensureDefaultSiteSettings(prisma) {
  for (const [key, value] of Object.entries(DEFAULT_SITE_SETTINGS)) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: toStoredSiteSettingValue(key, value) },
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
    cachedPublicSiteSettings = settings;
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
      if (BOOLEAN_SITE_SETTING_KEYS.has(key)) {
        return [key, normalizeBooleanSiteSetting(body?.[key], fallback) ? "true" : "false"];
      }
      if (key === RATING_RULES_SETTING_KEY) {
        return [key, JSON.stringify(normalizeRatingRules(body?.[key] ?? fallback), null, 2)];
      }
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
    if (!value) continue;
    settings[row.key] = BOOLEAN_SITE_SETTING_KEYS.has(row.key)
      ? normalizeBooleanSiteSetting(value, DEFAULT_SITE_SETTINGS[row.key])
      : value;
  }
  return settings;
}

function toStoredSiteSettingValue(key, value) {
  if (BOOLEAN_SITE_SETTING_KEYS.has(key)) return normalizeBooleanSiteSetting(value, DEFAULT_SITE_SETTINGS[key]) ? "true" : "false";
  return String(value ?? "");
}

function normalizeBooleanSiteSetting(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["false", "0", "no", "off", "disabled"].includes(normalized)) return false;
  return Boolean(fallback);
}
