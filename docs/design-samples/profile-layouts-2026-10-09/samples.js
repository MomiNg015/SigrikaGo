const assetRoot = '../../../public/assets/';
const avatar = (id) => `${assetRoot}characters/handbook-chibi-sprites/${id}-avatar.webp`;
const rows = [
  { id: 'sigrika', name: '西格莉卡', total: 48, wins: 33, losses: 14, draws: 1 },
  { id: 'denia', name: '达妮娅', total: 32, wins: 21, losses: 10, draws: 1 },
  { id: 'aemeath', name: '爱弥斯', total: 24, wins: 15, losses: 8, draws: 1 },
  { id: 'lynae', name: '琳奈', total: 18, wins: 11, losses: 7, draws: 0 },
  { id: 'chisa', name: '千咲', total: 14, wins: 8, losses: 6, draws: 0 },
  { id: 'changli', name: '长离', total: 8, wins: 4, losses: 4, draws: 0 },
];
const modes = {
  spark: { name: '星炬', rank: '三段', stars: 2, rows, results: ['胜', '负', '胜', '胜', '和', '胜', '负', '胜', '胜', '胜'] },
  standard: { name: '标准', rank: '二段', stars: 1, rows: [
    { id: 'sigrika', name: '西格莉卡', total: 22, wins: 13, losses: 9, draws: 0 },
    { id: 'denia', name: '达妮娅', total: 14, wins: 8, losses: 6, draws: 0 },
    { id: 'lynae', name: '琳奈', total: 8, wins: 4, losses: 4, draws: 0 },
  ], results: ['胜', '负', '负', '胜', '胜', '负', '胜', '负', '胜', '胜'] },
  gomoku: { name: '五子棋', rank: '初段', stars: 0, rows: [], results: [] },
};
const icons = {
  award: '<path d="m8 14-1 7 5-3 5 3-1-7"/><circle cx="12" cy="8" r="6"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 2 2 0 0 1 1-3.3h3a3 3 0 0 0 3-3C21 6 17 3 12 3Z"/><circle cx="7.5" cy="10" r=".7"/><circle cx="11" cy="7" r=".7"/><circle cx="15" cy="8" r=".7"/>',
  replay: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="m10 8 5 3-5 3Z M8 21h8 M12 17v4"/>',
  close: '<path d="m6 6 12 12 M18 6 6 18"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const rate = (wins, total) => total ? `${(wins / total * 100).toFixed(1)}%` : '0%';
const profile = document.querySelector('#profile');
const dialog = document.querySelector('#detail-dialog');
let layout = new URLSearchParams(location.search).get('layout') || 'dossier';
if (!['dossier', 'horizontal', 'notebook'].includes(layout)) layout = 'dossier';
let mode = 'spark';
let phone = false;
let sampleName = '星炬同学';

function tools() {
  return `<div class="identity-actions"><button data-detail="achievement" aria-label="成就" title="成就">${icon('award')}<span>成就</span></button><button data-detail="personalization" aria-label="个性化" title="个性化">${icon('palette')}<span>个性化</span></button></div>`;
}
function identity() {
  return `<div class="identity"><div class="portrait"><img src="${avatar('sigrika')}" alt="西格莉卡头像"></div><h2>星炬同学</h2>${tools()}</div>`;
}
function tabs() {
  return `<nav class="mode-tabs" aria-label="对弈模式">${Object.entries(modes).map(([id, entry]) => `<button data-mode="${id}" aria-pressed="${mode === id}">${entry.name}</button>`).join('')}</nav>`;
}
function rank() {
  return `<div class="rank"><span class="section-label">段位 <button class="help" data-detail="rank" aria-label="段位规则">?</button></span><div class="rank-value"><strong>${modes[mode].rank}</strong><span class="stars" aria-label="${modes[mode].stars}星">${[0, 1, 2, 3].map((i) => `<span class="${i < modes[mode].stars ? 'filled' : ''}" aria-hidden="true">${i < modes[mode].stars ? '★' : '☆'}</span>`).join('')}</span></div></div>`;
}
function stats() {
  const values = modes[mode].rows.reduce((all, row) => { for (const key of ['total', 'wins', 'losses', 'draws']) all[key] += row[key]; return all; }, { total: 0, wins: 0, losses: 0, draws: 0 });
  return `<section class="stats" aria-label="战绩"><div class="section-heading"><h3>战绩</h3><button class="replay" data-detail="replay">${icon('replay')}<span>对局回放</span></button></div><dl class="metrics">${[['总对局', values.total], ['胜', values.wins], ['负', values.losses], ['和', values.draws], ['胜率', rate(values.wins, values.total)]].map(([label, value], i) => `<div class="metric metric-${i}"><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></section>`;
}
function results() {
  return `<section class="recent" aria-label="最近十盘"><h3>最近十盘</h3><div class="result-markers">${modes[mode].results.length ? modes[mode].results.map((result, i) => `<span class="result ${result === '胜' ? 'win' : result === '负' ? 'loss' : 'draw'}" title="第${i + 1}盘：${result}">${result}</span>`).join('') : '<span class="empty-results">暂无对局</span>'}</div></section>`;
}
function records() {
  return `<section class="records" aria-label="角色战绩"><h3>角色战绩</h3>${modes[mode].rows.length ? `<div class="table-scroll"><table><thead><tr><th scope="col">角色</th><th scope="col">对局</th><th scope="col">胜</th><th scope="col">负</th><th scope="col">和</th><th scope="col">胜率</th></tr></thead><tbody>${modes[mode].rows.map((row) => `<tr><th scope="row"><div class="character"><img src="${avatar(row.id)}" alt=""><span>${row.name}</span></div></th><td>${row.total}</td><td>${row.wins}</td><td>${row.losses}</td><td>${row.draws}</td><td class="rate"><span>${rate(row.wins, row.total)}</span><i style="--rate:${row.wins / row.total * 100}%" aria-hidden="true"></i></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-records">暂无角色战绩</div>'}</section>`;
}
function render() {
  profile.className = `profile ${layout}`;
  const heading = `<header class="window-header"><h1>履历</h1><button class="close" data-detail="preview" aria-label="关闭履历">${icon('close')}</button></header>`;
  if (layout === 'dossier') profile.innerHTML = `${heading}<div class="dossier-body"><aside class="identity-page">${identity()}${tabs()}</aside><div class="record-page"><div class="summary">${rank()}${stats()}</div>${results()}${records()}</div></div>`;
  if (layout === 'horizontal') profile.innerHTML = `${heading}<div class="horizontal-body"><div class="identity-band">${identity()}${rank()}</div>${tabs()}${stats()}${results()}${records()}</div>`;
  if (layout === 'notebook') profile.innerHTML = `${heading}<div class="notebook-body"><aside class="notebook-left">${identity()}${rank()}${stats()}</aside><div class="binding" aria-hidden="true">${'<i></i>'.repeat(12)}</div><div class="notebook-right">${tabs()}${results()}${records()}</div></div>`;
  document.querySelectorAll('[data-layout]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.layout === layout)));
  profile.querySelector('.identity h2').textContent = sampleName;
}
function showDetail(kind) {
  const content = {
    achievement: ['成就', '<div class="achievement-sample"><span>☆</span><div><strong>初次胜利</strong><p>赢得第一场对局</p></div></div><div class="achievement-sample"><span>♜</span><div><strong>百局之旅</strong><p>累计完成 100 场对局</p></div></div>'],
    personalization: ['个性化', `<div class="personalization-preview"><img src="${avatar('sigrika')}" alt="西格莉卡头像"><label>用户名<input id="name-input" value="星炬同学" maxlength="8"></label></div><button id="save-name" class="primary">保存样板姓名</button>`],
    replay: ['对局回放', modes[mode].results.length ? `<div class="replay-list">${modes[mode].results.slice(0, 4).map((result, i) => `<div><strong>${modes[mode].name}对弈 · 第${i + 1}盘</strong><span>${result}</span></div>`).join('')}</div><p class="demo-note">样板仅展示回放列表，使用演示数据。</p>` : '<p>暂无对局回放</p>'],
    rank: ['段位规则', '<p>每赢 1 局加 1 星，每输 1 局减 1 星。满星后再赢 1 局升段，0 星后再输 1 局掉段。进入新段位后自动获得该段位一半的星数。</p>'],
    preview: ['履历样板', '<p>可在顶部切换三套布局，或切换到手机预览。</p>'],
  }[kind];
  document.querySelector('#detail-title').textContent = content[0];
  document.querySelector('#detail-body').innerHTML = content[1];
  dialog.showModal();
}
document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.layout) { layout = button.dataset.layout; render(); history.replaceState(null, '', `?layout=${layout}`); }
  if (button.dataset.mode) { mode = button.dataset.mode; render(); profile.querySelector(`[data-mode="${mode}"]`).focus(); }
  if (button.dataset.detail) showDetail(button.dataset.detail);
  if (button.id === 'phone-toggle') { phone = !phone; document.body.classList.toggle('phone-preview', phone); button.setAttribute('aria-pressed', String(phone)); }
  if (button.id === 'detail-close') dialog.close();
  if (button.id === 'save-name') { const value = document.querySelector('#name-input').value.trim(); if (value) { sampleName = value; profile.querySelector('.identity h2').textContent = value; } dialog.close(); }
});
document.addEventListener('keydown', (event) => {
  if (event.target.closest('input') || dialog.open) return;
  if (['1', '2', '3'].includes(event.key)) { layout = ['dossier', 'horizontal', 'notebook'][Number(event.key) - 1]; render(); history.replaceState(null, '', `?layout=${layout}`); }
  if (event.target.matches('[data-mode]') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    const ids = Object.keys(modes);
    mode = ids[(ids.indexOf(mode) + (event.key === 'ArrowRight' ? 1 : 2)) % 3];
    render(); profile.querySelector(`[data-mode="${mode}"]`).focus();
  }
});
render();
