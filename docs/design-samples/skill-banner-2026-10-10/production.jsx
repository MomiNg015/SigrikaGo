import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import SkillBanner from '/src/modals/SkillBanner.jsx';
import { CHARACTERS } from '/src/shared/characters.js';
import '/src/styles.css';

function Preview() {
  const [characterId, setCharacterId] = useState('sigrika');
  const [cast, setCast] = useState(1);
  const [longName, setLongName] = useState(false);
  return <div className="app-shell player-theme-enabled theme-bright-school" style={{ minHeight: '100dvh' }}>
    <div style={{ position: 'fixed', top: 20, left: 16, right: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      <label>角色<select value={characterId} onChange={event => { setCharacterId(event.target.value); setCast(value => value + 1); }}>
        {Object.values(CHARACTERS).map(character => <option key={character.id} value={character.id}>{character.name}</option>)}
      </select></label>
      <button onClick={() => setCast(value => value + 1)}>重播</button>
      <button onClick={() => { setLongName(value => !value); setCast(value => value + 1); }}>长名称</button>
    </div>
    <SkillBanner characters={CHARACTERS} banner={{ id: `preview-${cast}`, characterId, ...(longName ? { skillName: '星辉符文与日灵共鸣' } : {}) }} audioSettings={{ master: 0, voice: 0 }} />
  </div>;
}

createRoot(document.getElementById('root')).render(<Preview />);
