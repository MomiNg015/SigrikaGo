import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { createSiteSettingsLoader } from "./siteSettingsCatalog.js";

export function useSiteSettingsState() {
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);
  const siteSettingsLoaderRef = useRef(createSiteSettingsLoader());

  const refreshSiteSettings = useCallback(async () => {
    const nextSettings = await siteSettingsLoaderRef.current();
    setSiteSettings(nextSettings);
    return nextSettings;
  }, []);

  useEffect(() => {
    refreshSiteSettings();
  }, [refreshSiteSettings]);

  return { refreshSiteSettings, setSiteSettings, siteSettings };
}
