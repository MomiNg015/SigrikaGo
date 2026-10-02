import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '/src/styles.css';
import HouseModal from '/src/modals/HouseModal.jsx';
import { characterList } from '/src/shared/characters.js';
function Preview() {
  const [user, setUser] = useState({id: 1, selectedCharacter: 'sigrika', ownedCharacters: characterList.map(c => c.id), ownedDecorations: [], itemEffects: {}});
  return <div className="app-shell player-theme-enabled theme-bright-school" style={{ minHeight: '100dvh' }}><HouseModal user={user} characterListView={characterList} audioSettings={{ muted: true }} musicTracks={[]} onClose={() => {}} onSelectCharacter={id => setUser({...user, selectedCharacter: id})} onApplyDecoration={async () => {}} /></div>;
}
createRoot(document.getElementById('root')).render(<Preview />);
