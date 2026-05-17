export const SKILL_MESSAGE_TOKENS = [
  "{player}",
  "{character}",
  "{skill}",
  "{point}",
  "{fromColor}",
  "{toColor}",
  "{targetColor}"
];

export const DEFAULT_SKILL_SYSTEM_MESSAGE = "{fromColor}{player}使用了{character}的“{skill}”技能，目标是{point}。";

export const SKILL_MESSAGE_TIP = `发动技能后写入系统聊天。可用 ${SKILL_MESSAGE_TOKENS.join("、")}。`;
