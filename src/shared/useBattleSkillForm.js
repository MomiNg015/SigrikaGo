import { useEffect, useState } from "react";
import { currentBattleRound } from "./deniaSkillForm.js";
import { battleSkillFormConfig } from "./battleSkillForm.js";

export function useBattleSkillForm(game, characterId, color, round = currentBattleRound(game)) {
  const config = battleSkillFormConfig(characterId);
  const pending = game?.pendingSkill;
  const id = config && pending?.id && config.matches(pending.character ?? pending.characterId)
    && pending.color === color && round === currentBattleRound(game) ? pending.id : null;
  const triggers = Boolean(id && config.triggers(pending));
  const [revealedId, setRevealedId] = useState(null);
  useEffect(() => {
    if (!config) return undefined;
    const image = new Image();
    image.src = config.asset;
    if (!triggers) return undefined;
    const timer = setTimeout(() => setRevealedId(id), config.swapMs);
    return () => clearTimeout(timer);
  }, [config, id, triggers]);
  return config && (config.fromHistory(game, color, round)
    || (id && (pending.battleFormBeforeCast === config.form || (triggers && revealedId === id)))) ? config.form : null;
}
