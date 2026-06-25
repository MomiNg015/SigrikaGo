import { doubleMove, erasePoint, flipStone, libertyPurge, protocolTakeover, randomBlast, rowSlash, sprayStone, voyageStar } from "./gameSkillActions.js";
import { playHiddenHand } from "./gameStoneActions.js";
import { executeRegisteredSkill, skillConsumesTurn } from "./gameSkillRegistry.js";

export const ACTIVE_SKILL_HANDLERS = {
  "erase-point": ({ state, color, targetId, skill }) => erasePoint(state, color, targetId, {
    skillName: skill.name,
    consumesTurn: skillConsumesTurn(skill),
    skill
  }),
  "flip-stone": ({ state, color, targetId, skill }) => flipStone(state, color, targetId, {
    skillName: skill.name,
    consumesTurn: skillConsumesTurn(skill),
    skill
  }),
  "hidden-hand": ({ state, color, targetId, skill }) => playHiddenHand(state, color, targetId, {
    skillName: skill.name,
    characterId: skill.characterId ?? "aemeath",
    skill
  }),
  "protocol-takeover": ({ state, color, targetId, skill }) => protocolTakeover(state, color, targetId, {
    skillName: skill.name,
    consumesTurn: skillConsumesTurn(skill),
    skill
  }),
  "random-blast": ({ state, color, skill }) => randomBlast(state, color, {
    skillName: skill.name,
    consumesTurn: skillConsumesTurn(skill),
    skill
  }),
  "row-slash": ({ state, color, targetId, skill }) => rowSlash(state, color, targetId, {
    skillName: skill.name,
    consumesTurn: skillConsumesTurn(skill),
    skill
  }),
  "spray-stone": ({ state, color, targetId, skill }) => sprayStone(state, color, targetId, {
    skillName: skill.name,
    consumesTurn: skillConsumesTurn(skill),
    skill
  }),
  "liberty-purge": ({ state, color, targetId, skill }) => libertyPurge(state, color, targetId, {
    skillName: skill.name,
    consumesTurn: skillConsumesTurn(skill),
    skill
  }),
  "double-move": ({ state, color, skill }) => doubleMove(state, color, {
    skillName: skill.name,
    skill
  }),
  "voyage-star": ({ state, color, skill }) => voyageStar(state, color, {
    skillName: skill.name,
    consumesTurn: skillConsumesTurn(skill),
    skill
  })
};

export function executeActiveSkillHandler({ state, color, targetId, skill }) {
  return executeRegisteredSkill({
    state,
    color,
    targetId,
    skill,
    handlers: ACTIVE_SKILL_HANDLERS
  });
}
