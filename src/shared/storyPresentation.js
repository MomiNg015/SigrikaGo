export const STORY_NODE_EFFECTS = Object.freeze({
  none: "",
  longTextCompressPortrait: "long-text-compress-portrait"
});

export const STORY_NODE_EFFECT_OPTIONS = Object.freeze([
  { value: STORY_NODE_EFFECTS.none, label: "无" },
  { value: STORY_NODE_EFFECTS.longTextCompressPortrait, label: "长文本挤压立绘区" }
]);

export function normalizeStoryNodeEffect(value) {
  const effect = String(value ?? "").trim();
  return Object.values(STORY_NODE_EFFECTS).includes(effect) ? effect : null;
}

export function isLongTextCompressPortraitEffect(value) {
  return normalizeStoryNodeEffect(value) === STORY_NODE_EFFECTS.longTextCompressPortrait;
}
