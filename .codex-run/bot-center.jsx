import React from 'react';
import {createRoot} from 'react-dom/client';
import PlayerInfo from '../src/room/PlayerInfo.jsx';
import {CHARACTERS} from '../src/shared/characters.js';
const css=Object.keys(import.meta.glob('../dist/assets/index-*.css',{eager:true,query:'?url',import:'default'}));const link=document.createElement('link');link.rel='stylesheet';link.href='/dist/assets/index-BaQpWlFm.css';document.head.append(link);
const root=createRoot(document.getElementById('root'));
window.renderBot=(bot,time={main:300})=>root.render(<div className="app-shell player-theme-enabled theme-bright-school"><section className="room-screen mobile-room-screen"><div className="mobile-room-viewport mobile-battle-layout" data-action-anchored><div className="mobile-player-slot mobile-opponent-slot opponent-side"><PlayerInfo player={{isBot:bot,character:bot?null:CHARACTERS.sigrika,characterId:bot?null:'sigrika',color:'white',user:{username:bot?'准时宝':'moming',rank:'3段'},time, captures:0}} game={{mode:'standard',phase:'playing',turn:'black',skillUses:{white:1},skillCosts:{white:0}}} characters={CHARACTERS} align="opponent"/></div></div></section></div>);window.renderBot(true);

