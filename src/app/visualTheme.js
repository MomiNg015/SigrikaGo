export const VISUAL_THEME_STORAGE_KEY = "sigrika-visual-theme";
export const VISUAL_EFFECT_STORAGE_KEY = "sigrika-visual-effects";

export const DEFAULT_VISUAL_THEME = "current";
export const DEFAULT_VISUAL_EFFECT = "standard";

export const VISUAL_THEMES = [
  {
    id: "current",
    name: "\u5f53\u524d\u98ce\u683c",
    description: "\u8f6f\u840c\u7535\u5b50 HUD\uff0c\u4fdd\u7559\u73b0\u5728\u7684\u5b66\u56ed\u5168\u606f\u89c6\u89c9"
  },
  {
    id: "original",
    name: "\u539f\u7248\u98ce\u683c",
    description: "\u56de\u5230\u539f\u5148\u6d45\u8272\u3001\u5706\u89d2\u3001\u4f4e\u53d1\u5149\u7684\u7f51\u9875\u754c\u9762\u611f"
  },
  {
    id: "bright-school",
    name: "\u660e\u4eae\u6821\u56ed",
    description: "\u5976\u6cb9\u8349\u7a3f\u7eb8\u3001\u6df1\u68d5\u6d3b\u9875\u5939\u3001\u62cd\u7acb\u5f97\u548c\u6587\u5177\u8d34\u7eb8\u98ce"
  }
];

export const VISUAL_EFFECT_LEVELS = [
  {
    id: "standard",
    name: "\u6807\u51c6\u7279\u6548",
    description: "\u4fdd\u7559\u626b\u63cf\u7ebf\u3001\u6bdb\u73bb\u7483\u4e0e\u8f7b\u5fae\u53d1\u5149"
  },
  {
    id: "low",
    name: "\u4f4e\u7279\u6548",
    description: "\u964d\u4f4e\u6a21\u7cca\u3001\u9634\u5f71\u548c\u52a8\u753b\uff0c\u9002\u5408\u79fb\u52a8\u7aef"
  }
];

export function sanitizeVisualTheme(theme) {
  if (["pop-tech", "terminal", "classic"].includes(theme)) return DEFAULT_VISUAL_THEME;
  return VISUAL_THEMES.some((option) => option.id === theme) ? theme : DEFAULT_VISUAL_THEME;
}

export function sanitizeVisualEffect(effect) {
  return VISUAL_EFFECT_LEVELS.some((option) => option.id === effect) ? effect : DEFAULT_VISUAL_EFFECT;
}

export function loadVisualTheme(storage = globalThis.localStorage) {
  try {
    return sanitizeVisualTheme(storage?.getItem(VISUAL_THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_VISUAL_THEME;
  }
}

export function loadVisualEffect(storage = globalThis.localStorage) {
  try {
    return sanitizeVisualEffect(storage?.getItem(VISUAL_EFFECT_STORAGE_KEY));
  } catch {
    return DEFAULT_VISUAL_EFFECT;
  }
}

export function saveVisualTheme(theme, storage = globalThis.localStorage) {
  const nextTheme = sanitizeVisualTheme(theme);
  try {
    storage?.setItem(VISUAL_THEME_STORAGE_KEY, nextTheme);
  } catch {}
  return nextTheme;
}

export function saveVisualEffect(effect, storage = globalThis.localStorage) {
  const nextEffect = sanitizeVisualEffect(effect);
  try {
    storage?.setItem(VISUAL_EFFECT_STORAGE_KEY, nextEffect);
  } catch {}
  return nextEffect;
}

export function visualThemeClassName(theme, effect) {
  return `theme-${sanitizeVisualTheme(theme)} effect-${sanitizeVisualEffect(effect)}`;
}
