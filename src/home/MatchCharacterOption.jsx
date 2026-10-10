import { CandyOff } from "lucide-react";
import MatchCharacterCardContent from "./MatchCharacterCardContent.jsx";
import { activeCharacterItemEffects } from "../shared/characterCandyEffects.js";

export default function MatchCharacterOption({ character, user, selected, selectionStamp, disabled, onSelect,
  cancellation, children }) {
  const effects = activeCharacterItemEffects(character.id, user?.itemEffects);
  return <div className="match-character-option-wrap" data-selected={Boolean(selected)}>
    <button className="team-character-option" type="button" aria-label={character.name}
      aria-pressed={Boolean(selected)} disabled={disabled} onClick={onSelect}>
      <MatchCharacterCardContent character={character} user={user} selectionStamp={selectionStamp} />
      {children}
    </button>
    {cancellation?.enabled && effects.length > 0 && <button type="button" className="match-character-candy-cancel"
      aria-label={`取消${character.name}的糖果效果`} title="取消糖果效果（仅开发环境）"
      disabled={Boolean(cancellation.pending) && cancellation.pending !== character.id}
      aria-disabled={Boolean(cancellation.pending)} aria-busy={cancellation.pending === character.id}
      onClick={() => { if (!cancellation.pending) cancellation.cancel(character.id); }}>
      <CandyOff size={20} aria-hidden="true" />
    </button>}
  </div>;
}
