import { people } from './characters.js';

const main = document.querySelector('#main');
const dialog = document.querySelector('#dialog');
const assetRoot = '../../../public/assets/characters/';
const paths = {
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  back: '<path d="M19 12H5m7-7-7 7 7 7"/>',
  book: '<path d="M4 4h6l2 2 2-2h6v15h-6l-2 2-2-2H4V4Zm8 2v15M7 8h2m-2 4h2m6-4h2m-2 4h2"/>',
  match: '<path d="m4 4 16 16M4 20 20 4M3 8l5-5m8 18 5-5M3 16l5 5M16 3l5 5"/>',
  practice: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 3M9 2h6"/>',
  room: '<path d="M3 20h18M6 20V5l6-3 6 3v15M10 20v-5h4v5M9 7h1m4 0h1m-6 4h1m4 0h1"/>',
  shop: '<path d="M4 9h16l-2-6H6L4 9Zm1 0v11h14V9M9 20v-6h6v6M3 9v2h18V9"/>',
  box: '<path d="m3 7 9-4 9 4v11l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v11M7 5l10 4"/>',
  star: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/>',
  rank: '<path d="M9 21V4h6v17M3 21V11h6m6-6h6v16M1 21h22"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M17 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2"/>',
  mail: '<rect x="3" y="5" width="18" height="14"/><path d="m3 6 9 7 9-7"/>',
  settings: '<path d="m9 3-1 3-3 1v4l-2 1 2 2v4l4 1 1 2h4l1-3 4-1v-4l2-1-2-2V6l-4-1-1-2H9Z"/><circle cx="12" cy="12" r="3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3v.1"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  check: '<path d="m5 12 5 5L20 6"/>',
  grid: '<rect x="3" y="3" width="18" height="18"/><path d="M9 3v18m6-18v18M3 9h18M3 15h18"/>',
  reset: '<path d="M3 10a9 9 0 1 1 1 8M3 3v7h7"/>',
  undo: '<path d="m9 4-6 6 6 6M3 10h11a6 6 0 0 1 0 12"/>',
  pass: '<path d="M5 13V7a2 2 0 0 1 4 0v5-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v7-3a2 2 0 0 1 4 0v6c0 4-3 6-7 6H9l-7-7a2 2 0 0 1 3-2Z"/>',
  flag: '<path d="M5 22V3m0 0c5-4 9 4 15 0v10c-6 4-10-4-15 0"/>',
  draw: '<path d="m2 9 5-5 4 2 3-1 8 6-4 8-7 2-9-8Zm7-1 4 4 3-2m-9 4 6 6m-3-8 7 6"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${paths[name] || paths.star}</svg>`;
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const portrait = (person, cls = 'portrait', avatar = false) => `<img class="${cls}" src="${assetRoot}${avatar ? 'handbook-chibi-sprites/' : 'handbook-sprites/'}${person.id}${avatar ? '-avatar' : ''}.webp" alt="${escape(person.name)}" width="${avatar ? 512 : 832}" height="${avatar ? 512 : 1216}" draggable="false">`;
const factions = {sigrika:'罗伊族',changli:'瑝珑',qiuyuan:'瑝珑'};
let selected = people[0];
let member = people[0];
let view = ['home','battle','members'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
let detailTab = 'skill';
let toastTimer;
let showCoordinates = true;
let modeName = '星炬对弈';
let skillPreviewed = false;
const initial = [[3,3],[9,9],[9,3],[3,9],[4,3],[4,4],[5,4],[5,5],[6,4],[6,5],[7,5],[7,6],[6,6],[8,5],[8,6],[9,5],[9,6],[8,7],[7,7],[6,7],[5,7],[5,6],[4,6],[4,7]];
let moves = [];
let stones = new Map();
let turn = 'black';
function resetBoard() {
  stones = new Map(initial.map(([x,y],i) => [y * 13 + x, i % 2 ? 'white' : 'black']));
  moves = [];
  turn = 'black';
  skillPreviewed = false;
}
resetBoard();
function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3500);
}
function openDialog(title, content) {
  document.querySelector('#dialog-title').textContent = title;
  document.querySelector('#dialog-content').innerHTML = content;
  if (!dialog.open) dialog.showModal();
}
function navigate(next) {
  if (!['home','battle','members'].includes(next)) return;
  view = next;
  if (dialog.open) dialog.close();
  history.replaceState(null, '', `#${view}`);
  render();
  window.scrollTo({top:0,behavior:'instant'});
  main.focus({preventScroll:true});
}
function homePage() {
  return `<section class="home enter" aria-label="大厅">
    <div class="hero-word" aria-hidden="true">${selected.id.toUpperCase()}</div>${portrait(selected,'hero-art')}
    <aside class="identity"><div class="identity-marker"><div class="slash" aria-hidden="true"></div><b>部员档案</b></div><h1>木漏れ日</h1><div class="rank"><strong>三段</strong><span>★ ★ ★</span></div><div class="rating">段位积分 <span class="mono">1,286</span></div><button class="text-button" data-action="profile">查看履历 ${icon('arrow')}</button><div class="identity-badge">${portrait(selected,'avatar',true)}<div><small>当前出战</small><strong>${escape(selected.name)}</strong></div></div><p class="identity-bottom">星炬学院围棋部<br>下一手，会有新的可能。</p></aside>
    <div class="character-label"><span>${selected.id.toUpperCase()}</span><h2>${escape(selected.name)}</h2></div>
    <aside class="lobby-actions"><button class="match-entry" data-action="match"><small>PLAY / 对弈</small><strong>开始对弈</strong><span class="entry-foot">星炬 · 标准 · 五子棋</span><span class="entry-arrow">${icon('arrow')}</span></button><div class="lobby-secondary"><button data-action="practice">${icon('practice')}准时宝陪练</button><button data-action="room">${icon('room')}好友对弈</button></div><button class="handbook-entry" data-view="members">${icon('book')}<span><strong>部员手册</strong><small>角色档案 / 出战配置</small></span>${icon('arrow')}</button></aside>
    <nav class="lobby-dock" aria-label="大厅功能">${[['star','招募'],['shop','商店'],['box','仓库'],['rank','排行'],['eye','观战'],['people','好友']].map(([symbol,label])=>`<button data-shell="${label}">${icon(symbol)}<span>${label}</span></button>`).join('')}</nav>
  </section>`;
}
function skillContent(person) {
  return `<div class="skill-title"><h3>${escape(person.skill.name)}</h3><span class="skill-symbol">${icon('star')}</span></div><div class="skill-meta"><span>可用 ${escape(person.skill.uses)} 次</span><span>超频消耗 ${escape(person.skill.costValue || '0')}</span>${person.skill.freeTurn ? '<span>疾走</span>' : ''}</div><p class="skill-description">${escape(person.skill.description)}</p>`;
}
function detailContent() {
  return detailTab === 'skill' ? skillContent(member) : `<dl><div><dt>所属</dt><dd>${factions[member.id] || '星炬学院'}</dd></div><div><dt>获取方式</dt><dd>${escape(member.acquisitionMethod || '部员招募')}</dd></div><div><dt>角色配音</dt><dd>${escape(member.cvName || '—')}</dd></div></dl>`;
}
function rosterButtons(query='') {
  const result = people.filter((person)=> person.name.includes(query) || person.id.includes(query.toLowerCase()));
  return result.length ? result.map((person)=>`<button class="member-button" data-member="${person.id}" aria-pressed="${person.id===member.id}">${portrait(person)}<span><strong>${escape(person.name)}</strong><small>${person.id.toUpperCase()}</small></span></button>`).join('') : '<p class="empty-list">没有找到这位部员</p>';
}
function membersPage() {
  return `<section class="members enter"><div class="section-top"><div><h1 class="page-title">部员手册<span class="member-count mono">${String(people.length).padStart(2,'0')} 名部员</span></h1></div><button class="back-button" data-view="home">${icon('back')}返回大厅</button></div><div class="archive"><aside class="directory"><label class="search">${icon('search')}<input type="search" id="member-search" placeholder="查找部员" aria-label="查找部员" autocomplete="off"></label><nav class="member-list" aria-label="部员名册">${rosterButtons()}</nav></aside><div class="member-stage"><span class="member-watermark" aria-hidden="true">${member.id.toUpperCase()}</span><span class="art-counter mono">${String(people.indexOf(member)+1).padStart(2,'0')} / ${String(people.length).padStart(2,'0')}</span>${portrait(member)}</div><section class="member-info" aria-label="角色详情"><div class="faction-line">${icon('star')}${factions[member.id] || '星炬学院'} · 部员档案</div><h2>${escape(member.name)}</h2><div class="latin-name">${member.id.toUpperCase()}</div><p class="member-quote">${escape(member.description)}</p><div class="detail-tabs" role="tablist" aria-label="档案内容"><button id="skill-tab" role="tab" data-tab="skill" aria-controls="detail-panel" aria-selected="${detailTab==='skill'}" tabindex="${detailTab==='skill'?0:-1}">角色技能</button><button id="profile-tab" role="tab" data-tab="profile" aria-controls="detail-panel" aria-selected="${detailTab==='profile'}" tabindex="${detailTab==='profile'?0:-1}">角色档案</button></div><div class="detail-content" id="detail-panel" role="tabpanel" aria-labelledby="${detailTab}-tab">${detailContent()}</div><button class="primary deploy" data-action="deploy" aria-pressed="${member.id===selected.id}">${member.id===selected.id?'当前出战':'设为出战'}${icon(member.id===selected.id?'check':'arrow')}</button><p class="deploy-note">出战选择仅在本样板内生效</p></section></div></section>`;
}
function playerRail(person, isOpponent) {
  const color = isOpponent ? 'white' : 'black';
  const active = turn === color;
  return `<aside class="player-rail ${isOpponent?'opponent':'self'}" aria-label="${isOpponent?'对手':'我方'}"><div class="player-portrait">${portrait(person)}<span>${escape(person.name)}</span></div><div class="player-caption"><div><strong>${isOpponent?'雨天的棉花糖':'木漏れ日'}</strong><small>三段 · ${isOpponent?'对手':'我方'}</small></div><span class="stone-symbol ${color}" aria-label="${isOpponent?'白方':'黑方'}"></span></div><div class="clock-block ${active?'active':''}"><div class="clock-label"><span>剩余时间</span><span class="turn-badge">${active?'行棋中':'等待落子'}</span></div><div class="clock mono">${isOpponent?'08:42':'09:15'}</div></div><div class="player-stats"><span>提子<b class="mono">${isOpponent?'02':'01'}</b></span><span>超频<b class="mono">${isOpponent?'4':'6'}</b></span></div><button class="rail-skill" data-action="${isOpponent?'opponent-skill':'skill'}">${icon('star')}<span>${escape(person.skill.name)}<small>${isOpponent?'查看技能':'技能信息 / 演示反馈'}</small></span></button>${isOpponent?`<details class="battle-log" open><summary>对局动态</summary>${moves.slice(-3).reverse().map((move)=>`<p>${move.color==='black'?'黑':'白'}方 · ${move.point===null?'弃手':pointName(move.point)}</p>`).join('') || '<p>黑方落子 · E7</p><p>白方落子 · E6</p>'}</details>`:''}</aside>`;
}
function pointName(point) {return `${'ABCDEFGHJKLMN'[point%13]}${13-Math.floor(point/13)}`;}
function boardMarkup() {
  const last = moves.filter((move)=>move.point!==null).at(-1)?.point;
  return Array.from({length:169},(_,point)=>{
    const star = [3,6,9].includes(point%13) && [3,6,9].includes(Math.floor(point/13));
    const color = stones.get(point);
    return `<button class="point ${star?'star':''} ${color || ''} ${last===point?'last':''}" data-point="${point}" aria-label="${pointName(point)}${color?`，${color==='black'?'黑':'白'}子`:'，空位'}"><span></span></button>`;
  }).join('');
}
function battlePage() {
  const opponent = people.find((person)=>person.id===(selected.id==='aemeath'?'sigrika':'aemeath'));
  return `<section class="battle enter"><div class="section-top battle-top"><div class="battle-title"><h1>${escape(modeName)}</h1><small>13 路 · 友谊赛</small></div><div class="tools"><button data-action="undo" aria-label="撤回上一手" title="撤回上一手" ${moves.length?'':'disabled'}>${icon('undo')}</button><button data-action="coords" aria-label="显示坐标" aria-pressed="${showCoordinates}" title="切换坐标">${icon('grid')}</button><button data-action="reset" aria-label="重置演示" title="重置演示">${icon('reset')}</button><button data-view="home" aria-label="返回大厅" title="返回大厅">${icon('back')}</button></div></div><div class="battle-layout">${playerRail(selected,false)}<div class="board-column"><div class="board-title"><span><i class="live-dot"></i>${turn==='black'?'轮到你落子':'白方落子'}</span><span><strong class="number">${initial.length+moves.length}</strong> 手</span></div><div class="board-frame ${showCoordinates?'':'no-coords'}"><div class="board" aria-label="13 路演示棋盘">${boardMarkup()}</div><div class="board-coords x" aria-hidden="true">${[...'ABCDEFGHJKLMN'].map((label)=>`<span>${label}</span>`).join('')}</div><div class="board-coords y" aria-hidden="true">${Array.from({length:13},(_,i)=>`<span>${13-i}</span>`).join('')}</div></div><div class="board-meta"><span>交替落子演示 · 棋钟静止</span><button class="text-button" data-action="undo" ${moves.length?'':'disabled'}>${icon('undo')}撤回</button></div><nav class="action-bar" aria-label="对弈操作"><button data-action="pass">${icon('pass')}<span>弃手</span></button><button data-action="count">${icon('grid')}<span>数子</span></button><button class="skill-action" data-action="skill">${icon('star')}<span>角色技能</span></button><button data-action="draw">${icon('draw')}<span>和棋</span></button><button data-action="resign">${icon('flag')}<span>认输</span></button></nav><p class="mobile-turn">${escape(selected.name)} · ${escape(selected.skill.name)}<br>点击棋盘体验落子反馈，技能按钮可查看详情。</p></div>${playerRail(opponent,true)}</div></section>`;
}
function render() {
  document.querySelectorAll('.preview-bar [data-view]').forEach((button)=>{
    if (button.dataset.view===view) button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  });
  document.querySelector('#context-label').textContent = {home:'大厅',battle:'对弈 / 友谊赛',members:'部员档案'}[view];
  document.querySelector('#footer-context').textContent = view==='battle'?'视觉演示 · 未连接对局服务':'浅灰工业终端 / 界面探索';
  main.innerHTML = view==='home'?homePage():view==='members'?membersPage():battlePage();
}
function addMove(point) {
  if (point!==null && stones.has(point)) {notify('这里已有棋子，请选择空位');return;}
  moves.push({point,color:turn});
  if (point!==null) stones.set(point,turn);
  turn=turn==='black'?'white':'black';
  render();
  const focusTarget = point===null ? '[data-action="pass"]' : `[data-point="${point}"]`;
  main.querySelector(focusTarget)?.focus({preventScroll:true});
}
const actions = {
  match: () => openDialog('选择对弈模式', `<div class="mode-list"><button data-mode="星炬对弈"><span><b>星炬</b><small>角色技能 · 13 路棋盘</small></span>${icon('arrow')}</button><button data-shell="标准围棋"><span><b>标准</b><small>传统围棋规则</small></span>${icon('arrow')}</button><button data-shell="五子棋"><span><b>五子棋</b><small>五子连线</small></span>${icon('arrow')}</button></div>`),
  practice: () => openDialog('准时宝陪练', `<div class="mode-list">${['入门','中级','高级'].map((level)=>`<button data-mode="${level}陪练"><b>${level}</b>${icon('arrow')}</button>`).join('')}</div><p class="muted" style="margin-top:18px">选择后进入对弈样板，不启动真实 AI。</p>`),
  room: () => openDialog('好友对弈','<p>好友房间的界面预览。此处不会创建真实房间。</p><button class="primary" data-mode="好友对弈">进入对弈样板 →</button>'),
  profile: () => openDialog('木漏れ日',`<p>三段 · 1,286 积分<br>当前出战：${escape(selected.name)}</p><p class="muted">这是本地演示身份，不读取实际账号。</p>`),
  mail: () => openDialog('邮件','<p>暂无新邮件。</p><p class="muted">本轮展示通用窗口外观。</p>'),
  help: () => openDialog('关于这组样板','<p>主界面、对弈界面、部员手册共用一套浅灰工业终端视觉。可切换部员并设为出战，再返回大厅或对弈查看效果。</p><p>所有操作仅在本页演示。棋盘支持交替放置，不计算提子、禁入点、胜负，也不连接服务器。角色文案来自项目已保存的默认配置快照。</p>'),
  settings: () => openDialog('样板设置','<p>浅灰工业终端 · 第二套主题</p><label class="range-setting">背景明度<input id="brightness" type="range" min="90" max="100" value="100" aria-label="背景明度"></label><p class="muted">仅调整这组样板的背景，原校园主题不受影响。</p>'),
  deploy: () => {selected=member;render();main.querySelector('[data-action="deploy"]').focus({preventScroll:true});notify(`已在样板中设为出战：${selected.name}`);},
  reset: () => {resetBoard();render();notify('演示棋盘已重置');},
  coords: () => {showCoordinates=!showCoordinates;render();main.querySelector('[data-action="coords"]').focus({preventScroll:true});},
  undo: () => {const move=moves.pop();if(!move)return;if(move.point!==null)stones.delete(move.point);turn=move.color;render();notify('已撤回上一手');},
  pass: () => {addMove(null);notify('已演示弃手，切换行棋方');},
  count: () => {const values=[...stones.values()];openDialog('棋盘概览',`<p>黑子 ${values.filter((value)=>value==='black').length} 枚 · 白子 ${values.filter((value)=>value==='white').length} 枚</p><p class="muted">样板仅统计画面上的棋子数量，不进行围地计分或胜负判定。</p>`);},
  skill: () => openDialog(selected.skill.name,`${skillContent(selected)}<p class="muted" style="margin-top:20px">仅预览技能面板和发动反馈，不改变棋盘规则。</p><button class="primary" data-action="cast" ${skillPreviewed?'disabled':''}>${skillPreviewed?'本次演示已发动':'预览发动反馈'} ${icon('star')}</button>`),
  'opponent-skill': () => {const opponent=people.find((person)=>person.id===(selected.id==='aemeath'?'sigrika':'aemeath'));openDialog(opponent.skill.name,skillContent(opponent));},
  cast: () => {skillPreviewed=true;dialog.close();main.querySelector('.battle')?.classList.add('skill-pulse');notify(`${selected.skill.name} · 发动反馈预览`);},
  draw: () => openDialog('申请和棋','<p>向对手提出和棋申请？</p><p class="muted">仅演示确认窗口，不发送请求。</p><div class="dialog-actions"><button class="outline-button" data-action="close">取消</button><button class="dark-button" data-action="confirm-draw">演示申请</button></div>'),
  'confirm-draw': () => {dialog.close();notify('和棋申请反馈预览');},
  resign: () => openDialog('确认认输','<p>确定结束这盘对弈？</p><p class="muted">本页仅为样板，演示结束不会影响任何战绩。</p><div class="dialog-actions"><button class="outline-button" data-action="close">继续对弈</button><button class="dark-button" data-action="finish">结束演示</button></div>'),
  finish: () => {dialog.close();resetBoard();navigate('home');notify('已结束本次演示');},
  close: () => dialog.close(),
};
document.addEventListener('click',(event)=>{
  const button=event.target.closest('button');
  if(!button || button.disabled)return;
  if(button.dataset.view)navigate(button.dataset.view);
  if(button.dataset.member){
    const scrollLeft=main.querySelector('.member-list').scrollLeft;
    const scrollTop=main.querySelector('.member-list').scrollTop;
    const query=main.querySelector('#member-search').value;
    member=people.find((person)=>person.id===button.dataset.member);render();
    main.querySelector('#member-search').value=query;
    main.querySelector('.member-list').innerHTML=rosterButtons(query);
    main.querySelector('.member-list').scrollLeft=scrollLeft;main.querySelector('.member-list').scrollTop=scrollTop;
    main.querySelector(`[data-member="${member.id}"]`)?.focus({preventScroll:true});
  }
  if(button.dataset.tab){detailTab=button.dataset.tab;document.querySelectorAll('[data-tab]').forEach((tab)=>{tab.setAttribute('aria-selected',String(tab.dataset.tab===detailTab));tab.tabIndex=tab.dataset.tab===detailTab?0:-1;});main.querySelector('#detail-panel').innerHTML=detailContent();main.querySelector('#detail-panel').setAttribute('aria-labelledby',`${detailTab}-tab`);}
  if(button.dataset.point!==undefined)addMove(Number(button.dataset.point));
  if(button.dataset.mode){modeName=button.dataset.mode;resetBoard();navigate('battle');}
  if(button.dataset.shell)openDialog(button.dataset.shell,`<p>「${escape(button.dataset.shell)}」的通用窗口外观预览。</p><p class="muted">本轮制作主界面、对弈和部员手册，这个入口的业务页面尚未展开。</p>`);
  if(button.dataset.action)actions[button.dataset.action]?.();
});
document.addEventListener('input',(event)=>{
  if(event.target.id==='member-search')main.querySelector('.member-list').innerHTML=rosterButtons(event.target.value.trim());
  if(event.target.id==='brightness')document.documentElement.style.setProperty('--bg',`hsl(80 7% ${Number(event.target.value)*.9}%)`);
});
document.addEventListener('keydown',(event)=>{
  if(event.target.matches('[role="tab"]') && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
    event.preventDefault();const tabs=[...document.querySelectorAll('[role="tab"]')];const index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(tabs.indexOf(event.target)+1)%tabs.length;tabs[index].click();tabs[index].focus();
  }
  if(event.target.matches('[data-point]') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
    event.preventDefault();const current=Number(event.target.dataset.point);const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-13,ArrowDown:13}[event.key];const next=current+delta;if(next>=0&&next<169)main.querySelector(`[data-point="${next}"]`).focus();
  }
});
document.querySelector('#dialog-close').addEventListener('click',()=>dialog.close());
document.querySelector('.brand').addEventListener('click',(event)=>{event.preventDefault();navigate('home');});
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
document.querySelectorAll('.header-actions button').forEach((button)=>{button.innerHTML=icon(button.dataset.action);});
render();
