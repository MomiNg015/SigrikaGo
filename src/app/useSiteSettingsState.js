import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { createSiteSettingsLoader, loadPublicSiteSettings } from "./siteSettingsCatalog.js";

const createLoader = () => createSiteSettingsLoader({ loadSettings: () => loadPublicSiteSettings({ throwOnError: true }) });

export function useSiteSettingsState({ initialSettings, refreshWhileVisible = false } = {}) {
  const [siteSettings, applySiteSettings] = useState(initialSettings ?? DEFAULT_SITE_SETTINGS);
  const currentRef = useRef(siteSettings);
  const revisionRef = useRef(0);
  const siteSettingsLoaderRef = useRef(createLoader());

  const setSiteSettings = useCallback((settings) => {
    revisionRef.current += 1;
    const next = typeof settings === "function" ? settings(currentRef.current) : settings;
    currentRef.current = next;
    applySiteSettings(next);
    // A post-save refresh must not join a pre-save request still in flight.
    siteSettingsLoaderRef.current = createLoader();
  }, []);

  const refreshSiteSettings = useCallback(async () => {
    const revision = revisionRef.current;
    try {
      const nextSettings = await siteSettingsLoaderRef.current();
      if (revision === revisionRef.current) {
        currentRef.current = nextSettings;
        applySiteSettings(nextSettings);
      }
    } catch {
      // Keep the last published notice during transient failures.
    }
    return currentRef.current;
  }, []);

  useEffect(() => {
    if (!initialSettings) refreshSiteSettings();
  }, [initialSettings, refreshSiteSettings]);

  useEffect(() => {
    if (!refreshWhileVisible) return undefined;
    const refreshVisible = () => {
      if (document.visibilityState === "visible") void refreshSiteSettings();
    };
    refreshVisible();
    const timer = window.setInterval(refreshVisible, 30000);
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [refreshSiteSettings, refreshWhileVisible]);

  return { refreshSiteSettings, setSiteSettings, siteSettings };
}
