export const VISUAL_THEME_STORAGE_KEY = "sigrika-visual-theme";

export const DEFAULT_VISUAL_THEME = "bright-school";

export const VISUAL_THEME_CLASS_PREFIX = "theme-";

export const VISUAL_THEME_OPTIONS = [
  {
    id: "bright-school",
    name: "\u660e\u4eae\u6821\u56ed",
    label: "\u6ca1\u7ecf\u8d39\u7684\u7b80\u6734\u56f4\u68cb\u90e8\u98ce\u683c",
    description: "\u5976\u6cb9\u8349\u7a3f\u7eb8\u3001\u6df1\u68d5\u6d3b\u9875\u5939\u3001\u62cd\u7acb\u5f97\u548c\u6587\u5177\u8d34\u7eb8\u98ce",
    available: true
  },
  {
    id: "club-standard",
    name: "\u6807\u51c6\u56f4\u68cb\u90e8",
    label: "\u4e2d\u89c4\u4e2d\u77e9\u7684\u56f4\u68cb\u90e8\u98ce\u683c",
    description: "\u9762\u5411\u672a\u6765\u6269\u5c55\u7684\u6807\u51c6\u793e\u56e2\u754c\u9762\u98ce\u683c",
    available: false
  },
  {
    id: "motari-luxury",
    name: "\u83ab\u5854\u91cc\u8d5e\u52a9\u98ce",
    label: "\u83ab\u5854\u91cc\u5bb6\u65cf\u8d5e\u52a9\u7684\u5962\u534e\u98ce\u683c",
    description: "\u9762\u5411\u672a\u6765\u6269\u5c55\u7684\u8d5e\u52a9\u5546\u54c1\u724c\u5316\u754c\u9762\u98ce\u683c",
    available: false
  }
];

export const VISUAL_THEMES = VISUAL_THEME_OPTIONS.filter((theme) => theme.available);

export const FUTURE_VISUAL_THEMES = VISUAL_THEME_OPTIONS.filter((theme) => !theme.available);

export const VISUAL_THEME_IDS = VISUAL_THEMES.map((theme) => theme.id);

const LEGACY_VISUAL_THEME_IDS = new Set(["current", "original", "pop-tech", "terminal", "classic"]);

export function sanitizeVisualTheme(theme) {
  if (LEGACY_VISUAL_THEME_IDS.has(theme)) return DEFAULT_VISUAL_THEME;
  return VISUAL_THEME_IDS.includes(theme) ? theme : DEFAULT_VISUAL_THEME;
}

export function isVisualThemeAvailable(theme) {
  return VISUAL_THEME_IDS.includes(theme);
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
