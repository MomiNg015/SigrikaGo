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
  if (effectType === "erase-point") return !point.stone;
  if (effectType === "flip-stone") return Boolean(point.stone);
  return false;
}
