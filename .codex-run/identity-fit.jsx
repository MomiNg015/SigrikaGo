import React from 'react';
import {createRoot} from 'react-dom/client';
import BattleUserIdentity from '../src/room/BattleUserIdentity.jsx';
const css=Object.keys(import.meta.glob('../dist/assets/index-*.css',{eager:true,query:'?url',import:'default'}));
const link=document.createElement('link');link.rel='stylesheet';link.href=css[0].replace('..','');document.head.append(link);
window.renderFit=(name,plate)=>createRootOnce.render(<div className="app-shell player-theme-enabled theme-bright-school"><section className="room-screen mobile-room-screen"><div className="mobile-room-viewport mobile-battle-layout" data-action-anchored><div className="mobile-player-slot mobile-opponent-slot opponent-side"><aside className="player-info opponent" data-paper-player><div className="portrait-wrap white-portrait"/><div className="player-meta"><div className="name-button player-name"><BattleUserIdentity user={{username:name,achievementEquipmentAssets:plate?{nameplate:{id:'reward-sigrika-spark-100-wins-nameplate',imageUrl:'/assets/achievements/semantic-nameplate.png'}}:{}}}/></div><span className="meta-tag rank-tag">9段</span><span className="color-badge white"/></div><div className="digital-timer">04:32</div></aside></div></div></section></div>);
const createRootOnce=createRoot(document.getElementById('root'));window.renderFit('moming',true);
