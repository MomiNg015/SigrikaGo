import { useEffect, useState } from "react";
import { DENIA_FORM_SWAP_MS, DENIA_SKILL_FORM, DENIA_SKILL_FORM_ASSET, currentBattleRound, hasDeniaSkillForm, isDenia, isDeniaSkillBanner } from "./deniaSkillForm.js";

export function useDeniaSkillForm(game, characterId, color, round = currentBattleRound(game)) {
  const pending = game?.pendingSkill;
  const eligible = isDenia(characterId);
  const id = eligible && isDeniaSkillBanner(pending) && pending.color === color
    && round === currentBattleRound(game) ? pending.id : null;
  const [revealedId, setRevealedId] = useState(null);
  useEffect(() => {
    if (!eligible) return undefined;
    const image = new Image();
    image.src = DENIA_SKILL_FORM_ASSET;
    if (!id) return undefined;
    const timer = setTimeout(() => setRevealedId(id), DENIA_FORM_SWAP_MS);
    return () => clearTimeout(timer);
  }, [eligible, id]);
  return eligible && (hasDeniaSkillForm(game, color, round)
    || (id && (revealedId === id || pending.battleFormBeforeCast === DENIA_SKILL_FORM))) ? DENIA_SKILL_FORM : null;
}
