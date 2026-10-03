import { resolveCharacterPortraitPresentation } from "./characterPortraits.js";
import { storyPortraitCatalog } from "./storyPortraits.js";

const labels = Object.freeze({
  original: "原始表情", smile: "微笑", closed_smile: "闭眼开心", thinking: "思考",
  serious: "认真", surprised: "惊讶", worried: "担忧", embarrassed: "害羞",
  angry: "生气", playful: "俏皮", sleepy: "困倦", annoyed: "不满",
  wink: "眨眼", wry: "无奈"
});

export const CHARACTER_STORY_SPRITES = Object.freeze({
  sigrika: profile("sigrika", "西格莉卡", "sigrika-sprite-expressions", "sigrika-", ["smile", "closed_smile", "thinking", "serious", "surprised", "worried", "embarrassed", "angry", "original"], { left: 205, top: 0, width: 400, height: 400 }),
  denia: profile("denia", "达妮娅", "denia-sprite-expressions", "", ["smile", "closed_smile", "playful", "sleepy", "thinking", "surprised", "annoyed", "serious", "original"], { left: 220, top: 0, width: 420, height: 420 }),
  aemeath: profile("aemeath", "爱弥斯", "amis-sprite-expressions", "", ["smile", "closed_smile", "wink", "surprised", "thinking", "wry", "annoyed", "serious", "original"], { left: 214, top: 0, width: 376, height: 376 })
});

function profile(characterId, name, sourcePackage, sourcePrefix, expressions, avatarCrop) {
  return Object.freeze({ characterId, name, appearanceId: `${characterId}-standard-v1`, sourcePackage, sourcePrefix, expressions: Object.freeze(expressions), avatarCrop: Object.freeze(avatarCrop), width: 832, height: 1216 });
}

export function storySpriteProfile(characterId) {
  const id = String(characterId ?? "").trim();
  return CHARACTER_STORY_SPRITES[id] ?? Object.values(CHARACTER_STORY_SPRITES).find((entry) => entry.name === id) ?? null;
}

export function storyExpressionOptions(characterId) {
  return storySpriteProfile(characterId)?.expressions.map((value) => ({ value, label: labels[value] })) ?? [];
}

// Missing fields allow authored defaults; an explicitly empty appearance opts out.
export function normalizeStorySpriteSelection(node = {}) {
  return Object.fromEntries(["appearanceId", "expressionId"]
    .filter((key) => Object.hasOwn(node, key))
    .map((key) => [key, String(node[key] ?? "").trim()]));
}

export function storySpriteSelectionError(node = {}) {
  if (!node.appearanceId && !node.expressionId) return "";
  const entry = storySpriteProfile(node.characterId);
  if (!entry || node.appearanceId !== entry.appearanceId) return "立绘造型与角色不匹配。";
  if (node.expressionId && !entry.expressions.includes(node.expressionId)) return "该角色没有此表情。";
  return "";
}

export function storySpriteUrl(characterId, expressionId = "smile", variant = "illustration") {
  const entry = storySpriteProfile(characterId);
  if (!entry) return "";
  const expression = entry.expressions.includes(expressionId) ? expressionId : "smile";
  return `/assets/characters/story-sprites/${entry.characterId}/${expression}${variant === "avatar" ? "-avatar" : ""}.webp`;
}

export function storyAvatarUrls(nodes = [], { characters = {}, user = null, fallbackCharacterIds = [] } = {}) {
  return storyGuidePortraitUrls(nodes, { characters, user, fallbackCharacterIds, variant: "avatar" });
}

export function storyGuidePortraitUrls(nodes = [], { characters = {}, user = null, fallbackCharacterIds = [], variant = "illustration" } = {}) {
  return [...new Set(nodes.flatMap((node) => (node.characterId ? [node.characterId] : fallbackCharacterIds)
    .map((characterId) => resolveStoryPortraitPresentation({ ...node, characterId }, { characters, user, variant }).src)).filter(Boolean))];
}

export function resolveStoryCharacter(characterId, characters = {}) {
  const id = String(characterId ?? "").trim();
  if (!id) return {};
  const catalog = storyPortraitCatalog(characters);
  const character = catalog[id] ?? Object.values(catalog).find((entry) => [entry?.name, entry?.displayName, entry?.id, entry?.slug].includes(id)) ?? {};
  return { ...character, portraitUrl: character.portraitUrl || character.portrait || character.imageUrl || "" };
}

export function resolveStoryPortraitPresentation(node = {}, { characters = {}, character = null, user = null, variant = "illustration" } = {}) {
  const resolved = character ?? resolveStoryCharacter(node.characterId, characters);
  const entry = storySpriteProfile(node.characterId);
  const legacy = resolveCharacterPortraitPresentation({ ...resolved, id: entry?.characterId ?? node.characterId }, { user, itemEffects: user?.itemEffects });
  const specialState = (entry?.characterId === "sigrika" && user?.sigrikaCandyArc?.corrupted === true)
    || (entry?.characterId === "denia" && user?.itemEffects?.deniaRainbowGlow);
  if (!entry || node.appearanceId !== entry.appearanceId || storySpriteSelectionError(node) || specialState) {
    return { ...legacy, standard: false, appearanceId: "", expressionId: "", fallbackSrc: legacy.src };
  }
  const expressionId = node.expressionId || "smile";
  return { src: storySpriteUrl(entry.characterId, expressionId, variant), fallbackSrc: legacy.src, standard: true, appearanceId: entry.appearanceId, expressionId, style: undefined };
}
