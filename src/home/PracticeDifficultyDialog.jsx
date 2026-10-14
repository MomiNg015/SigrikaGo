import { useState } from "react";
import { Check, X } from "lucide-react";
import { ModalDialog } from "../modals/modalComponents.jsx";
import WindowTitleSticker from "../modals/WindowTitleSticker.jsx";
import { CHARACTERS } from "../shared/characters.js";
import { resolveCharacterPortrait } from "../shared/characterPortraits.js";
import { PRACTICE_DIFFICULTY_OPTIONS } from "../shared/practiceMode.js";
import MatchCharacterPicker from "./MatchCharacterPicker.jsx";
import MatchCharacterSlots from "./MatchCharacterSlots.jsx";

export default function PracticeDifficultyDialog({ characters, characterProps, onClose, onSelect }) {
  const [selectedDifficulty, setDifficulty] = useState("beginner");
  const [characterPickerOpen, setCharacterPickerOpen] = useState(false);
  const canStart = characterProps.available.some(character => character.id === characterProps.selected);
  const start = () => { if (canStart) onSelect(selectedDifficulty); };
  return <div className="nested-modal-backdrop practice-difficulty-backdrop" onClick={event => {
    event.stopPropagation();
    if (event.target === event.currentTarget) onClose();
  }}>
    <ModalDialog ariaLabelledBy="practice-difficulty-title" className="nested-modal practice-difficulty-modal window-sticker-host practice-dialog-sheet"
      onClick={event => event.stopPropagation()} onClose={onClose}>
      <div className="practice-sheet-title"><WindowTitleSticker titleKey="practice" id="practice-difficulty-title" /></div>
      <div className="practice-sheet-controls">
        <div className="practice-sheet-character"><span>出战角色</span>
          <MatchCharacterSlots entry="practice" title="准时宝对局" selections={[characterProps.selected]} characters={characters} user={characterProps.user} onOpen={() => setCharacterPickerOpen(true)} />
        </div>
        <button className="close-button" type="button" aria-label="关闭准时宝陪练" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="practice-sheet-form">
        <div className="practice-difficulty-options" aria-label="选择难度">
          {PRACTICE_DIFFICULTY_OPTIONS.map((difficulty, index) => <button key={difficulty.id} type="button"
            className={`practice-difficulty-option practice-difficulty-${difficulty.id}`} aria-pressed={difficulty.id === selectedDifficulty}
            onClick={() => setDifficulty(difficulty.id)}>
            <span className="practice-difficulty-index" aria-hidden="true">0{index + 1}</span>
            <span className="practice-difficulty-copy"><strong>{difficulty.label}</strong><small>{difficulty.description}</small></span>
            {difficulty.id === selectedDifficulty && <Check size={20} aria-hidden="true" />}
          </button>)}
        </div>
        <button className="primary-action practice-sheet-start" type="button" disabled={!canStart} onClick={start}>开始准时宝对局</button>
      </div>
      <div className="practice-sheet-dialogue">
        <div className="practice-sheet-bubble">随机猜先。吃掉准时宝22个子或数子胜就算胜利！</div>
        <div className="practice-sheet-bust"><img src={resolveCharacterPortrait(CHARACTERS.sigrika)} width="832" height="1216" alt="西格莉卡" /></div>
      </div>
    </ModalDialog>
    {characterPickerOpen && <MatchCharacterPicker {...characterProps} startLabel="开始准时宝对局" onConfirm={start} onClose={() => setCharacterPickerOpen(false)} />}
  </div>;
}
