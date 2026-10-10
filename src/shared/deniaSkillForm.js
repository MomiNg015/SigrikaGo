import { canonicalCharacterId } from "./characterAliases.js";

export const DENIA_SKILL_FORM = "denia-awakened";
export const DENIA_SKILL_FORM_PALETTE = "#7860e8";
export const DENIA_RUNE_ASSET = "/assets/effects/denia-awakened-runes.svg";
// Sampled cyan/electric violet from the supplied arm and leg markings.
export const DENIA_SKILL_FORM_STYLE = Object.freeze({
  "--denia-cyan": "#60f8f0",
  "--denia-violet": DENIA_SKILL_FORM_PALETTE,
  "--denia-indigo": "#41466f",
  "--denia-runes": `url("${DENIA_RUNE_ASSET}")`
});
export const DENIA_SWARM_START_MS = 1000;
export const DENIA_FORM_SWAP_MS = 1750;
export const DENIA_SWARM_END_MS = 2500;
export const DENIA_BANNER_DURATION_MS = 3200;
export const DENIA_SKILL_FORM_ASSET = "/assets/characters/skill-forms/denia-awakened.png";
export const DENIA_PAPER_ASSET = "/assets/effects/denia-paper-person.svg";

export function isDenia(character) {
  return canonicalCharacterId(typeof character === "object" ? character?.id ?? character?.slug : character) === "denia";
}

export function isDeniaSkillBanner(banner) {
  return Boolean(banner?.id && isDenia(banner.character ?? banner.characterId));
}

// Visible history is already scoped by the room/replay owner. Never persist an
// appearance on the account or leak a later team member into an earlier round.
export function currentBattleRound(game) {
  return game?.teamRound ?? game?.history?.findLast((action) => action.type === "team-round")?.round ?? 1;
}

export function hasDeniaSkillForm(game, color, round = currentBattleRound(game)) {
  let currentRound = 1;
  for (const action of game?.history ?? []) {
    if (action.type === "team-round") currentRound = action.round;
    if (currentRound === round && action.type === "skill" && action.color === color) return true;
  }
  return false;
}

export function deniaFormBeforeCast(game, color) {
  return hasDeniaSkillForm({ ...game, history: (game?.history ?? []).slice(0, -1) }, color)
    ? DENIA_SKILL_FORM : null;
}
