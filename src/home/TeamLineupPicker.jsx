import { useState } from "react";
import { X } from "lucide-react";
import { ModalDialog, ModalActionButton } from "../modals/modalComponents.jsx";
import { characterListFromCatalog } from "../shared/characters.js";
import { canonicalCharacterId } from "../shared/characterAliases.js";
import MatchCharacterPortrait from "./MatchCharacterPortrait.jsx";
import MatchCharacterOption from "./MatchCharacterOption.jsx";
import { activeCharacterItemEffects } from "../shared/characterCandyEffects.js";
import { characterSortieDisabledReason } from "../modals/house/houseStats.js";
import { teamLineupSlots, toggleTeamMember } from "./teamLineupSlots.js";
import { playMatchSortieVoice } from "./matchSortieVoice.js";
import WindowTitleSticker from "../modals/WindowTitleSticker.jsx";

const ROUND_MOVE_RANGES = ["0-40手", "41-80手", "81手-终局"];

export function availableTeamCharacters(user, characters) {
  const owned = new Set((user.ownedCharacters ?? []).map(canonicalCharacterId));
  return characterListFromCatalog(characters).filter((character) => owned.has(character.id)
    && character.enabled !== false && !characterSortieDisabledReason(character.id, user.itemEffects));
}

export function candyBlockedCharacters(user, characters, available) {
  const ids = new Set(available.map(character => character.id));
  return characterListFromCatalog(characters).filter(character => character.enabled !== false
    && user.ownedCharacters?.includes(character.id) && !ids.has(character.id)
    && activeCharacterItemEffects(character.id, user.itemEffects).length);
}

export default function TeamLineupPicker({ user, characters, audioSettings, onClose, onStart, initialLineup, onChange, cancellation }) {
  const available = availableTeamCharacters(user, characters);
  const availableIds = new Set(available.map((character) => character.id));
  const storageKey = `sigrika-team-lineup:${user.id}`;
  const [selected, setSelected] = useState(() => {
    try { return teamLineupSlots(initialLineup ?? JSON.parse(localStorage.getItem(storageKey)), availableIds); }
    catch { return teamLineupSlots([]); }
  });
  const lineup = teamLineupSlots(selected, availableIds);
  function update(next) {
    setSelected(next);
    onChange?.(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Storage is optional. */ }
  }
  return <div className="modal-backdrop">
    <ModalDialog className="team-lineup-picker window-sticker-host" ariaLabel="队际赛阵容" onClose={onClose}>
      <header className="team-lineup-heading window-sticker-header"><WindowTitleSticker titleKey="team-lineup" /><button type="button" aria-label="关闭队际赛阵容" onClick={onClose}><X size={20} /></button></header>
      <div className="team-lineup-slots">
        {[0, 1, 2].map((index) => {
          const character = characters[lineup[index]];
          return <button type="button" key={index} className="team-lineup-slot" data-filled={Boolean(character)}
            aria-label={character ? `取消第${index + 1}位：${character.name}` : `第${index + 1}位待选`}
            onClick={() => { if (character) update(lineup.map((id, position) => position === index ? "" : id)); }}>
            <span className="team-lineup-round"><strong>Round {index + 1}</strong><span>{ROUND_MOVE_RANGES[index]}</span></span>
            <span className="team-lineup-image">{character ? <MatchCharacterPortrait character={character} user={user} /> : <img className="team-lineup-empty-card" src="/assets/home/character-selection-id-v4.png" alt="" aria-hidden="true" />}</span>
            <span className="team-lineup-name" title={character?.name}>{character?.name ?? ""}</span>
          </button>;
        })}
      </div>
      <div className="team-lineup-content">
      <div className="team-character-options">
        {[...available, ...candyBlockedCharacters(user, characters, available)].map((character) => <MatchCharacterOption
          key={character.id} character={character} user={user} selected={lineup.includes(character.id)}
          disabled={!availableIds.has(character.id) || (lineup.every(Boolean) && !lineup.includes(character.id))}
          cancellation={cancellation} selectionStamp={lineup.includes(character.id) ? lineup.indexOf(character.id) + 1 : undefined} onSelect={() => {
          if (!lineup.includes(character.id)) playMatchSortieVoice(character, user, audioSettings);
          update(toggleTeamMember(lineup, character.id));
        }} />)}
      </div>
      </div>
      <ModalActionButton disabled={!lineup.every(Boolean)} onClick={() => { if (lineup.every(Boolean)) onStart("team", lineup); }}>开始队际赛匹配</ModalActionButton>
    </ModalDialog>
  </div>;
}
