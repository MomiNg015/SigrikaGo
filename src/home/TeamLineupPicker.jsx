import { useState } from "react";
import { X } from "lucide-react";
import { ModalDialog, ModalActionButton } from "../modals/modalComponents.jsx";
import { characterListFromCatalog } from "../shared/characters.js";
import { canonicalCharacterId } from "../shared/characterAliases.js";
import { characterPortraitImageProps } from "../shared/characterPortraits.js";
import { characterSortieDisabledReason } from "../modals/house/houseStats.js";
import { normalizeTeamLineup } from "../shared/teamMatch.js";
import WindowTitleSticker from "../modals/WindowTitleSticker.jsx";

const ROUND_MOVE_RANGES = ["0-40手", "41-80手", "81手-终局"];

export function availableTeamCharacters(user, characters) {
  const owned = new Set((user.ownedCharacters ?? []).map(canonicalCharacterId));
  return characterListFromCatalog(characters).filter((character) => owned.has(character.id)
    && character.enabled !== false && !characterSortieDisabledReason(character.id, user.itemEffects));
}

export default function TeamLineupPicker({ user, characters, onClose, onStart }) {
  const available = availableTeamCharacters(user, characters);
  const availableIds = new Set(available.map((character) => character.id));
  const storageKey = `sigrika-team-lineup:${user.id}`;
  const [selected, setSelected] = useState(() => {
    try { return [...new Set(normalizeTeamLineup(JSON.parse(localStorage.getItem(storageKey))))].filter((id) => availableIds.has(id)).slice(0, 3); }
    catch { return []; }
  });
  const lineup = selected.filter((id) => availableIds.has(id));
  function update(next) {
    setSelected(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Storage is optional. */ }
  }
  return <div className="modal-backdrop">
    <ModalDialog className="team-lineup-picker window-sticker-host" ariaLabel="队际赛阵容" onClose={onClose}>
      <header className="team-lineup-heading window-sticker-header"><WindowTitleSticker titleKey="team-lineup" /><button type="button" aria-label="关闭队际赛阵容" onClick={onClose}><X size={20} /></button></header>
      <div className="team-lineup-content">
      <div className="team-lineup-slots">
        {[0, 1, 2].map((index) => {
          const character = characters[lineup[index]];
          return <section key={index} className="team-lineup-slot" aria-label={`第${index + 1}位`}>
            <div className="team-lineup-round"><strong>Round {index + 1}</strong><span>({ROUND_MOVE_RANGES[index]})</span></div>
            <div className="team-lineup-image">{character ? <img {...characterPortraitImageProps(character, { user, itemEffects: user.itemEffects })} alt={character.name} /> : <span>?</span>}</div>
            <span className="team-lineup-name" title={character?.name}>{character?.name ?? ""}</span>
          </section>;
        })}
      </div>
      <div className="team-character-options">
        {available.map((character) => <button className="team-character-option" type="button" key={character.id} aria-label={character.name} aria-pressed={lineup.includes(character.id)} disabled={lineup.length === 3 && !lineup.includes(character.id)} onClick={() => update(lineup.includes(character.id) ? lineup.filter((id) => id !== character.id) : [...lineup, character.id])}>
          <img {...characterPortraitImageProps(character, { user, itemEffects: user.itemEffects })} alt="" />
          <span>{character.name}</span>{lineup.includes(character.id) && <b className="team-order-badge" aria-label={`第${lineup.indexOf(character.id) + 1}位`}>{lineup.indexOf(character.id) + 1}</b>}
        </button>)}
      </div>
      </div>
      <ModalActionButton disabled={lineup.length !== 3} onClick={() => onStart("team", lineup)}>开始匹配</ModalActionButton>
    </ModalDialog>
  </div>;
}
