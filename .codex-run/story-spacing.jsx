import React from 'react';
import {createRoot} from 'react-dom/client';
import StoryPlayerModal from '/src/modals/StoryPlayerModal.jsx';
import {CHARACTERS} from '/src/shared/characters.js';
import '/src/styles.css';
const count=Number(new URLSearchParams(location.search).get('count')||3);
const labels=['其实我完全不会下围棋……','略懂一点','我超强的哦！'];
const script={startNodeId:'start',nodes:[{id:'start',nextNodeId:'end',characterId:'sigrika',speakerName:'西格莉卡',text:'太好啦，欢迎加入围棋部！对了，moming以前接触过围棋吗？',options:Array.from({length:count},(_,i)=>({label:labels[i%3],nextNodeId:'end'}))},{id:'end',characterId:'sigrika',text:'继续'}]};
createRoot(document.getElementById('root')).render(<div className="app-shell player-theme-enabled theme-bright-school"><StoryPlayerModal script={script} characters={CHARACTERS} typewriterDisabled onClose={()=>{}} /></div>);
