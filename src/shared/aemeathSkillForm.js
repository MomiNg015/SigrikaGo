import { canonicalCharacterId } from "./characterAliases.js";
import { currentBattleRound } from "./deniaSkillForm.js";

export const AEMEATH_SKILL_FORM = "aemeath-voyage";
export const AEMEATH_SKILL_FORM_ASSET = "/assets/characters/skill-forms/aemeath-voyage.png";
export const AEMEATH_GLITCH_START_MS = 1000;
export const AEMEATH_GLITCH_DURATION_MS = 800;
// Switch art as the live image tears change direction, without a blackout.
export const AEMEATH_FORM_SWAP_MS = AEMEATH_GLITCH_START_MS + AEMEATH_GLITCH_DURATION_MS * .5;
export const AEMEATH_BANNER_DURATION_MS = AEMEATH_GLITCH_START_MS + AEMEATH_GLITCH_DURATION_MS + 1400;

export function isAemeath(character) {
  return canonicalCharacterId(typeof character === "object" ? character?.id ?? character?.slug : character) === "aemeath";
}

export function isAemeathVoyageBanner(banner) {
  return Boolean(banner?.id && isAemeath(banner.character ?? banner.characterId) && banner.effectType === "voyage-star");
}

export function hasAemeathSkillForm(game, color, round = currentBattleRound(game)) {
  let currentRound = 1;
  return (game?.history ?? []).some(action => {
    if (action.type === "team-round") currentRound = action.round;
    return currentRound === round && action.type === "skill" && action.color === color && action.effectType === "voyage-star";
  });
}
