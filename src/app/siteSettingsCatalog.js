import { api } from "../api/client.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";

export async function loadPublicSiteSettings({
  apiClient = api,
  defaults = DEFAULT_SITE_SETTINGS,
  throwOnError = false
} = {}) {
  try {
    const data = await apiClient("/api/site-settings");
    return { ...defaults, ...(data.settings ?? {}) };
  } catch (error) {
    if (throwOnError) throw error;
    return defaults;
  }
}

export function createSiteSettingsLoader({
  loadSettings = () => loadPublicSiteSettings()
} = {}) {
  let pending = null;
  return function loadSiteSettings() {
    if (!pending) {
      pending = loadSettings()
        .finally(() => {
          pending = null;
        });
    }
    return pending;
  };
}
