import { CHARACTERS } from '../../../src/shared/characters.js';
import { rooms as sampleRooms } from '../watch-mobile-2026-10-13/fixtures.js';
const query = new URLSearchParams(location.search);
const empty = query.get('fixture') === 'empty';
const long = query.get('fixture') === 'long';
export const user = { id:'material-preview', username:long?'今天也想和大家下一盘棋':'莫名', selectedCharacter:'sigrika', characterId:'sigrika', ownedCharacters:Object.keys(CHARACTERS), ownedCostumeIds:[], equippedCostumes:{}, ownedDecorations:[], itemEffects:{}, coins:1280, rank:'4段', stars:3, rating:1200, relation:'none', likeCount:24 };
const records = [['sigrika',62,43,17,2],['aemeath',38,25,12,1],['qiuyuan',18,10,8,0],['denia',10,5,5,0]].map(([characterId,total,wins,losses,draws])=>({characterId,total,wins,losses,draws}));
export function profile(mode='spark', person=user) {
  return {...user,...person,mode,recordStats:empty?{totalGames:0,wins:0,losses:0,draws:0}:{totalGames:128,wins:83,losses:42,draws:3},recentResults:empty?[]:['win','loss','win','win','draw','loss','win','win','loss','win'],characterStats:empty?[]:records};
}
let friends = empty?[]:[['xiaoman','小满','sigrika','online'],['wanfeng','晚风','denia','online'],['qiu','秋日来信','qiuyuan','playing'],['lynae','沿着星轨去旅行','lynae','online'],['chisa','千咲','chisa','offline'],['mornye','午后的白日梦','mornye','offline']].map(([id,username,characterId,status])=>({id,username:long?username+'今天还想再下一盘':username,characterId,status,itemEffects:{}}));
let blacklist = [{id:'guest',username:'陌生棋手',characterId:'nabomo',status:'offline'}];
let inventory = empty?[]:[['rainbow-bean-candy','彩虹豆豆跳跳糖','rainbow-bean-candy.webp',3,'character',true],['campus-recruitment-poster','招募海报','recruitment-poster.webp',5,'self',false],['radio-recruitment-ticket','电台招募券','radio-recruitment-ticket.webp',2,'self',false],['aemeath-flight-snow-memorial-ticket','飞行雪纪念票','aemeath-flight-snow-memorial-ticket.webp',1,'self',false],['magic-clock','魔法时钟','magic-clock.svg',2,'self',false],['gacha-coin-bag','金币袋','gacha-coin-bag.svg',1,'self',true]].map(([itemId,name,image,quantity,targetType,usable])=>({itemId,name:long?name+'特别珍藏纪念版':name,quantity,targetType,usable,actionVisible:itemId!=='magic-clock',imageUrl:'/assets/items/'+image,description:(itemId==='rainbow-bean-candy'?'给部员尝一颗，开启一段意想不到的故事。':name+'，可在对应的道具流程中使用。').repeat(long?12:1)}));
const achievements = [['首次对弈','完成你的第一场对弈。'],['百战历练','累计完成 100 场对弈。'],['围棋新星','在升降级赛达到四段。'],['社团伙伴','结识更多围棋部的朋友。']].map(([name,content],i)=>({id:'demo-'+i,name,content,achieved:false,reward:null}));
const notices = [{id:'welcome',title:'星炬学院围棋部 · 社团活动',kind:'announcement',pinned:true,isUnread:true,firstPublishedAt:'2026-10-22T08:00:00Z',body:'欢迎来到星炬学院围棋部。\n\n在这里，你可以参加常规匹配，尝试吃子挑战，或与熟悉的伙伴展开一场对弈。\n\n## 本周社团活动\n\n- 前往观战窗口，看看其他同学的精彩对局。\n- 在部员手册里了解角色的技能与故事。\n- 打开自己的履历，回顾最近的对弈记录。\n\n每一步，都是新的开始。'}, {id:'log',title:'校园日志 · 对弈与伙伴',kind:'changelog',firstPublishedAt:'2026-10-21T08:00:00Z',isUnread:false,body:'本页为背景材质的本地阅读样例。'}];
const nativeFetch = window.fetch.bind(window);
window.__sampleRequests=[];
window.fetch = async (input,options={})=>{
  const url=new URL(input instanceof Request?input.url:String(input),location.href);
  if(!url.pathname.startsWith('/api/'))return nativeFetch(input,options);
  const path=url.pathname;
  window.__sampleRequests.push({path,method:options.method||'GET'});
  let data;
  if(path==='/api/social') data={friends,blacklist};
  else if(path.startsWith('/api/social/')) {
    const id=path.split('/').at(-1);
    if(path.includes('/friends/'))friends=options.method==='DELETE'?friends.filter(x=>x.id!==id):[...friends,{...user,id}];
    else blacklist=options.method==='DELETE'?blacklist.filter(x=>x.id!==id):[...blacklist,{...user,id}];
    data={friends,blacklist};
  }
  else if(path.endsWith('/profile'))data={profile:profile(url.searchParams.get('mode')||'spark',friends.find(x=>x.id===path.split('/')[3])||user)};
  else if(path.endsWith('/capture-record'))data={record:empty?null:{captures:86,ranking:12,characterId:'sigrika',costumeSnapshot:null}};
  else if(path.endsWith('/like'))data={likeCount:25,likedToday:true};
  else if(path.endsWith('/replays'))data={records:[],nextCursor:null};
  else if(path.endsWith('/report'))data={ok:true};
  else if(path==='/api/items/inventory')data={items:inventory};
  else if(path.startsWith('/api/items/')&&path.endsWith('/use')){const id=path.split('/')[3];inventory=inventory.map(i=>i.itemId===id?{...i,quantity:i.quantity-1}:i).filter(i=>i.quantity>0);data={items:inventory,user};}
  else if(path==='/api/rooms/watch')data={rooms:empty?[]:long?sampleRooms.map(room=>({...room,black:{...room.black,user:{...room.black.user,username:'每天放学以后都想和大家再下一盘棋'}},moveNumber:1024,onlineCount:128})):sampleRooms};
  else if(path==='/api/achievements')data={achievements:empty?[]:long?achievements.map(a=>({...a,content:a.content.repeat(12)})):achievements,unlocks:[]};
  else if(path==='/api/announcements')data={items:empty?[]:long?notices.map(n=>({...n,title:n.title+' · 关于新学期社团活动安排的说明'})):notices,hasMore:false,nextOffset:2};
  else if(path.endsWith('/read'))data={unreadByKind:{}};
  else if(path.startsWith('/api/announcements/')){const notice=notices.find(i=>i.id===path.split('/')[3])||notices[0];data={entry:long?{...notice,body:notice.body.repeat(6)}:notice};}
  else return Response.json({error:'样板不连接此接口'},{status:501});
  return Response.json(data);
};
