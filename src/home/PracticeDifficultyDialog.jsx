import { lazy, Suspense, useState } from "react";
import { Circle, Trophy, X } from "lucide-react";
import { ModalDialog } from "../modals/modalComponents.jsx";
import WindowTitleSticker from "../modals/WindowTitleSticker.jsx";
import { CHARACTERS } from "../shared/characters.js";
import { resolveCharacterPortrait } from "../shared/characterPortraits.js";
import { PRACTICE_DIFFICULTY_OPTIONS } from "../shared/practiceMode.js";
import { storySpriteUrl } from "../shared/characterStorySprites.js";
import { CAPTURE_CHALLENGE_MODE } from "../shared/captureChallenge.js";
import MatchCharacterPicker from "./MatchCharacterPicker.jsx";
import MatchCharacterSlots from "./MatchCharacterSlots.jsx";

const LeaderboardModal = lazy(() => import("../modals/LeaderboardModal.jsx"));

export default function PracticeDifficultyDialog({ token, characters, characterProps, options, onClose, onSelect }) {
  const [characterPickerOpen, setCharacterPickerOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const { mode, difficulty, update } = options;
  const capture = mode === CAPTURE_CHALLENGE_MODE;
  const canStart = Boolean(mode) && characterProps.available.some(character => character.id === characterProps.selected);
  const level = PRACTICE_DIFFICULTY_OPTIONS.find(entry => entry.id === difficulty);
  const levelLabel = difficulty === "beginner" ? "初级" : level.label;
  const cycleDifficulty = () => update({ mode: "practice", difficulty: PRACTICE_DIFFICULTY_OPTIONS[(PRACTICE_DIFFICULTY_OPTIONS.indexOf(level) + 1) % PRACTICE_DIFFICULTY_OPTIONS.length].id });
  const start = () => {
    if (canStart) onSelect({ difficulty: capture ? "advanced" : difficulty, playerColor: "random", characterId: characterProps.selected, ...(capture ? { challenge: CAPTURE_CHALLENGE_MODE } : {}) });
  };
  const dialogue = capture ? "随机猜先。在100手内尽可能多地提掉准时宝的棋子吧！吃得越多分数越高！"
    : mode ? "随机猜先。吃掉准时宝22个子或数子胜就算胜利！" : "今天想找准时宝做什么呢？";
  return <div className="nested-modal-backdrop practice-difficulty-backdrop" onClick={event => {
    event.stopPropagation();
    if (event.target === event.currentTarget) {
      if (leaderboardOpen) setLeaderboardOpen(false);
      else onClose();
    }
  }}>
    <ModalDialog ariaLabelledBy="practice-difficulty-title" className="nested-modal practice-difficulty-modal window-sticker-host practice-dialog-sheet"
      inert={characterPickerOpen ? true : undefined}
      onClick={event => event.stopPropagation()} onClose={onClose}>
      <div className="practice-sheet-title"><WindowTitleSticker titleKey="practice" id="practice-difficulty-title" /></div>
      <div className="practice-sheet-controls">
        <div className="practice-sheet-character"><span>出战角色</span>
          <MatchCharacterSlots entry="practice" title="准时宝对局" selections={[characterProps.selected]} characters={characters} user={characterProps.user} onOpen={() => setCharacterPickerOpen(true)} />
        </div>
        <button className="close-button" type="button" aria-label="关闭准时宝陪练" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="practice-sheet-form">
        <div className="practice-difficulty-options" role="group" aria-label="选择陪练模式">
          <div className="practice-mode-card">
            <button className="practice-difficulty-option" type="button" aria-pressed={mode === "practice"} onClick={() => update({ mode: "practice" })}>沙包陪练</button>
            <button className={`practice-mode-tool practice-level-button practice-level-${difficulty}`} type="button" aria-label={`陪练等级：${levelLabel}，点击切换`} onClick={cycleDifficulty}>
              <Circle className="practice-level-icon" size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" /><span>{levelLabel}</span>
            </button>
          </div>
          <div className="practice-mode-card">
            <button className="practice-difficulty-option" type="button" aria-pressed={capture} onClick={() => update({ mode: CAPTURE_CHALLENGE_MODE })}>吃子挑战赛</button>
            <button className="practice-mode-tool practice-ranking-button" type="button" aria-label="吃子挑战赛排行榜" title="吃子挑战赛排行榜" onClick={() => setLeaderboardOpen(true)}><Trophy size={20} aria-hidden="true" /></button>
          </div>
        </div>
        <button className="primary-action practice-sheet-start" type="button" disabled={!canStart} onClick={start}>START！</button>
      </div>
      <div className="practice-sheet-dialogue">
        <div className="practice-sheet-bubble" aria-live="polite">{dialogue}</div>
        <div className="practice-sheet-bust"><img src={capture ? storySpriteUrl("sigrika", "surprised") : resolveCharacterPortrait(CHARACTERS.sigrika)} width="832" height="1216" alt={capture ? "西格莉卡（惊讶）" : "西格莉卡"} /></div>
      </div>
    </ModalDialog>
    {characterPickerOpen && <MatchCharacterPicker {...characterProps} onClose={() => setCharacterPickerOpen(false)} />}
    {leaderboardOpen && <Suspense fallback={null}><LeaderboardModal captureOnly token={token} user={characterProps.user} characters={characters} onClose={() => setLeaderboardOpen(false)} /></Suspense>}
  </div>;
}
