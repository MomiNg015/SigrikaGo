import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { X, Check } from 'lucide-react';
import { ModalDialog } from '../../../src/modals/modalComponents.jsx';
import MatchCharacterPicker from '../../../src/home/MatchCharacterPicker.jsx';
import MatchCharacterPortrait from '../../../src/home/MatchCharacterPortrait.jsx';
import { CHARACTERS } from '../../../src/shared/characters.js';
import { PRACTICE_DIFFICULTY_OPTIONS } from '../../../src/shared/practiceMode.js';
import { resolveCharacterPortrait } from '../../../src/shared/characterPortraits.js';
import '../../../src/styles.css';
import './preview.css';

const user = { id: 'practice-design-preview', ownedCharacters: Object.keys(CHARACTERS) };
const available = Object.values(CHARACTERS).filter(character => character.enabled !== false);
const voiceMuted = { master: 0, voice: 0 };

function Preview() {
  const [open, setOpen] = useState(true);
  const [difficulty, setDifficulty] = useState('beginner');
  const [characterId, setCharacterId] = useState('sigrika');
  const [picking, setPicking] = useState(false);
  const [started, setStarted] = useState('');
  const character = CHARACTERS[characterId];
  const start = () => {
    setPicking(false);
    setOpen(false);
    setStarted(`${character.name} · ${PRACTICE_DIFFICULTY_OPTIONS.find(item => item.id === difficulty).label}`);
  };
  return <div className="app-shell player-theme-enabled theme-bright-school pp-root">
    <div className="pp-preview-bar"><span>准时宝陪练 · 设计样板</span><button onClick={() => { setOpen(true); setStarted(''); }}>重新打开</button></div>
    {!open && <div className="pp-dismissed"><p>{started ? `已选择：${started}` : '窗口已关闭'}</p><button onClick={() => setOpen(true)}>返回预览</button>{started && <small>样板演示，不创建实际对局</small>}</div>}
    {open && <div className="pp-backdrop">
      <ModalDialog className="pp-window" ariaLabel="准时宝陪练" onClose={() => setOpen(false)}>
        <h2 className="pp-title"><span>准时宝陪练</span><img src="/assets/window-titles/practice.webp" alt="" /></h2>
        <div className="pp-controls">
          <button className="pp-character" aria-label={`出战角色：${character.name}`} onClick={() => setPicking(true)}>
            <span>出战角色</span><span className="pp-character-frame"><MatchCharacterPortrait character={character} user={user} avatar /></span>
          </button>
          <button className="pp-close" aria-label="关闭准时宝陪练" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <div className="pp-form">
          <div className="pp-difficulties" aria-label="选择难度">
            {PRACTICE_DIFFICULTY_OPTIONS.map((item, index) => <button key={item.id} className="pp-difficulty" aria-pressed={difficulty === item.id} onClick={() => setDifficulty(item.id)}>
              <span className="pp-number">0{index + 1}</span><span className="pp-difficulty-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
              {difficulty === item.id && <Check size={20} aria-hidden="true" />}
            </button>)}
          </div>
          <button className="pp-start" onClick={start}>开始准时宝对局</button>
        </div>
        <div className="pp-dialogue-stage">
          <div className="pp-bubble">随机猜先。吃掉准时宝22个子或数子胜就算胜利！</div>
          <div className="pp-bust"><img src={resolveCharacterPortrait(CHARACTERS.sigrika)} alt="西格莉卡" /></div>
        </div>
      </ModalDialog>
      {picking && <MatchCharacterPicker available={available} selected={characterId} user={user} audioSettings={voiceMuted} onSelect={setCharacterId} onClose={() => setPicking(false)} onConfirm={start} startLabel="开始准时宝对局" />}
    </div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<Preview />);
