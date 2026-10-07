import { X } from "lucide-react";
import { ModalDialog } from "../modals/modalComponents.jsx";
import MatchCharacterCardContent from "./MatchCharacterCardContent.jsx";

export default function MatchCharacterPicker({ available, selected, user, onSelect, onClose }) {
  return <div className="modal-backdrop match-character-backdrop">
    <ModalDialog className="small-modal match-character-picker" ariaLabel="选择角色" onClose={onClose}>
      <header className="team-lineup-heading"><h2>选择角色</h2><button type="button" aria-label="关闭选择角色" onClick={onClose}><X size={20} /></button></header>
      <div className="team-character-options">
        {available.map((character) => <button className="team-character-option" type="button" key={character.id} aria-label={character.name} aria-pressed={selected === character.id} onClick={() => onSelect(character.id)}>
          <MatchCharacterCardContent character={character} user={user} />
        </button>)}
      </div>
      {!available.length && <p>暂无可用角色</p>}
    </ModalDialog>
  </div>;
}
