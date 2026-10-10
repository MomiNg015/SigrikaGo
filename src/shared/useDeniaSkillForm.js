import { DENIA_SKILL_FORM } from "./deniaSkillForm.js";
import { useBattleSkillForm } from "./useBattleSkillForm.js";

// Preserve the Denia-only API while sharing timer and history lifecycle.
export function useDeniaSkillForm(...args) {
  const form = useBattleSkillForm(...args);
  return form === DENIA_SKILL_FORM ? form : null;
}
