import { CHARACTERS } from '../../../src/shared/characters.js';

const params=new URLSearchParams(location.search);
export const fixture=params.get('fixture') || 'normal';
export const demoUser={id:'profile-surface-local-fixture',username:fixture==='long' ? '今天也想和西格莉卡下一盘棋' : '莫名',selectedCharacter:'sigrika',characterId:'sigrika',ownedCharacters:Object.keys(CHARACTERS),ownedDecorations:[],itemEffects:{},coins:1280,rank:'4段',stars:3,rating:1200,relation:'none',likeCount:24};
const records=[
  {characterId:'sigrika',total:62,wins:43,losses:17,draws:2},
  {characterId:'aemeath',total:38,wins:25,losses:12,draws:1},
  {characterId:'qiuyuan',total:18,wins:10,losses:8,draws:0},
  {characterId:'denia',total:10,wins:5,losses:5,draws:0}
];
export function profile(mode='spark') {
  const empty=fixture==='empty';
  const team=mode==='team';
  const skillMode=mode==='spark' || team;
  return {...demoUser,mode,rank:team ? '3段' : skillMode ? '4段' : '2段',stars:3,
    recordStats:empty ? {totalGames:0,wins:0,losses:0,draws:0} : team ? {totalGames:32,wins:21,losses:10,draws:1} : skillMode ? {totalGames:128,wins:83,losses:42,draws:3} : {totalGames:36,wins:21,losses:14,draws:1},
    recentResults:empty ? [] : ['win','loss','win','win','draw','loss','win','win','loss','win'],
    characterStats:empty || !skillMode ? [] : team ? records.map((record,index)=>({...record,total:[26,21,15,9][index],wins:[18,14,9,5][index],losses:[7,6,6,4][index],draws:[1,1,0,0][index]})) : records
  };
}
// Fixture requests stay inside this page; unknown API calls fail locally too.
const originalFetch=window.fetch.bind(window);
window.__surfaceRequests=[];
window.fetch=async(input,init)=>{
  const url=new URL(typeof input==='string' ? input : input.url,location.href);
  if(!url.pathname.startsWith('/api/')) return originalFetch(input,init);
  window.__surfaceRequests.push({path:url.pathname,method:init?.method || 'GET'});
  let data;
  if(url.pathname.endsWith('/profile')) data={profile:profile(url.searchParams.get('mode') || 'spark')};
  else if(url.pathname.endsWith('/capture-record')) data={record:fixture==='empty' ? null : {captures:86,ranking:12,characterId:'sigrika',costumeSnapshot:null}};
  else if(url.pathname.endsWith('/like')) data={likeCount:25,likedToday:true};
  else if(url.pathname.endsWith('/replays')) data={records:[],nextCursor:null};
  else if(url.pathname.endsWith('/report')) data={ok:true};
  else return new Response(JSON.stringify({error:'Unknown fixture endpoint'}),{status:501});
  return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
};
