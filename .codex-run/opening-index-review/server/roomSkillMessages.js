import {
  COLORS,
  getPoint,
  opponent,
  parsePointId
} from "../src/shared/game.js";
import { CHARACTERS } from "../src/shared/characters.js";

export function describeSkillUse(room, player, targetId, activeSkill = null) {
  const character = player.character ?? CHARACTERS[player.characterId] ?? CHARACTERS.sigrika;
  const skill = activeSkill ?? character.skill ?? CHARACTERS[player.characterId]?.skill ?? CHARACTERS.sigrika.skill;
  const effectType = skill.effectType ?? skill.id;
  const colorLabel = player.color === COLORS.black ? "黑" : "白";
  const targetStone = getPoint(room.game, targetId)?.stone;
  const fromColor = stoneLabel(player.color);
  const toColor = stoneLabel(opponent(targetStone ?? player.color));
  const targetColor = stoneLabel(targetStone);
  const fixed = `${colorLabel}方${player.user.username}使用了${character.name}的“${skill.name}”技能`;
  const coord = targetId ? formatPointLabel(targetId) : "无目标";
  if (skill.systemMessage) {
    return renderSkillMessage(skill.systemMessage, {
      player: player.user.username,
      character: character.name,
      skill: skill.name,
      point: coord,
      color: colorLabel,
      fromColor,
      toColor,
      targetColor
    });
  }
  if (effectType === "erase-point") {
    return `${fixed}。从天而降破坏了${coord}的点位，铛！`;
  }
  if (effectType === "flip-stone") {
    const point = getPoint(room.game, targetId);
    const from = stoneLabel(point?.stone);
    const to = stoneLabel(point?.stone ? opponent(point.stone) : null);
    return `${fixed}。诅咒了${coord}的${from}，将其从${from}变成了${to}。`;
  }
  if (effectType === "voyage-star") {
    return `${fixed}。白色大剑坠入棋盘，远航星展开。`;
  }
  if (effectType === "hidden-hand" || player.characterId === "aemeath") {
    return `${fixed}。落下了电子幽灵般的一手，应该不会被发现吧...`;
  }
  return `${fixed}。`;
}

export function renderSkillMessage(template, values) {
  return String(template)
    .replaceAll("{player}", values.player)
    .replaceAll("{character}", values.character)
    .replaceAll("{skill}", values.skill)
    .replaceAll("{point}", values.point)
    .replaceAll("{fromColor}", values.fromColor)
    .replaceAll("{toColor}", values.toColor)
    .replaceAll("{targetColor}", values.targetColor)
    .replaceAll("{color}", values.color);
}

export function formatPointLabel(id) {
  const { x, y } = parsePointId(id);
  return `${"ABCDEFGHJKLMN"[x]}-${13 - y}`;
}

export function stoneLabel(color) {
  if (color === COLORS.black) return "黑棋";
  if (color === COLORS.white) return "白棋";
  return "棋子";
}
