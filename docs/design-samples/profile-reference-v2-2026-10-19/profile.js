import { art, characters, modes, results, recordRows } from './data.js';

const design = document.body.dataset.design;
const query = new URLSearchParams(location.search);
const state = { mode:'spark', play:'regular', character:'sigrika', context:query.get('context') === 'social' ? 'social' : 'self', fixture:query.get('fixture') || 'normal', liked:false, friend:false, blocked:false, closed:false };
const app = document.querySelector('#app');
const dialog = document.querySelector('#detail-dialog');
let returnFocus;
let timer;
const paths = {
  close:'<path d="m6 6 12 12M6 18 18 6"/>', arrow:'<path d="M5 19 19 5M5 5h14v14"/>',
  like:'<path d="M7 10v11H3V10h4Zm0 0 4-7c1-1 3 0 2 3l-1 4h6c2 0 3 1 2 3l-2 6c0 1-1 2-3 2H7"/>',
  friend:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m3-13v6m-3-3h6"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  edit:'<path d="m14 4 6 6M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14v6Z"/>',
  trophy:'<path d="M8 3h8v5a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 0v6m-4 3h8m-7-3h6"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6"/>',
  replay:'<rect x="3" y="4" width="18" height="13"/><path d="m10 8 5 3-5 3V8ZM8 21h8m-4-4v4"/>',
  quote:'<path d="M5 6h6v7H7c0 3-1 5-3 6m9-13h6v7h-4c0 3-1 5-3 6"/>'
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
const button = (action,label,symbol,extra='') => `<button type="button" data-action="${action}" ${extra}>${symbol ? icon(symbol) : ''}<span>${label}</span></button>`;
const currentCharacter = () => characters.find(c => c.id === state.character);
const stats = () => state.fixture === 'empty' ? { rank:0,stars:0,games:0,wins:0,losses:0,draws:0 } : modes[state.play === 'team' ? 'team' : state.mode];
const rate = record => record.games ? `${(record.wins / record.games * 100).toFixed(1)}%` : '—';
const username = () => state.fixture === 'long' ? '今天也想和西格莉卡下一盘棋' : '莫名';
const crop = (id, className='') => `<span class="face-crop ${className}"><img src="${art(id,'avatar')}" alt=""></span>`;

function bookmarks() {
  return `<nav class="window-bookmark-rail" role="tablist" aria-label="对弈类型" aria-orientation="vertical">${Object.entries(modes).filter(([id]) => id !== 'team').map(([id,mode]) => `<button type="button" id="tab-${id}" class="window-bookmark-tab" role="tab" aria-controls="record-content" aria-selected="${state.mode === id}" tabindex="${state.mode === id ? 0 : -1}" data-mode="${id}"><svg class="window-bookmark-paper" viewBox="0 0 124 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="window-bookmark-fill" d="M10 3 Q26 1 46 3 L80 2 L123 4 L123 56 L87 57 Q63 56 43 58 L10 56 L4 53 L5 39 L3 23 L5 8 Z"/><path class="window-bookmark-pencil" d="M11 7 Q30 5 46 7 L80 6 L118 7 M8 14 L9 35 L8 49 Q37 54 53 52 L116 53"/></svg><span class="window-bookmark-label">${mode.name}</span></button>`).join('')}</nav>`;
}
function actions() {
  if(state.context === 'self') return `<div class="identity-actions">${button('achievements','成就','trophy')}${button('personalize','个性化','edit')}</div>`;
  return `<div class="identity-actions">${button('like',state.liked ? '129' : '128','like',`aria-label="${state.liked ? '已点赞' : '点赞'}" ${state.liked ? 'disabled' : ''}`)}${button('friend',state.friend ? '已申请' : '加好友','friend',state.friend || state.blocked ? 'disabled' : '')}${button('more','更多','more')}</div>`;
}
function identity() {
  return `<section class="identity" aria-label="身份资料"><div class="avatar-frame">${crop(state.character)}<span class="avatar-corner"></span></div><div class="identity-text"><p class="micro">SIGRIKA GO / PLAYER PROFILE</p><h1>${username()}<small>#5216</small></h1><p class="player-tag">星炬学院 · 围棋社</p><p class="id-line">ID <span>1483935141</span></p></div>${actions()}</section>`;
}
function hero() {
  return `<section class="hero" aria-label="展示角色"><span class="hero-word" aria-hidden="true">SIGRIKA<br>GO.</span><img class="hero-art" src="${art(state.character)}" alt="${currentCharacter().name}完整立绘"><div class="hero-meta"><p class="date-label"><span>入社日</span><b>2026 / 01 / 22</b></p><p class="assistant-label">展示角色</p><h2>${currentCharacter().name}</h2><p class="character-en">${state.character.toUpperCase()}</p><div class="hero-rule"></div><p class="micro">PLAYER RECORD<br>DATA / SIGRIKA GO</p></div><div class="hero-bottom"><p class="accent-label">${state.play === 'capture' ? '个人最佳' : '累计对局'} <small>RECORD</small></p><p class="hero-total"><span>${state.fixture === 'empty' ? '000' : state.play === 'capture' ? '086' : String(stats().games).padStart(3,'0')}</span><small>${state.play === 'capture' ? '子' : '局'}</small></p><p class="hero-caption">${modes[state.mode].title} / ${state.play === 'team' ? '队际赛' : state.play === 'capture' ? '吃子挑战赛' : '常规匹配'}</p></div></section>`;
}
function playNavigation() {
  const options=state.mode === 'spark' ? [['regular','常规匹配'],['capture','吃子挑战赛'],['team','队际赛']] : [['regular',state.mode === 'other' ? '五子棋' : '常规匹配']];
  return `<nav class="play-nav" aria-label="具体玩法">${options.map(([id,label]) => `<button type="button" data-play="${id}" aria-pressed="${state.play === id}">${label}</button>`).join('')}</nav>`;
}
function summary() {
  const s=stats();
  if(state.play === 'capture') return `<section class="metrics capture-metrics" aria-label="挑战成绩"><div class="rank-line"><span>${icon('shield')}挑战排名</span><strong>${state.fixture === 'empty' ? '—' : '12'}</strong></div><div class="metric-grid"><div><b>${state.fixture === 'empty' ? '—' : '86'}</b><span>最高吃子</span></div><div><b>${state.fixture === 'empty' ? '—' : '西格莉卡'}</b><span>纪录角色</span></div></div><p class="result-summary">${state.fixture === 'empty' ? '完成挑战后显示个人最佳' : '默认装扮 · 纪录时外观'}</p></section>`;
  return `<section class="metrics" aria-label="当前玩法战绩"><div class="rank-line"><span>${icon('shield')}当前段位</span><strong>${s.rank || '—'}<small>段</small></strong><span class="rank-stars" aria-label="${s.stars}颗星">${'◆'.repeat(s.stars)}<i>${'◇'.repeat(5-s.stars)}</i></span>${button('rank-help','段位规则','arrow','class="icon-only" aria-label="段位规则"')}</div><div class="metric-grid"><div><b>${s.games}</b><span>总对局</span></div><div><b>${s.wins}</b><span>胜局</span></div><div><b>${rate(s)}</b><span>胜率</span></div></div><p class="result-summary"><span>负 <b>${s.losses}</b></span><span>和 <b>${s.draws}</b></span><span>${state.play === 'team' ? '队际赛战绩' : '升降级战绩'}</span></p></section>`;
}
function awards() {
  return `<button type="button" class="awards" data-action="achievements"><span class="award-title"><small>ACHIEVEMENTS</small><strong>光荣之路</strong><span>成就陈列 ${icon('arrow')}</span></span><span class="medals" aria-hidden="true">${[0,1,2,3].map((_,i) => `<span class="medal medal-${i}"><span>${icon(i % 2 ? 'shield' : 'trophy')}</span><small>${['01','03','05','10'][i]}</small></span>`).join('')}</span><span class="award-corner" aria-hidden="true">↗</span></button>`;
}
function roster() {
  const rows = state.fixture === 'empty' ? [] : recordRows(state.mode,state.play);
  let body;
  if(state.mode !== 'spark') body=`<div class="empty-record"><span class="stones" aria-hidden="true">● ○</span><h3>${modes[state.mode].title}</h3><p>此玩法不使用角色技能</p></div>`;
  else if(state.play === 'capture') body=`<div class="challenge-record">${crop('sigrika')}<div><small>PERSONAL BEST</small><h3>${state.fixture === 'empty' ? '等待第一次挑战' : '西格莉卡'}</h3><p>${state.fixture === 'empty' ? '尚无吃子挑战记录' : '最高吃子 86 · 挑战排名 12'}</p></div></div>`;
  else if(!rows.length) body='<div class="empty-record"><span>—</span><h3>暂无角色战绩</h3><p>完成一局对弈后显示出场记录</p></div>';
  else body=`<div class="operator-grid">${rows.map((c,i) => `<button type="button" class="operator-card" data-character="${c.id}" aria-label="${c.name}，出场${c.games}次，${c.wins}胜${c.losses}负${c.draws}和，胜率${rate(c)}"><span class="operator-art">${crop(c.id)}<span class="operator-index">0${i+1}</span><span class="operator-count"><small>出场</small>${c.games}</span></span><span class="operator-name">${c.name}</span><span class="operator-rate">${rate(c)} <small>胜率</small></span></button>`).join('')}</div>`;
  return `<section class="roster" aria-label="角色战绩"><div class="module-mast"><span>SIGRIKA GO <small>RECORD / ${state.mode.toUpperCase()}</small></span><span class="module-glyph" aria-hidden="true">▧</span></div><div class="module-heading"><div><h2>${state.play === 'capture' ? '挑战纪录' : '角色战绩'}</h2><span>${state.play === 'team' ? '按实际出场统计' : 'OPERATOR RECORDS'}</span></div>${button('replays','对局回放','arrow')}</div>${body}</section>`;
}
function recent() {
  return `<section class="recent" aria-label="最近十盘"><div class="recent-heading"><h2>最近十盘</h2><span>旧 → 新</span></div><div class="result-chain">${state.fixture === 'empty' || state.play === 'capture' ? '<span class="no-results">暂无对局记录</span>' : results.map((r,i) => `<span class="result-chip ${r === '胜' ? 'win' : r === '负' ? 'loss' : 'draw'}" title="第${i+1}盘：${r}">${r}</span>`).join('')}</div>${button('replays','回放','arrow','class="icon-only" aria-label="查看对局回放"')}</section>`;
}
function quote() { return `<div class="quote">${icon('quote')}<p>此夜，星海澈明。</p><span>“</span></div>`; }
function tools() {
  return `<div class="sample-tools"><span>交互样板 · 示例数据</span><div class="context-switch"><button data-context="self" aria-pressed="${state.context === 'self'}">我的履历</button><button data-context="social" aria-pressed="${state.context === 'social'}">他人详情</button></div><select id="fixture" aria-label="示例数据"><option value="normal" ${state.fixture === 'normal' ? 'selected' : ''}>正常数据</option><option value="empty" ${state.fixture === 'empty' ? 'selected' : ''}>空战绩</option><option value="long" ${state.fixture === 'long' ? 'selected' : ''}>长用户名</option></select></div>`;
}
function layout() {
  if(design === 'arknights') return `<div class="left-column">${hero()}${summary()}</div><div class="right-column">${identity()}${quote()}${playNavigation()}${roster()}${recent()}</div>`;
  if(design === 'endfield') return `<div class="left-column">${identity()}<div class="chapter"><span>星炬学院</span><strong>棋盘上的每一步</strong><small>CLUB ACTIVITY / PERSONAL RECORD</small></div>${summary()}${quote()}</div><div class="right-column">${awards()}${playNavigation()}${roster()}${recent()}</div>`;
  return `<div class="left-column">${hero()}${summary()}</div><div class="right-column">${identity()}${awards()}${playNavigation()}${roster()}${recent()}${quote()}</div>`;
}
function render() {
  const focused=document.activeElement;
  const key=['action','mode','play','context'].find(k => focused?.dataset[k]);
  const selector=key ? `[data-${key}="${focused.dataset[key]}"]` : null;
  const scroll=document.querySelector('.canvas-inner')?.scrollTop || 0;
  app.innerHTML=tools() + (state.closed ? `<main class="closed"><h1>资料窗口已关闭</h1>${button('reopen','重新打开','arrow')}</main>` : `<main class="stage"><article class="profile-window window-bookmark-host" aria-label="${state.context === 'self' ? '我的履历' : '详细资料'}">${bookmarks()}<div class="canvas-inner"><canvas class="terrain" aria-hidden="true"></canvas><header class="window-header"><span>${state.context === 'self' ? '个人履历' : '详细资料'} <small>PERSONAL FILE</small></span><span class="header-index">SG / ${design === 'arknights' ? '01' : design === 'endfield' ? '02' : '03'}</span>${button('close','关闭','close','class="icon-only" aria-label="关闭资料窗口"')}</header><div id="record-content" class="layout" role="tabpanel" aria-labelledby="tab-${state.mode}" tabindex="0">${layout()}</div><footer class="window-footer"><span>SIGRIKA GO / ${modes[state.mode].title}</span><span>PROFILE · 2026</span></footer></div></article></main>`);
  if(selector) document.querySelector(selector)?.focus({preventScroll:true});
  const scroller=document.querySelector('.canvas-inner');
  if(scroller) scroller.scrollTop=scroll;
  drawTerrain();
}

// Static grayscale relief: decorative reference material, never a gameplay map.
function drawTerrain() {
  const canvas=document.querySelector('.terrain');
  if(!canvas || design === 'arknights') return;
  const bounds=canvas.getBoundingClientRect();
  const dpr=Math.min(devicePixelRatio,2);
  canvas.width=bounds.width*dpr; canvas.height=bounds.height*dpr;
  const ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr);
  const w=bounds.width, h=bounds.height;
  const nx=70, ny=24;
  const point=(x,y) => {
    const depth=y/ny;
    const wave=(Math.sin(x*.26+y*.23)+Math.cos(x*.14-y*.42)+Math.sin(x*.65+y*.42)*.3);
    return { x:x/nx*w, y:h*.25+depth*h*.75-wave*(.4+depth*.6)*h*.18, v:wave };
  };
  for(let y=0;y<ny;y++) for(let x=0;x<nx;x++) {
    const a=point(x,y), b=point(x+1,y), c=point(x,y+1), d=point(x+1,y+1);
    const shade=Math.round(32+(Math.sin(x*.28+y*.3)+1)*12+y*.3);
    for(const [p,q,r,k] of [[a,b,c,0],[b,c,d,3]]) {
      ctx.fillStyle=`rgb(${shade+k} ${shade+k} ${shade+k})`;
      ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.lineTo(r.x,r.y); ctx.closePath(); ctx.fill();
    }
  }
}
function notify(text) {
  const toast=document.querySelector('.toast'); toast.textContent=text; toast.classList.add('visible');
  clearTimeout(timer); timer=setTimeout(() => toast.classList.remove('visible'),2400);
}
function openDialog(title,content) {
  if(!dialog.open) returnFocus=document.activeElement;
  dialog.innerHTML=`<header><h2 id="dialog-title">${title}</h2>${button('dismiss','关闭','close','class="icon-only" aria-label="关闭弹窗"')}</header><div class="dialog-content">${content}</div><p class="dialog-note">交互样板 · 仅操作本页示例数据</p>`;
  if(!dialog.open) dialog.showModal();
}
function handle(action) {
  if(action === 'dismiss') dialog.close();
  else if(action === 'close' || action === 'reopen') {state.closed=action === 'close'; render(); document.querySelector(`[data-action="${state.closed ? 'reopen' : 'close'}"]`)?.focus();}
  else if(action === 'like') {state.liked=true;render();document.querySelector('[data-action="friend"]')?.focus();notify('已点赞（样板）');}
  else if(action === 'friend') {state.friend=true;render();document.querySelector('[data-action="more"]')?.focus();notify('好友申请已标记（样板）');}
  else if(action === 'more') openDialog('社交操作',`<div class="dialog-actions">${button('block',state.blocked ? '移出黑名单' : '加入黑名单','shield')}${button('report','举报用户','more')}</div>`);
  else if(action === 'block') openDialog(state.blocked ? '移出黑名单' : '加入黑名单',`<p>${state.blocked ? '恢复与这位玩家互动？' : '加入后将限制与这位玩家互动。'}</p><div class="dialog-actions">${button('confirm-block','确认')}${button('dismiss','取消')}</div>`);
  else if(action === 'confirm-block') {state.blocked=!state.blocked;dialog.close();render();document.querySelector('[data-action="more"]')?.focus();notify(state.blocked ? '已加入黑名单（样板）' : '已移出黑名单（样板）');}
  else if(action === 'report') openDialog('举报用户',`<form id="report-form"><label>举报原因<select required name="reason"><option value="">请选择</option><option>不当言论</option><option>恶意骚扰</option><option>其它问题</option></select></label><label>补充说明<textarea name="detail" maxlength="200" rows="3"></textarea></label><button type="submit">预览提交</button></form>`);
  else if(action === 'rank-help') openDialog('段位规则',`<p>当前 ${stats().rank || '—'} 段，${stats().stars} 星。</p><p>此处预留现有升降段说明入口；具体规则以正式对局规则为准。</p>`);
  else if(action === 'achievements') openDialog('成就陈列',`<p>陈列区展示项目成就名牌；示例徽章仅用于比较版式，不表示真实解锁状态。</p><div class="achievement-gallery"><img src="/assets/achievements/aemeath-spark-100-wins-nameplate.png" alt="爱弥斯成就名牌"><img src="/assets/achievements/denia-spark-100-wins-nameplate.png" alt="达妮娅成就名牌"></div>`);
  else if(action === 'personalize') openDialog('选择展示角色',`<div class="character-picker">${characters.map(c => `<button data-select-character="${c.id}" aria-pressed="${state.character === c.id}">${crop(c.id)}<span>${c.name}</span></button>`).join('')}</div>`);
  else if(action === 'replays') openDialog('对局回放',state.fixture === 'empty' || state.play === 'capture' ? '<p>暂无可回放的对局。</p>' : `<p>以下为布局演示，未加载真实棋谱。</p><ol class="replay-list">${results.slice().reverse().slice(0,5).map((r,i) => `<li><strong>${r}</strong><span>${modes[state.mode].title} · ${state.play === 'team' ? '队际赛' : '常规匹配'}</span><small>10 / ${19-i}</small></li>`).join('')}</ol>`);
}
document.addEventListener('click',event => {
  const target=event.target.closest('button'); if(!target || target.disabled) return;
  if(target.dataset.action) handle(target.dataset.action);
  else if(target.dataset.mode) {state.mode=target.dataset.mode;state.play='regular';render();}
  else if(target.dataset.play) {state.play=target.dataset.play;render();}
  else if(target.dataset.context) {state.context=target.dataset.context;render();}
  else if(target.dataset.character) {
    const c=recordRows(state.mode,state.play).find(c => c.id === target.dataset.character);
    openDialog(c.name,`<div class="character-detail">${crop(c.id)}<div><p>出场 <b>${c.games}</b> 次</p><p>胜 / 负 / 和 <b>${c.wins} / ${c.losses} / ${c.draws}</b></p><p>胜率 <b>${rate(c)}</b></p></div></div>`);
  } else if(target.dataset.selectCharacter) {state.character=target.dataset.selectCharacter;dialog.close();render();document.querySelector('[data-action="personalize"]')?.focus();notify('展示角色已切换');}
});
document.addEventListener('change',event => {if(event.target.id === 'fixture') {state.fixture=event.target.value;render();document.querySelector('#fixture')?.focus();}});
document.addEventListener('keydown',event => {
  if(!event.target.matches('.window-bookmark-tab')) return;
  const ids=['spark','standard','other']; const i=ids.indexOf(state.mode);
  const index={ArrowDown:(i+1)%3,ArrowUp:(i+2)%3,Home:0,End:2}[event.key];
  if(index === undefined) return;
  event.preventDefault();state.mode=ids[index];state.play='regular';render();document.querySelector(`#tab-${state.mode}`)?.focus();
});
document.addEventListener('submit',event => {if(event.target.id === 'report-form') {event.preventDefault();dialog.close();notify('举报演示已完成，未发送任何数据');}});
dialog.addEventListener('close',() => {if(returnFocus?.isConnected) returnFocus.focus({preventScroll:true});});
window.addEventListener('resize',drawTerrain);
render();
