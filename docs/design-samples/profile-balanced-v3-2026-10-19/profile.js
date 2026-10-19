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
  block:'<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
  report:'<path d="M5 21V4m0 0c5-3 9 3 14 0v10c-5 3-9-3-14 0"/>',
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
  return `<div class="identity-actions">${button('like',state.liked ? '129' : '128','like',`aria-label="${state.liked ? '已点赞，129 次' : '点赞，128 次'}" ${state.liked ? 'disabled' : ''}`)}${button('friend',state.friend ? '已申请' : '加好友','friend',state.friend || state.blocked ? 'disabled' : '')}${button('block',state.blocked ? '移出黑名单' : '加入黑名单','block',`title="${state.blocked ? '移出黑名单' : '加入黑名单'}"`)}${button('report','举报','report','title="举报"')}</div>`;
}

function identity() {
  return `<section class="identity" aria-label="身份资料"><div class="avatar-frame">${crop(state.character)}</div><div class="identity-text"><h2>${username()}</h2></div>${actions()}</section>`;
}
function hero() {
  return `<div class="hero"><div class="hero-grid" aria-hidden="true"></div><img class="hero-art" src="${art(state.character)}" alt="${currentCharacter().name}当前展示立绘"><span class="hero-caption">${currentCharacter().name}</span></div>`;
}
function playNavigation() {
  const options=state.mode === 'spark' ? [['regular','常规匹配'],['capture','吃子挑战赛'],['team','队际赛']] : [['regular',state.mode === 'other' ? '五子棋' : '常规匹配']];
  return `<nav class="play-nav" aria-label="具体玩法">${options.map(([id,label]) => `<button type="button" data-play="${id}" aria-pressed="${state.play === id}">${label}</button>`).join('')}</nav>`;
}
function rank() {
  if(state.play === 'capture') return '';
  const s=stats();
  return `<section class="rank-panel" aria-label="段位"><div class="section-heading"><h3>段位</h3>${button('rank-help','段位规则','shield','class="icon-only" aria-label="段位规则"')}</div><p class="rank-value"><strong>${s.rank || '—'}</strong><span>段</span></p><p class="rank-stars" aria-label="${s.stars}颗星，共5颗星">${Array.from({length:5},(_,i)=>`<span class="${i<s.stars?'filled':''}">✦</span>`).join('')}</p></section>`;
}
function summary() {
  const s=stats();
  if(state.play === 'capture') return `<section class="metrics capture-metrics" aria-label="挑战成绩"><div class="section-heading"><h3>吃子挑战赛</h3></div><div class="metric-main"><div><span>最高吃子</span><b>${state.fixture === 'empty' ? '—' : '86'}<small>子</small></b></div><div><span>挑战排名</span><b>${state.fixture === 'empty' ? '—' : '12'}</b></div></div><div class="capture-owner">${crop('sigrika')}<p><span>纪录角色</span><strong>${state.fixture === 'empty' ? '暂无挑战记录' : '西格莉卡'}</strong><small>${state.fixture === 'empty' ? '完成挑战后显示个人最佳' : '默认装扮 · 纪录时外观'}</small></p></div></section>`;
  return `<section class="metrics" aria-label="当前玩法战绩"><div class="section-heading"><h3>${state.play === 'team' ? '队际赛战绩' : '升降级战绩'}</h3>${button('replays','对局回放','replay')}</div><div class="metric-main"><div><span>总对局</span><b>${s.games}<small>局</small></b></div><div><span>胜率</span><b>${rate(s)}</b></div></div><dl class="metric-results"><div><dt>胜</dt><dd>${s.wins}</dd></div><div><dt>负</dt><dd>${s.losses}</dd></div><div><dt>和</dt><dd>${s.draws}</dd></div></dl></section>`;
}
function recent() {
  if(state.play === 'capture') return '';
  return `<section class="recent" aria-label="最近十盘"><div class="recent-heading"><h3>最近十盘</h3><span>旧 → 新</span></div><div class="result-chain">${state.fixture === 'empty' ? '<span class="no-results">暂无对局记录</span>' : results.map((r,i)=>`<span class="result-chip ${r==='胜'?'win':r==='负'?'loss':'draw'}" title="第${i+1}盘：${r}">${r}</span>`).join('')}</div></section>`;
}
function roster() {
  if(state.play === 'capture') return '';
  const rows=state.fixture === 'empty' ? [] : recordRows(state.mode,state.play);
  const empty=state.mode === 'spark' ? '<div class="empty-record"><span aria-hidden="true">○</span><h3>暂无角色战绩</h3><p>完成对局后显示角色出场记录</p></div>' : `<div class="empty-record"><span aria-hidden="true">● ○</span><h3>${modes[state.mode].title}</h3><p>此玩法不使用角色技能</p></div>`;
  return `<section class="roster" aria-label="角色战绩"><div class="section-heading"><h3>角色战绩</h3><span class="section-aside">${state.play === 'team' ? '按实际出场统计' : '按出场次数排序'}</span></div>${rows.length ? `<div class="operator-grid">${rows.map(c=>`<button type="button" class="operator-card" data-character="${c.id}" aria-label="${c.name}，出场${c.games}次，${c.wins}胜${c.losses}负${c.draws}和，胜率${rate(c)}"><span class="operator-art">${crop(c.id)}</span><span class="operator-name">${c.name}</span><span class="operator-count"><small>出场</small><b>${c.games}</b></span><span class="operator-outcomes"><span><small>胜</small><b>${c.wins}</b></span><span><small>负</small><b>${c.losses}</b></span><span><small>和</small><b>${c.draws}</b></span></span><span class="operator-rate"><small>胜率</small><b>${rate(c)}</b></span></button>`).join('')}</div>` : empty}</section>`;
}
function tools() {
  return `<div class="sample-tools"><span>交互样板 · 示例数据</span><div class="context-switch"><button data-context="self" aria-pressed="${state.context === 'self'}">我的履历</button><button data-context="social" aria-pressed="${state.context === 'social'}">他人详情</button></div><select id="fixture" aria-label="示例数据"><option value="normal" ${state.fixture === 'normal' ? 'selected' : ''}>正常数据</option><option value="empty" ${state.fixture === 'empty' ? 'selected' : ''}>空战绩</option><option value="long" ${state.fixture === 'long' ? 'selected' : ''}>长用户名</option></select></div>`;
}
function layout() {
  if(design === 'mint') return `<div class="portrait-zone">${hero()}</div><div class="record-zone">${identity()}${playNavigation()}<div class="overview">${rank()}${summary()}</div>${recent()}${roster()}</div>`;
  if(design === 'ink') return `<div class="identity-zone">${identity()}${rank()}</div><div class="record-zone">${playNavigation()}${summary()}${recent()}${roster()}</div>`;
  return `<div class="identity-band">${identity()}${hero()}</div><div class="record-zone">${playNavigation()}<div class="blue-record-grid"><div class="summary-zone">${rank()}${summary()}${recent()}</div>${roster()}</div></div>`;
}
function render() {
  const focused=document.activeElement;
  const key=['action','mode','play','context'].find(k=>focused?.dataset[k]);
  const selector=key ? `[data-${key}="${focused.dataset[key]}"]` : null;
  app.innerHTML=tools()+(state.closed ? `<main class="closed"><h1>资料窗口已关闭</h1>${button('reopen','重新打开','arrow')}</main>` : `<main class="stage"><article class="profile-window window-bookmark-host" aria-label="${state.context === 'self' ? '我的履历' : '详细资料'}">${bookmarks()}<div class="canvas-inner"><header class="window-header"><h1>${state.context === 'self' ? '我的履历' : '详细资料'}</h1>${button('close','关闭','close','class="icon-only" aria-label="关闭资料窗口"')}</header><div id="record-content" class="layout" role="tabpanel" aria-labelledby="tab-${state.mode}" tabindex="0">${layout()}</div></div></article></main>`);
  if(selector) document.querySelector(selector)?.focus({preventScroll:true});
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
  else if(action === 'friend') {state.friend=true;render();document.querySelector('[data-action="report"]')?.focus();notify('好友申请已标记（样板）');}
  else if(action === 'block') openDialog(state.blocked ? '移出黑名单' : '加入黑名单',`<p>${state.blocked ? '恢复与这位玩家互动？' : '加入后将限制与这位玩家互动。'}</p><div class="dialog-actions">${button('confirm-block','确认')}${button('dismiss','取消')}</div>`);
  else if(action === 'confirm-block') {state.blocked=!state.blocked;dialog.close();render();document.querySelector('[data-action="report"]')?.focus();notify(state.blocked ? '已加入黑名单（样板）' : '已移出黑名单（样板）');}
  else if(action === 'report') openDialog('举报用户',`<form id="report-form"><label>举报原因<select required name="reason"><option value="">请选择</option><option>不当言论</option><option>恶意骚扰</option><option>其它问题</option></select></label><label>补充说明<textarea name="detail" maxlength="200" rows="3"></textarea></label><button type="submit">预览提交</button></form>`);
  else if(action === 'rank-help') openDialog('段位规则',`<p>当前 ${stats().rank || '—'} 段，${stats().stars} 星。</p><p>此处预留现有升降段说明入口；具体规则以正式对局规则为准。</p>`);
  else if(action === 'achievements') openDialog('成就',`<p>保留现有成就入口，以下仅为项目名牌资源预览。</p><div class="achievement-gallery"><img src="/assets/achievements/aemeath-spark-100-wins-nameplate.png" alt="爱弥斯成就名牌"><img src="/assets/achievements/denia-spark-100-wins-nameplate.png" alt="达妮娅成就名牌"></div>`);
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

render();
