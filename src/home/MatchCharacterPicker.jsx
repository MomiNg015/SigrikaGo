import { X } from "lucide-react";
import { ModalDialog } from "../modals/modalComponents.jsx";
import MatchCharacterOption from "./MatchCharacterOption.jsx";
import { playMatchSortieVoice } from "./matchSortieVoice.js";

export default function MatchCharacterPicker({ available, blocked = [], selected, user, audioSettings, onSelect, onClose, onConfirm, startLabel, cancellation }) {
  return <div className="modal-backdrop match-character-backdrop">
    <ModalDialog className="small-modal match-character-picker" ariaLabel="选择角色" onClose={onClose}>
      <header className="team-lineup-heading"><h2>选择角色</h2><button type="button" aria-label="关闭选择角色" onClick={onClose}><X size={20} /></button></header>
      <div className="team-character-options">
        {[...available, ...blocked].map((character) => <MatchCharacterOption key={character.id} character={character}
          user={user} selected={selected === character.id} selectionStamp={selected === character.id ? "flag" : undefined}
          disabled={blocked.some(entry => entry.id === character.id)} cancellation={cancellation}
          onSelect={() => { playMatchSortieVoice(character, user, audioSettings); onSelect(character.id); }} />)}
      </div>
      {!available.length && <p>暂无可用角色</p>}
      {onConfirm && <button className="primary-action match-character-start" data-button-role="primary" type="button"
        disabled={!available.some(character => character.id === selected)} onClick={onConfirm}>{startLabel}</button>}
    </ModalDialog>
  </div>;
}
