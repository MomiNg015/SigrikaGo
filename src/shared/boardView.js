import { skillEffectTargetRule } from "./skillEffectCatalog.js";
import { canSprayTransformStone } from "./gameConstants.js";

export function lastMarkedAction(history = []) {
  return [...history].reverse().find((entry) => (
    entry.type === "move" || entry.effectType === "flip-stone"
    || entry.effectType === "liberty-purge"
  ));
}

export function canPreviewSkillTarget({ game, player, point, fallbackCharacters }) {
  if (!player || game.phase !== "playing" || game.turn !== player.color) return false;
  if ((game.skillUses[player.color] ?? 0) <= 0) return false;
  if (!point?.valid) return false;
  if (!point.stone && point.protocolBan?.bannedColor === player.color) return false;
  const skill = player.character?.skill ?? fallbackCharacters?.[player.characterId]?.skill;
  const effectType = skill?.effectType ?? skill?.id;
  const targetRule = targetRuleForEffect(effectType, skill?.targetRule);
  return canTargetPointByRule(targetRule, point, game);
}

function canTargetPointByRule(targetRule, point, game) {
  if (targetRule === "spray-stone") return canSprayTransformStone(point);
  if (targetRule === "stone") return Boolean(point.stone);
  if (targetRule === "empty-point") return !point.stone;
  if (targetRule === "legal-move-point") return !point.stone && game?.ko !== point.id;
  if (targetRule === "any-point") return true;
  return false;
}

function targetRuleForEffect(effectType, fallbackRule = null) {
  if (effectType === "spray-stone") return "spray-stone";
  return skillEffectTargetRule(effectType, fallbackRule);
}
