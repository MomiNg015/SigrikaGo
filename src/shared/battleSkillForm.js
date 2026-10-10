import { DENIA_SKILL_FORM, DENIA_SKILL_FORM_ASSET, DENIA_FORM_SWAP_MS, hasDeniaSkillForm, isDenia, isDeniaSkillBanner } from "./deniaSkillForm.js";
import { AEMEATH_SKILL_FORM, AEMEATH_SKILL_FORM_ASSET, AEMEATH_FORM_SWAP_MS, hasAemeathSkillForm, isAemeath, isAemeathVoyageBanner } from "./aemeathSkillForm.js";

const FORMS = [
  { form: DENIA_SKILL_FORM, asset: DENIA_SKILL_FORM_ASSET, swapMs: DENIA_FORM_SWAP_MS, matches: isDenia, triggers: isDeniaSkillBanner, fromHistory: hasDeniaSkillForm },
  { form: AEMEATH_SKILL_FORM, asset: AEMEATH_SKILL_FORM_ASSET, swapMs: AEMEATH_FORM_SWAP_MS, matches: isAemeath, triggers: isAemeathVoyageBanner, fromHistory: hasAemeathSkillForm }
];

export function battleSkillFormConfig(character) {
  return FORMS.find(config => config.matches(character));
}

export function battleFormBeforeCast(game, character, color) {
  const config = battleSkillFormConfig(character);
  return config?.fromHistory({ ...game, history: (game?.history ?? []).slice(0, -1) }, color) ? config.form : null;
}
