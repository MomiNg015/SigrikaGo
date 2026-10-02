import { useCallback, useState } from "react";
import { loadVisualTheme, saveVisualTheme, visualThemeClassName } from "./visualTheme.js";

export function useAppShellTheme({ user, view }) {
  const [visualTheme, setVisualThemeState] = useState(loadVisualTheme);

  const setVisualTheme = useCallback((nextTheme) => {
    setVisualThemeState(saveVisualTheme(nextTheme));
  }, []);

  const adminViewActive = view === "admin" && user?.role === "admin";
  const appShellClassName = adminViewActive
    ? "app-shell admin-theme-isolated"
    : `app-shell player-theme-enabled ${visualThemeClassName(visualTheme)}`;

  return {
    appShellClassName,
    setVisualTheme,
    visualTheme
  };
}
