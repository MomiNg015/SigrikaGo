export const VISUAL_THEME_STORAGE_KEY = "sigrika-visual-theme";

export const DEFAULT_VISUAL_THEME = "bright-school";

export const VISUAL_THEME_CLASS_PREFIX = "theme-";

export const VISUAL_THEMES = [
  {
    id: "bright-school",
    name: "\u660e\u4eae\u6821\u56ed",
    description: "\u5976\u6cb9\u8349\u7a3f\u7eb8\u3001\u6df1\u68d5\u6d3b\u9875\u5939\u3001\u62cd\u7acb\u5f97\u548c\u6587\u5177\u8d34\u7eb8\u98ce"
  }
];

export const VISUAL_THEME_IDS = VISUAL_THEMES.map((theme) => theme.id);

const LEGACY_VISUAL_THEME_IDS = new Set(["current", "original", "pop-tech", "terminal", "classic"]);

export function sanitizeVisualTheme(theme) {
  if (LEGACY_VISUAL_THEME_IDS.has(theme)) return DEFAULT_VISUAL_THEME;
  return VISUAL_THEME_IDS.includes(theme) ? theme : DEFAULT_VISUAL_THEME;
}

export function loadVisualTheme(storage = globalThis.localStorage) {
  try {
    return sanitizeVisualTheme(storage?.getItem(VISUAL_THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_VISUAL_THEME;
  }
}

export function saveVisualTheme(theme, storage = globalThis.localStorage) {
  const nextTheme = sanitizeVisualTheme(theme);
  try {
    storage?.setItem(VISUAL_THEME_STORAGE_KEY, nextTheme);
  } catch {}
  return nextTheme;
}

export function visualThemeClassName(theme) {
  return `${VISUAL_THEME_CLASS_PREFIX}${sanitizeVisualTheme(theme)}`;
}

export function visualThemeScopeSelector(theme) {
  return `.app-shell.player-theme-enabled.${visualThemeClassName(theme)}`;
}

export function visualThemeCssImportPath(theme) {
  return `./themes/${sanitizeVisualTheme(theme)}.css`;
}
