import { art, characters, modes, results, recordRows } from './data.js';

const direction = document.body.dataset.direction;
const query = new URLSearchParams(location.search);
const state = { context: query.get('context') === 'social' ? 'social' : 'self', mode: 'spark', play: 'regular', fixture: query.get('fixture') || 'normal', character: 'sigrika', liked: false, friend: false, blocked: false, closed: false };
const app = document.querySelector('#app');
const dialog = document.querySelector('#detail-dialog');
let returnFocus = null;
let toastTimer;
const icons = {
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  like: '<path d="M7 10v11H3V10h4Zm0 0 4-7c1-1 3 0 2 3l-1 4h6c2 0 3 1 2 3l-2 6c0 1-1 2-3 2H7"/>',
  friend: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m3-13v6m-3-3h6"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  trophy: '<path d="M8 3h8v5a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 0v6m-4 3h8m-7-3h6"/>',
  edit: '<path d="m14 4 6 6M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14v6Z"/>',
  replay: '<rect x="3" y="4" width="18" height="13" rx="1"/><path d="m10 8 5 3-5 3V8ZM8 21h8m-4-4v4"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6"/>',
  report: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 3v1"/>'
};
const icon = name => `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.arrow}</svg>`;
const button = (action, label, symbol, extra = '') => `<button type="button" data-action="${action}" ${extra}>${symbol ? icon(symbol) : ''}<span>${label}</span></button>`;
const name = () => state.fixture === 'long' ? '今天也想和西格莉卡下一盘棋' : '莫名';
const currentCharacter = () => characters.find(character => character.id === state.character);
const currentStats = () => state.fixture === 'empty' ? { rank: 3, stars: 2, games: 0, wins: 0, losses: 0, draws: 0 } : modes[state.play === 'team' ? 'team' : state.mode];
const rate = record => record.games ? `${(record.wins / record.games * 100).toFixed(1)}%` : '—';

function actions() {
  if (state.context === 'self') return `<div class="identity-actions">${button('achievements', '成就', 'trophy')}${button('personalize', '个性化', 'edit')}</div>`;
  return `<div class="identity-actions social-actions">${button('like', `${state.liked ? 129 : 128}`, 'like', `aria-label="${state.liked ? '今日已点赞' : '点赞'}，${state.liked ? 129 : 128}次" ${state.liked ? 'disabled' : ''}`)}${button('friend', state.friend ? '已申请' : '加好友', 'friend', `${state.friend || state.blocked ? 'disabled' : ''}`)}${button('more', '更多', 'more', 'aria-label="更多社交操作"')}</div>`;
}
function identity() {
  return `<aside class="identity" aria-label="身份资料">
    <div class="identity-kicker"><span>SIGRIKA GO</span><span>围棋社成员</span></div>
    <div class="portrait-wrap"><div class="art-disc"></div><div class="art-word" aria-hidden="true">${direction === 'portrait' ? '放課後' : 'SIGRIKA'}</div><img class="hero-art" src="${art(state.character, direction === 'terminal')}" alt="${currentCharacter().name}${direction === 'terminal' ? '头像' : '全身立绘'}"></div>
    <div class="identity-copy"><p class="eyebrow">${state.context === 'self' ? '我的履历' : '详细资料'} <span class="identity-tag">星炬学院</span></p><h2>${name()}</h2><p class="identity-subline">每一盘棋，都是新的故事。</p><div class="identity-character"><span>展示角色</span><b>${currentCharacter().name}</b></div></div>
    ${actions()}<div class="identity-bottom"><span>星炬学院 · 围棋社</span><span>✦</span></div>
  </aside>`;
}
function navigation() {
  return `<div class="record-nav"><nav class="family-nav" aria-label="对弈类型">${Object.entries(modes).filter(([id]) => id !== 'team').map(([id, mode]) => `<button type="button" data-mode="${id}" aria-pressed="${state.mode === id}"><span>${mode.name}</span><small>${id === 'spark' ? 'SPARK' : id === 'standard' ? 'GO' : 'MORE'}</small></button>`).join('')}</nav>
    <nav class="play-nav" aria-label="具体玩法">${(state.mode === 'spark' ? [['regular', '常规匹配'], ['capture', '吃子挑战赛'], ['team', '队际赛']] : [['regular', state.mode === 'other' ? '五子棋' : '常规匹配']]).map(([id, label]) => `<button type="button" data-play="${id}" aria-pressed="${state.play === id}">${label}</button>`).join('')}</nav></div>`;
}
function summary() {
  const stats = currentStats();
  return `<section class="rank-and-stats" aria-label="当前玩法战绩"><div class="rank-panel"><div class="section-label">${icon('shield')}<span>当前段位</span></div><div class="rank-value"><strong>${stats.rank}</strong><span>段<small>DAN</small></span></div><div class="rank-stars" aria-label="${stats.stars}颗星，共5颗星">${Array.from({length:5}, (_, index) => `<span class="${index < stats.stars ? 'filled' : ''}">✦</span>`).join('')}</div><button class="rank-help" data-action="rank-help" aria-label="查看升降段规则">升降段规则 ↗</button></div>
    <div class="stats-panel"><div class="section-heading"><h3>${state.play === 'team' ? '队际赛战绩' : '升降级战绩'}</h3>${button('replays', '对局回放', 'replay')}</div><div class="major-metrics"><div><span>总对局</span><b>${stats.games}<small>局</small></b></div><div><span>胜率</span><b>${rate(stats)}</b></div></div><dl class="result-metrics"><div><dt><i class="result-dot win"></i>胜</dt><dd>${stats.wins}</dd></div><div><dt><i class="result-dot loss"></i>负</dt><dd>${stats.losses}</dd></div><div><dt><i class="result-dot draw"></i>和</dt><dd>${stats.draws}</dd></div></dl></div></section>`;
}
function recent() {
  return `<section class="recent" aria-label="最近十盘"><h3>最近十盘</h3><div class="result-chain">${state.fixture === 'empty' ? '<span class="empty-inline">还没有对局记录</span>' : results.map((result, index) => `<span class="result-chip ${result === '胜' ? 'win' : result === '负' ? 'loss' : 'draw'}" title="第${index+1}盘：${result}">${result}</span>`).join('')}</div><span class="recent-order">旧 → 新</span></section>`;
}
function roster() {
  const rows = state.fixture === 'empty' ? [] : recordRows(state.mode, state.play);
  if (state.mode !== 'spark') return `<section class="plain-mode"><span class="go-stones" aria-hidden="true">● ○</span><h3>${modes[state.mode].title}</h3><p>${state.mode === 'other' ? '纵横之间，连成自己的五颗星。' : '黑白之间，落子有声。'}</p><small>此玩法不使用角色技能</small></section>`;
  return `<section class="roster"><div class="section-heading"><h3>角色战绩</h3><span class="section-aside">${state.play === 'team' ? '按实际出场统计' : '按出场次数排序'}</span></div>${rows.length ? `<div class="roster-columns" aria-hidden="true"><span>角色</span><span>出场</span><span>胜 / 负 / 和</span><span>胜率</span></div><div class="character-list">${rows.map(character => `<button type="button" class="character-row" data-character="${character.id}" style="--character-color:${character.color}" aria-label="${character.name}，出场${character.games}次，${character.wins}胜${character.losses}负${character.draws}和，胜率${rate(character)}"><span class="character-identity"><span class="character-photo"><img src="${art(character.id, true)}" alt=""></span><b>${character.name}</b></span><span class="character-games"><small>出场</small>${character.games}<em>次</em></span><span class="character-outcomes"><small>胜 / 负 / 和</small>${character.wins} <i>/</i> ${character.losses} <i>/</i> ${character.draws}</span><span class="character-rate"><small>胜率</small>${rate(character)}${icon('chevron')}</span></button>`).join('')}</div>` : `<div class="empty-state"><span>○</span><h4>第一笔战绩，等你落子。</h4><p>完成对局后，这里会留下角色的出场记录。</p></div>`}</section>`;
}
function capture() {
  return `<section class="capture-panel"><p class="eyebrow">吃子挑战赛 / PERSONAL BEST</p>${state.fixture === 'empty' ? `<div class="empty-state"><span>○</span><h3>还没有挑战记录</h3><p>完成一次吃子挑战，留下你的个人最佳。</p></div>` : `<div class="capture-score"><span>最高吃子</span><b>86<small>子</small></b><p>挑战排名 <strong>12</strong></p></div><div class="capture-character"><img src="${art('sigrika',true)}" alt="西格莉卡"><div><small>纪录角色</small><h3>西格莉卡</h3><p>默认装扮 · 纪录时外观</p></div></div><p class="capture-note">棋盘再大，也要从眼前这一颗开始。</p>`}</section>`;
}
function records() {
  return `<section class="record-page" aria-label="对弈履历">${navigation()}<div class="record-body">${state.play === 'capture' ? capture() : summary() + recent() + roster()}</div><footer class="record-footer"><span>${modes[state.mode].title} / ${state.play === 'team' ? '队际赛' : state.play === 'capture' ? '吃子挑战赛' : '常规战绩'}</span><span>SIGRIKA GO</span></footer></section>`;
}
function tools() {
  return `<div class="sample-tools"><span class="sample-disclaimer">交互样板 · 示例数据</span><div class="context-switch" aria-label="查看身份"><button data-context="self" aria-pressed="${state.context==='self'}">我的履历</button><button data-context="social" aria-pressed="${state.context==='social'}">他人详情</button></div><label><span class="sr-only">示例数据状态</span><select id="fixture"><option value="normal" ${state.fixture==='normal'?'selected':''}>正常数据</option><option value="empty" ${state.fixture==='empty'?'selected':''}>空战绩</option><option value="long" ${state.fixture==='long'?'selected':''}>长用户名</option></select></label></div>`;
}
function render() {
  document.body.dataset.fixture = state.fixture;
  const active = document.activeElement;
  const focusKey = active?.dataset.action ? ['action', active.dataset.action] : active?.dataset.mode ? ['mode', active.dataset.mode] : active?.dataset.play ? ['play', active.dataset.play] : active?.dataset.context ? ['context', active.dataset.context] : null;
  const oldScroll = document.querySelector('.record-page')?.scrollTop ?? 0;
  const labels = { archive:['个人档案', 'CLUB MEMBER DOSSIER'], terminal:['对弈履历', 'PLAYER RECORD'], portrait:['我的棋局', 'A STORY OF YOUR OWN'] };
  app.innerHTML = tools() + (state.closed ? `<main class="closed-state"><h1>今天的故事，先停在这里。</h1>${button('reopen','重新打开履历','arrow')}</main>` : `<main class="stage"><article class="profile-window" aria-label="${labels[direction][0]}"><header class="window-head"><div class="window-title"><h1>${labels[direction][0]}</h1><span>${labels[direction][1]}</span></div><span class="window-meta">星炬学院 / 围棋社</span>${button('close','关闭','close','class="close-window" aria-label="关闭履历"')}</header><div class="surface">${identity()}${records()}</div></article><div class="stage-caption">${direction === 'archive' ? '收好这一页，下一盘再见。' : direction === 'terminal' ? '每一局的积累，都清晰可见。' : '放学后，在棋盘边等你。'}</div></main>`);
  const scroller = document.querySelector('.record-page');
  if(scroller) scroller.scrollTop = oldScroll;
  if(focusKey) document.querySelector(`[data-${focusKey[0]}="${focusKey[1]}"]`)?.focus({preventScroll:true});
}
function notify(message) {
  const toast = document.querySelector('.toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
}
function openDialog(title, contents) {
  if(!dialog.open) returnFocus = document.activeElement;
  dialog.innerHTML = `<header><h2 id="dialog-title">${title}</h2>${button('dismiss','关闭','close','class="dialog-close" aria-label="关闭弹窗"')}</header><div class="dialog-content">${contents}</div><div class="dialog-note">本页为交互样板，仅操作演示数据。</div>`;
  if(!dialog.open) dialog.showModal();
}
dialog.addEventListener('close', () => { if(returnFocus?.isConnected) returnFocus.focus(); });
function handleAction(action) {
  if(action === 'close' || action === 'reopen') { state.closed = action === 'close'; render(); document.querySelector(state.closed ? '[data-action=reopen]' : '[data-action=close]')?.focus(); }
  else if(action === 'dismiss') dialog.close();
  else if(action === 'like') { state.liked = true; render(); document.querySelector('[data-action=friend]')?.focus(); notify('已为这份履历点赞'); }
  else if(action === 'friend') { state.friend = true; render(); document.querySelector('[data-action=more]')?.focus(); notify('好友申请已在样板中标记'); }
  else if(action === 'more') openDialog('社交操作', `<div class="dialog-actions">${button('block', state.blocked ? '移出黑名单' : '加入黑名单','shield')}${button('report','举报用户','report')}</div>`);
  else if(action === 'block') openDialog(state.blocked ? '移出黑名单' : '加入黑名单', `<p>${state.blocked ? '恢复与这位社员的互动？' : '加入后，将限制与这位社员的互动。'}</p><div class="dialog-actions">${button('confirm-block','确认','shield')}${button('dismiss','取消')}</div>`);
  else if(action === 'confirm-block') { state.blocked = !state.blocked; dialog.close(); render(); document.querySelector('[data-action=more]')?.focus(); notify(state.blocked ? '样板状态：已加入黑名单' : '样板状态：已移出黑名单'); }
  else if(action === 'report') openDialog('举报用户', `<form id="report-form"><label>举报原因<select required name="reason"><option value="">请选择原因</option><option>不当言论</option><option>恶意骚扰</option><option>其它问题</option></select></label><label>补充说明<textarea name="detail" maxlength="200" rows="3" placeholder="请描述你遇到的问题"></textarea></label><button type="submit" class="primary-action">预览提交</button></form>`);
  else if(action === 'rank-help') openDialog('升降段规则', '<p>每赢 1 局加 1 星，每输 1 局减 1 星。满星后再赢 1 局升段，0 星后再输 1 局掉段。</p><p>进入新段位后，自动获得该段位一半的星数；九段使用积分制。</p>');
  else if(action === 'replays') openDialog('对局回放', state.fixture === 'empty' ? '<p class="empty-state">还没有可回放的对局。</p>' : `<p class="dialog-lead">${state.play === 'team' ? '队际赛' : modes[state.mode].title} · 最近对局</p><div class="replay-list">${[['白露','胜','156'],['风铃','负','203'],['早八不迟到','胜','128']].map(([opponent,result,moves]) => `<div class="replay-row"><span class="result-chip ${result==='胜'?'win':'loss'}">${result}</span><div><b>莫名 <small>对</small> ${opponent}</b><span>${moves} 手 · 已结束</span></div><span>演示棋谱</span></div>`).join('')}</div><p>此样板展示回放入口和列表排版；实际棋谱播放沿用项目现有回放窗口。</p>`);
  else if(action === 'achievements') openDialog('我的成就', `<p class="dialog-lead">让每一步认真，都有回响。</p><div class="achievement-list"><div>${icon('trophy')}<b>初次落子</b><span>演示：已达成</span></div><div>${icon('shield')}<b>百局同行</b><span>演示：128 / 100 局</span></div><div>${icon('like')}<b>社团之友</b><span>演示：已达成</span></div></div><p>此面板用于预览成就入口，正式成就内容沿用项目配置。</p>`);
  else if(action === 'personalize') openDialog('选择展示角色', `<p class="dialog-lead">让喜欢的伙伴，出现在你的履历里。</p><div class="portrait-options">${characters.slice(0,3).map(character => `<button data-pick="${character.id}" aria-pressed="${state.character===character.id}"><img src="${art(character.id)}" alt=""><span>${character.name}</span></button>`).join('')}</div>`);
}
document.addEventListener('click', event => {
  const target = event.target.closest('button');
  if(!target || target.disabled) return;
  if(target.dataset.action) handleAction(target.dataset.action);
  else if(target.dataset.context) { state.context = target.dataset.context; render(); }
  else if(target.dataset.mode) { state.mode = target.dataset.mode; state.play = 'regular'; render(); }
  else if(target.dataset.play) { state.play = target.dataset.play; render(); }
  else if(target.dataset.pick) { state.character = target.dataset.pick; dialog.close(); render(); document.querySelector('[data-action=personalize]')?.focus(); notify('展示角色已更换'); }
  else if(target.dataset.character) {
    const character = recordRows(state.mode,state.play).find(item => item.id === target.dataset.character);
    openDialog(`${character.name} · 角色战绩`, `<div class="character-detail"><img src="${art(character.id)}" alt="${character.name}全身立绘"><div><p class="eyebrow">${state.play==='team'?'队际赛':'常规匹配'}</p><h3>${character.name}</h3><p>出场 <b>${character.games}</b> 次</p><p>${character.wins} 胜 · ${character.losses} 负 · ${character.draws} 和</p><strong>${rate(character)}</strong><small>胜率</small></div></div>`);
  }
});
document.addEventListener('change', event => { if(event.target.id === 'fixture') { state.fixture = event.target.value; render(); document.querySelector('#fixture').focus(); } });
document.addEventListener('submit', event => { if(event.target.id === 'report-form') { event.preventDefault(); dialog.close(); document.querySelector('[data-action=more]')?.focus(); notify('举报预览完成，没有发送任何举报'); } });
document.addEventListener('keydown', event => {
  if(event.key === 'Escape' && !dialog.open && !state.closed) { handleAction('close'); return; }
  const nav = event.target.closest('.family-nav,.play-nav,.context-switch');
  if(!nav || !['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const buttons = [...nav.querySelectorAll('button')];
  const index = buttons.indexOf(event.target);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length-1 : (index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
  buttons[next].click();
});
render();
