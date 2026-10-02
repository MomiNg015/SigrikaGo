import React from 'react';
import {createRoot} from 'react-dom/client';
import ResumeModal from '/src/modals/ResumeModal.jsx';
import {UserProfileCard} from '/src/modals/UserProfileCard.jsx';
import {CHARACTERS} from '/src/shared/characters.js';
import '/src/styles.css';
const p=new URLSearchParams(location.search);
const user={id:'qa-user',username:'测试部员',characterId:'sigrika',selectedCharacter:'sigrika',rank:'18级',mode:'spark',characterStats:p.has('records')?[{characterId:'sigrika',total:2,wins:1,losses:1,draws:0}]:[],recordStats:{totalGames:0,wins:0,losses:0,draws:0}};
createRoot(document.getElementById('root')).render(<div className="app-shell player-theme-enabled theme-bright-school">{p.get('context')==='social'?<UserProfileCard token="qa-token" titleStickers={!p.has('plain')} user={user} characters={CHARACTERS} onClose={()=>{}}/>:<ResumeModal token="qa-token" user={user} characterListView={CHARACTERS} onClose={()=>{}}/>}</div>);
