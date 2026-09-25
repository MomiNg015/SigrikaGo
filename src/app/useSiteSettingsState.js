import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { createSiteSettingsLoader } from "./siteSettingsCatalog.js";

export function useSiteSettingsState({ initialSettings } = {}) {
  const [siteSettings, setSiteSettings] = useState(initialSettings ?? DEFAULT_SITE_SETTINGS);
  const siteSettingsLoaderRef = useRef(createSiteSettingsLoader());

  const refreshSiteSettings = useCallback(async () => {
    const nextSettings = await siteSettingsLoaderRef.current();
    setSiteSettings(nextSettings);
    return nextSettings;
  }, []);

  useEffect(() => {
    if (!initialSettings) refreshSiteSettings();
  }, [initialSettings, refreshSiteSettings]);

  return { refreshSiteSettings, setSiteSettings, siteSettings };
}
