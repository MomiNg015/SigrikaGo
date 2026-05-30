import { api } from "../api/client.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";

export async function loadPublicSiteSettings({
  apiClient = api,
  defaults = DEFAULT_SITE_SETTINGS
} = {}) {
  try {
    const data = await apiClient("/api/site-settings");
    return { ...defaults, ...(data.settings ?? {}) };
  } catch {
    return defaults;
  }
}
