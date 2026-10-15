import React from 'react';
import {createRoot} from 'react-dom/client';
import {HouseReplayDialog} from '/src/modals/house/HouseNestedDialogs.jsx';
import {CHARACTERS} from '/src/shared/characters.js';
import '/src/styles.css';
const records = [28,128,1024,0,260,92,81,123].map((moveCount,i)=>({
  id:`replay-${i}`,createdAt:'2026-10-14T05:30:00Z',
  blackUserId:i%2?'other':'me',whiteUserId:i%2?'me':'other',
  blackName:i===1?'很长很长的围棋社玩家名字':'午后的围棋社',whiteName:i===2?'放学后来一局围棋吧':'放学后来一局',
  blackCharacter:'sigrika',whiteCharacter:'denia',moveCount,
  resultText:i===2?'白方超时获胜':i===3?'和棋':i%2?'白中盘胜':'黑中盘胜',winnerColor:i===3?null:i%2?'white':'black',
  rated:i!==1,mode:i===2?'team':'spark'
}));
window.openedReplay=null;
createRoot(document.getElementById('root')).render(<HouseReplayDialog titleStickers currentUser={{id:'me'}} characterListView={CHARACTERS} pagination={{records,loading:false,error:'',hasMore:false,onScroll:()=>{},retry:()=>{}}} onClose={()=>{}} onOpenReplay={id=>{window.openedReplay=id;}}/>);
