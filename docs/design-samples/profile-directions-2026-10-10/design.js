const root = '../../../public/assets/';
const art = (id, full = false) => `${root}characters/handbook-chibi-sprites/${id}${full ? '' : '-avatar'}.webp`;
const designs = {
  folder: ['01', '社团档案夹', '身份留在左页，战绩归入右页。熟悉的校园纸面，清楚的档案层级。'],
  scoresheet: ['02', '对弈成绩单', '段位、胜负、最近十盘一眼读完。压低装饰密度，让数字成为主角。'],
  collection: ['03', '部员收藏册', '保留角色的存在感。总览与角色战绩分叶阅读，小屏也能从容翻看。'],
};
const rows = [
  ['sigrika', '西格莉卡', 48, 33, 14, 1], ['denia', '达妮娅', 32, 21, 10, 1],
  ['aemeath', '爱弥斯', 24, 15, 8, 1], ['lynae', '琳奈', 18, 11, 7, 0],
  ['chisa', '千咲', 14, 8, 6, 0], ['changli', '长离', 8, 4, 4, 0],
];
const modes = {
  spark: { label: '星炬', rank: '3段', stars: 2, rows, results: ['胜','负','胜','胜','和','胜','负','胜','胜','胜'] },
  standard: { label: '标准', rank: '2段', stars: 1, rows: [['sigrika','西格莉卡',22,13,9,0],['denia','达妮娅',14,8,6,0],['lynae','琳奈',8,4,4,0]], results: ['胜','负','负','胜','胜','负','胜','负','胜','胜'] },
  gomoku: { label: '五子棋', rank: '3段', stars: 2, rows: [], results: [] },
};
const groups = {
  spark: { label: '星炬对弈', entries: [['spark','常规匹配'],['capture','吃子挑战赛'],['team','队际赛']] },
  standard: { label: '标准对弈', entries: [['standard','常规匹配']] },
  other: { label: '玩些别的', entries: [['gomoku','五子棋']] },
};
const paths = {
  award: '<circle cx="12" cy="8" r="5"/><path d="m8 12-1 9 5-3 5 3-1-9"/>',
  edit: '<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15Z"/>',
  play: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="m10 8 5 3-5 3Z M8 22h8 M12 18v4"/>',
  like: '<path d="M7 10h-4v11h4Zm0 10h10a2 2 0 0 0 2-2l2-7a2 2 0 0 0-2-2h-5l1-5a2 2 0 0 0-3-2L7 10Z"/>',
  plus: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-3a7 7 0 0 1 14 0v3 M20 8v8 M16 12h8"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
const button = (action, label, glyph, cls = '') => `<button class="${cls}" data-action="${action}">${glyph ? icon(glyph) : ''}<span>${label}</span></button>`;
const safe = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rate = (wins, total) => total ? `${(wins / total * 100).toFixed(1)}%` : '0%';
const profile = document.querySelector('#profile');
const dialog = document.querySelector('#detail');
const params = new URLSearchParams(location.search);
let design = Object.hasOwn(designs, params.get('design')) ? params.get('design') : document.body.dataset.design || 'folder';
let context = params.get('context') === 'social' ? 'social' : 'self';
let mode = 'spark';
let group = 'spark';
let leaf = 'overview';
let state = 'normal';
let username = '星炬同学';
let liked = false;
let friend = false;
let blocked = false;
let lastTrigger;
let toastTimer;
document.querySelector('#context').value = context;

function data() {
  const entry = modes[mode] ?? modes.spark;
  const empty = state === 'empty' || !entry.rows.length;
  return { ...entry, rows: empty ? [] : entry.rows, results: empty ? [] : entry.results };
}
function total() {
  return data().rows.reduce((sum, row) => sum.map((n, i) => n + row[i + 2]), [0, 0, 0, 0]);
}
function identity(full = false) {
  const name = state === 'long' ? '在星炬学院认真下棋的同学' : context === 'self' ? username : '晚风同学';
  return `<div class="identity ${full ? 'full-identity' : ''}"><div class="portrait"><img src="${art(context === 'self' ? 'sigrika' : 'denia', full)}" alt="${context === 'self' ? '西格莉卡' : '达妮娅'}${full ? '立绘' : '头像'}"></div><div class="identity-text"><h2>${safe(name)}</h2><div class="identity-actions">${context === 'self' ? button('achievements','成就','award') + button('personalize','个性化','edit') : button('like', liked ? '已赞 129' : '点赞 128','like') + button('friend',friend ? '已是好友' : '加好友','plus','primary') + button('more','更多','more')}</div></div></div>`;
}
function tabs() {
  return `<div class="play-navigation"><nav class="mode-tabs" aria-label="玩法分类">${Object.entries(groups).map(([id,item])=>`<button data-group="${id}" aria-pressed="${group===id}">${item.label}</button>`).join('')}</nav><nav class="submode-tabs" aria-label="${groups[group].label}玩法">${groups[group].entries.map(([id,label])=>`<button data-mode="${id}" aria-pressed="${mode===id}">${label}</button>`).join('')}</nav></div>`;
}
function rank() {
  return `<section class="rank"><div class="rank-label">段位<button data-action="rules" class="help" aria-label="段位规则">?</button></div><div class="rank-line"><strong>${state === 'nine' ? '9段' : data().rank}</strong><span class="stars" aria-label="${state === 'nine' ? '1200分' : data().stars + '/4星'}">${state === 'nine' ? '<b>1,200 <small>分</small></b>' : '★'.repeat(data().stars) + '<em>' + '☆'.repeat(4 - data().stars) + '</em>'}</span></div></section>`;
}
function metrics() {
  const values = total();
  return `<section class="metrics" aria-label="战绩">${[...values,rate(values[1],values[0])].map((v,i) => `<div class="metric metric-${i}"><strong>${v}</strong><span>${['总对局','胜','负','和','胜率'][i]}</span></div>`).join('')}</section>`;
}
function recent() {
  return `<section class="recent" aria-label="最近十盘"><span class="recent-caption">最近十盘</span><div class="markers">${data().results.length ? data().results.map((r,i) => `<span class="result result-${r}" title="从旧到新，第${i+1}盘：${r}">${r}</span>`).join('') : '<span class="muted">暂无对局</span>'}</div></section>`;
}
function records(cards = false) {
  if (!data().rows.length) return '<div class="empty"><div class="empty-stones" aria-hidden="true"><i></i><i></i></div><p>暂无角色战绩</p></div>';
  if (cards) return `<div class="character-cards">${data().rows.map((r) => `<article class="character-card"><img src="${art(r[0])}" alt=""><div><h3>${r[1]}</h3><p>${r[2]} 局 <span>${r[3]}胜 / ${r[4]}负 / ${r[5]}和</span></p></div><strong>${rate(r[3],r[2])}<small>胜率</small></strong></article>`).join('')}</div>`;
  return `<table class="records"><thead><tr><th scope="col">角色</th><th scope="col">对局</th><th scope="col">胜</th><th scope="col">负</th><th scope="col">和</th><th scope="col">胜率</th></tr></thead><tbody>${data().rows.map((r) => `<tr><th scope="row"><img src="${art(r[0])}" alt=""><span>${r[1]}</span></th>${r.slice(2).map((n) => `<td>${n}</td>`).join('')}<td><strong>${rate(r[3],r[2])}</strong></td></tr>`).join('')}</tbody></table>`;
}
function feedback() {
  if (state === 'loading') return '<div class="feedback" role="status">正在载入标准对弈战绩，当前仍显示星炬常规匹配。<button data-action="retry">完成演示加载</button></div>';
  if (state === 'error') return '<div class="feedback error" role="alert">标准对弈战绩加载失败，当前仍显示星炬常规匹配。<button data-action="retry">重新加载</button></div>';
  return '';
}
function challenge() {
  if(state==='empty')return '<div class="empty"><p>暂无吃子挑战成绩</p></div>';
  return `<section class="challenge-panel"><div class="section-heading"><h3>吃子挑战赛</h3>${button('challenge-ranking','排行榜',null,'replay')}</div><div class="challenge-score"><div><span>最高提子</span><strong>72 <small>子</small></strong></div><div><span>当前排名</span><strong>8 <small>名</small></strong></div></div><div class="challenge-character"><img src="${art('denia')}" alt="达妮娅头像"><div><span>最佳成绩使用角色</span><h3>达妮娅</h3></div></div></section>`;
}
function teamRecords() {
  if(state==='empty')return '<div class="empty"><p>暂无队际赛记录</p></div>';
  const teams = [['sigrika','denia','aemeath'],['lynae','chisa','changli']];
  return `<section class="team-records"><div class="section-heading"><h3>队际赛记录</h3><span class="record-scope">不计段位</span></div>${['胜','负','胜'].map((result,i)=>`<article class="team-record"><div class="team-record-heading"><span class="result result-${result}">${result}</span><strong>对阵 ${['落子同学','树下同学','棋社同学'][i]}</strong><span>${[126,104,148][i]} 手</span></div><div class="team-lineups">${teams.map((team,side)=>`<div><span>${side?'对手':'己方'}</span>${team.map((id,j)=>`<div class="team-slot"><img src="${art(id)}" alt="${rows.find(r=>r[0]===id)[1]}"><small>${j+1}</small></div>`).join('')}</div>`).join('')}</div>${button('team-replay','对局回放','play','replay')}</article>`).join('')}</section>`;
}
function render() {
  const d = designs[design];
  document.querySelector('#direction-index').textContent = `方向 ${d[0]}`;
  document.querySelector('#direction-name').textContent = d[1];
  document.querySelector('#direction-description').textContent = d[2];
  document.querySelectorAll('[data-design]').forEach((b) => b.setAttribute('aria-pressed',String(b.dataset.design === design)));
  profile.className = `profile ${design}`;
  const header = `<header class="window-head"><h2 class="window-title"><img src="${root}window-titles/${context === 'self' ? 'resume' : 'profile'}.webp" alt="${context === 'self' ? '履历' : '详细资料'}"></h2><div class="window-tools">${context === 'self' ? '<span class="wallet" title="金币">◉ <b>2,480</b></span>' : ''}<button class="close" data-action="close" aria-label="关闭窗口">×</button></div></header>`;
  const replay = button('replays','对局回放','play','replay');
  const heading = `<div class="section-heading"><h3>升降级战绩</h3>${replay}</div>`;
  const special = mode==='capture' ? challenge() : mode==='team' ? teamRecords() : '';
  if (design === 'folder') profile.innerHTML = `${header}<div class="folder-body"><aside class="identity-page">${identity()}${special?'':rank()}</aside><div class="data-page">${tabs()}${feedback()}${special || heading+metrics()+recent()+records()}</div></div>`;
  if (design === 'scoresheet') profile.innerHTML = `${header}<div class="score-body"><div class="score-identity">${identity()}${tabs()}</div>${feedback()}${special || `<div class="score-summary">${rank()}<div class="score-numbers">${heading}${metrics()}</div></div>${recent()}${records()}`}</div>`;
  if (design === 'collection') profile.innerHTML = `${header}<div class="collection-body"><aside class="character-page">${identity(true)}</aside><div class="collection-data">${tabs()}${feedback()}${special || `<nav class="leaf-tabs" aria-label="资料分叶"><button data-leaf="overview" aria-pressed="${leaf === 'overview'}">升降级战绩</button><button data-leaf="characters" aria-pressed="${leaf === 'characters'}">角色战绩</button></nav>${leaf === 'overview' ? `<div class="collection-overview">${rank()}${metrics()}${recent()}${replay}</div>` : records(true)}`}</div></div>`;
  document.querySelector('#data-state option[value="nine"]').disabled=Boolean(special);
  profile.querySelector('[data-action="like"]')?.setAttribute('aria-pressed',String(liked));
  if (liked) profile.querySelector('[data-action="like"]').disabled = true;
  if (friend || blocked) { const b = profile.querySelector('[data-action="friend"]'); if (b) b.disabled = true; }
}
function notify(message) {
  const el = document.querySelector('.toast');
  clearTimeout(toastTimer); el.textContent = message; el.hidden = false;
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}
function show(title, content) {
  if (!dialog.open) lastTrigger = document.activeElement;
  document.querySelector('#detail-title').textContent = title;
  document.querySelector('#detail-body').innerHTML = content;
  if (!dialog.open) dialog.showModal();
}
const demoNote = '<p class="demo-note">交互演示，不会提交到账号。</p>';
function action(id) {
  if (id === 'close') { profile.hidden = true; document.querySelector('#reopen').hidden = false; document.querySelector('#reopen').focus(); }
  if (id === 'dismiss') dialog.close();
  if (id === 'achievements') show('成就', '<p>正式接入时打开已有成就窗口，履历保留在下层。</p><div class="entry-preview">'+icon('award')+'<strong>成就与已装备铭牌</strong></div>'+demoNote);
  if (id === 'personalize') show('个性化',`<label class="field">样板用户名<input id="sample-name" maxlength="24" value="${safe(username)}"></label>${button('save-name','应用到样板',null,'primary')}${demoNote}`);
  if (id === 'save-name') { const v = document.querySelector('#sample-name').value.trim(); if (!v) return; username = v; state = 'normal'; document.querySelector('#data-state').value = state; render(); dialog.close(); }
  if (id === 'like') { liked = true; render(); profile.querySelector('[data-action="more"]').focus(); notify('样板已点赞'); }
  if (id === 'friend') show('添加好友',`<p>将晚风同学添加为好友？</p>${button('confirm-friend','添加好友',null,'primary')}${demoNote}`);
  if (id === 'confirm-friend') { friend = true; render(); dialog.close(); notify('样板关系已更新为好友'); }
  if (id === 'more') show('更多操作',`${button('block',blocked ? '已加入黑名单' : '加入黑名单',null,'danger')}${button('report','举报',null,'danger')}${demoNote}`);
  if (id === 'block') show('加入黑名单',`<p>确定将晚风同学加入黑名单？</p><div class="dialog-actions">${button('dismiss','取消')}${button('confirm-block','加入黑名单',null,'danger')}</div>${demoNote}`);
  if (id === 'confirm-block') { blocked = true; friend = false; render(); dialog.close(); notify('仅在样板中标记黑名单'); }
  if (id === 'report') show('举报',`<label class="field">举报内容<textarea id="report-content" maxlength="500" rows="4" placeholder="请填写具体情况"></textarea></label><button class="danger" data-action="confirm-report" disabled>提交举报</button>${demoNote}`);
  if (id === 'confirm-report') { dialog.close(); notify('演示举报已完成，未发送数据'); }
  if (id === 'replays') show(`${data().label}常规对局 · 回放`,data().results.length ? `<div class="replay-list">${data().results.slice().reverse().map((r,i) => `<div><span>演示对局 ${10-i}<small>${i%3===2?'友谊对局':'升降级对局'}</small></span><span class="result result-${r}">${r}</span></div>`).join('')}</div><p class="demo-note">演示记录列表包含升降级与友谊对局；友谊对局不计入升降级战绩。</p>` : '<div class="empty"><p>暂无对局回放</p></div>');
  if (id === 'challenge-ranking') show('吃子挑战排行榜','<div class="replay-list"><div><span>1　落子同学</span><strong>98 子</strong></div><div><span>2　树下同学</span><strong>92 子</strong></div><div><span>8　'+safe(context==='self'?username:'晚风同学')+'</span><strong>72 子</strong></div></div><p class="demo-note">演示排名节选；正式接入复用吃子挑战排行榜数据。</p>');
  if (id === 'team-replay') show('队际赛棋谱','<p>保留双方三名部员的出场顺序与换轮信息，接入项目已有队际赛回放。</p><p class="demo-note">本样板展示记录入口，不模拟棋局。队际赛不计入个人段位、胜率或角色胜场。</p>');
  if (id === 'rules') show('段位规则','<p>每赢一局加一星，每输一局减一星；满星后再胜晋段，零星后再负降段。</p><p>3段及以下每段4星，4至6段每段6星，7至8段每段8星；9段使用积分。</p>');
  if (id === 'retry') { state = 'normal'; group='standard'; mode = 'standard'; document.querySelector('#data-state').value = state; render(); }
}
dialog.addEventListener('close', () => { if (lastTrigger?.isConnected) lastTrigger.focus(); else profile.querySelector('[data-action]')?.focus(); });
document.addEventListener('input',(e) => { if (e.target.id === 'report-content') dialog.querySelector('[data-action="confirm-report"]').disabled = !e.target.value.trim(); });
document.addEventListener('click',(e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.design) { design = b.dataset.design; render(); history.replaceState(null,'',`?design=${design}&context=${context}`); }
  if (b.dataset.group) { group=b.dataset.group;mode=groups[group].entries[0][0];state='normal';document.querySelector('#data-state').value=state;render();profile.querySelector(`[data-group="${group}"]`).focus(); }
  if (b.dataset.mode) { mode = b.dataset.mode; if (['loading','error'].includes(state)) {state='normal';document.querySelector('#data-state').value=state;} render(); profile.querySelector(`[data-mode="${mode}"]`).focus(); }
  if (b.dataset.leaf) { leaf = b.dataset.leaf; render(); profile.querySelector(`[data-leaf="${leaf}"]`).focus(); }
  if (b.dataset.action) action(b.dataset.action);
  if (b.id === 'phone') { document.body.classList.toggle('phone'); b.setAttribute('aria-pressed',String(document.body.classList.contains('phone'))); }
  if (b.id === 'reopen') { profile.hidden = false; b.hidden = true; profile.querySelector('.close').focus(); }
});
document.querySelector('#context').addEventListener('change',(e) => { context=e.target.value;render(); });
document.querySelector('#data-state').addEventListener('change',(e) => { state=e.target.value;if (['loading','error'].includes(state)){mode='spark';group='spark';}render(); });
document.addEventListener('keydown',(e) => {
  if (dialog.open || e.target.closest('input,textarea,select')) return;
  if (['1','2','3'].includes(e.key)) { design=Object.keys(designs)[Number(e.key)-1]; render(); }
  if (e.target.matches('[data-group],[data-mode]') && ['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault();const isGroup=Boolean(e.target.dataset.group);const ids=isGroup?Object.keys(groups):groups[group].entries.map(e=>e[0]);const current=isGroup?e.target.dataset.group:e.target.dataset.mode;const next=ids[(ids.indexOf(current)+(e.key==='ArrowRight'?1:ids.length-1))%ids.length];if(isGroup){group=next;mode=groups[group].entries[0][0];}else mode=next;render();profile.querySelector(`[data-${isGroup?'group':'mode'}="${next}"]`).focus(); }
});
render();
