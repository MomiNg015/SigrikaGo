import React from 'react';
import {createRoot} from 'react-dom/client';
import HomeScreen from '/src/home/HomeScreen.jsx';
import {CHARACTERS} from '/src/shared/characters.js';
import '/src/styles.css';
createRoot(document.getElementById('root')).render(<div className="app-shell player-theme-enabled theme-bright-school"><HomeScreen user={{id:'preview',username:'moming',selectedCharacter:'sigrika'}} characters={CHARACTERS} audioSettings={{}} /></div>);
