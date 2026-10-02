import React from 'react';
import { createRoot } from 'react-dom/client';
import HomeScreen from '../src/home/HomeScreen.jsx';
import { CHARACTERS } from '../src/shared/characters.js';
import '../src/styles.css';
function Preview() {
  const [open, setOpen] = React.useState(true);
  return <div className="app-shell player-theme-enabled theme-bright-school"><HomeScreen user={{username:'预览',selectedCharacter:'sigrika',role:'player'}} characters={CHARACTERS} matchModePickerOpen={open} onMatchModePickerOpenChange={setOpen} onStartMatch={()=>{}} onStartPractice={()=>{}} /></div>;
}
createRoot(document.getElementById('root')).render(<Preview/>);
