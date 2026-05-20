export function lastMarkedAction(history = []) {
  return [...history].reverse().find((entry) => (
    entry.type === "move" || entry.effectType === "flip-stone"
  ));
}

export function canPreviewSkillTarget({ game, player, point, fallbackCharacters }) {
  if (!player || game.phase !== "playing" || game.turn !== player.color) return false;
  if ((game.skillUses[player.color] ?? 0) <= 0) return false;
  if (!point?.valid) return false;
  const skill = player.character?.skill ?? fallbackCharacters?.[player.characterId]?.skill;
  const effectType = skill?.effectType ?? skill?.id;
  const targetRule = targetRuleForEffect(effectType, skill?.targetRule);
  return canTargetPointByRule(targetRule, point);
}

function canTargetPointByRule(targetRule, point) {
  if (targetRule === "stone") return Boolean(point.stone);
  if (targetRule === "empty-point") return !point.stone;
  if (targetRule === "any-point") return true;
  return false;
}

function targetRuleForEffect(effectType, fallbackRule = null) {
  if (effectType === "random-blast") return "none";
  if (fallbackRule) return fallbackRule;
  if (effectType === "flip-stone") return "stone";
  if (effectType === "color-illusion-passive") return "none";
  if (effectType === "erase-point" || effectType === "hidden-hand") return "empty-point";
  return "none";
}
