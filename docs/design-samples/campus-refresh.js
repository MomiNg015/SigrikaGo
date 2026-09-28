const asset = '../../public/assets/';
const dialog = document.querySelector('#window');
const panel = document.querySelector('#panel-body');
let view = 'home';
let profileMode = 'spark';
let socialProfile = false;
let selectedFriend = null;
let friendFilter = 'all';
let inventoryFilter = 'all';
let selectedItem = 'candy';
let lastTrigger;
let toastTimer;
const modes = {
  spark: { title: '星炬', rank: '三段', rating: 1286, rows: [['sigrika', '西格莉卡', 68, 46, 21, 1], ['lynae', '琳奈', 32, 20, 12, 0], ['mornye', '莫宁', 18, 11, 7, 0], ['changli', '长离', 10, 5, 4, 1]], recent: 'WWLWWWLWDW' },
  standard: { title: '标准', rank: '二段', rating: 1162, rows: [['sigrika', '西格莉卡', 24, 14, 10, 0], ['mornye', '莫宁', 12, 7, 5, 0]], recent: 'LWLWWWLLWW' },
  gomoku: { title: '五子棋', rank: '五级', rating: 1040, rows: [['lynae', '琳奈', 15, 9, 6, 0], ['sigrika', '西格莉卡', 9, 5, 4, 0]], recent: 'WLWLWWLWLW' }
};
const friends = [
  { name: '晴空来信', character: 'lynae', state: 'online', label: '在线', rank: '二段' },
  { name: '晚风与棋', character: 'mornye', state: 'playing', label: '对弈中 · 标准围棋', rank: '四段' },
  { name: '薄荷汽水', character: 'chisa', state: 'online', label: '在线', rank: '初段' },
  { name: '山间一叶', character: 'qiuyuan', state: 'offline', label: '离线', rank: '五段' }
];
const items = [
  { id: 'candy', name: '彩虹豆豆跳跳糖', image: 'rainbow-bean-candy.webp', count: 3, type: 'consumable', kind: '特别道具', action: '使用道具' },
  { id: 'poster', name: '部员招募海报', image: 'recruitment-poster.webp', count: 5, type: 'recruit', kind: '招募道具', action: '前往招募' },
  { id: 'radio', name: '广播招募券', image: 'radio-recruitment-ticket.webp', count: 2, type: 'recruit', kind: '招募道具', action: '前往招募' },
  { id: 'ticket', name: '飞雪纪念票', image: 'aemeath-flight-snow-memorial-ticket.webp', count: 1, type: 'recruit', kind: '纪念道具', action: '查看用途' },
  { id: 'clock', name: '魔法时钟', image: 'magic-clock.svg', count: 4, type: 'consumable', kind: '特别道具', action: '查看用途' },
  { id: 'coin', name: '金币袋', image: 'gacha-coin-bag.svg', count: 6, type: 'consumable', kind: '奖励道具', action: '查看用途' }
];
const portrait = (id, alt = '') => `<img src="${asset}characters/portraits/${id}.webp" alt="${alt}">`;

function profile() {
  const data = modes[profileMode];
  const total = data.rows.reduce((n, r) => n + r[2], 0);
  const wins = data.rows.reduce((n, r) => n + r[3], 0);
  return `<div class="panel-layout"><aside class="profile-aside">${portrait(socialProfile ? 'lynae' : 'sigrika', socialProfile ? '琳奈立绘' : '西格莉卡立绘').replace('<img', '<img class="profile-portrait"')}<div class="online">${socialProfile ? '在线' : '在线'}</div><h3>${socialProfile ? '晴空来信' : '木漏れ日'}</h3><span class="uid">UID ${socialProfile ? '100028' : '100017'}</span><div class="profile-actions">${socialProfile ? '<button data-demo="邀请对弈">邀请对弈</button><button data-view="friends">返回好友</button>' : '<button data-demo="成就">成就</button><button data-demo="个性化">个性化</button>'}</div></aside><section><div class="content-heading"><h3>战绩</h3><div class="segmented" role="tablist" aria-label="对弈模式">${Object.entries(modes).map(([id, m]) => `<button role="tab" id="mode-${id}" aria-controls="mode-records" aria-selected="${profileMode === id}" tabindex="${profileMode === id ? 0 : -1}" data-mode="${id}">${m.title}</button>`).join('')}</div></div><div id="mode-records" role="tabpanel" aria-labelledby="mode-${profileMode}"><dl class="metrics"><div class="rank"><dt>当前段位</dt><dd>${data.rank}</dd></div><div><dt>积分</dt><dd>${data.rating.toLocaleString()}</dd></div><div><dt>总对局</dt><dd>${total}<small> 局</small></dd></div><div><dt>胜率</dt><dd>${(wins / total * 100).toFixed(1)}<small>%</small></dd></div></dl><div class="results-strip"><span>最近十盘</span><div class="results">${[...data.recent].map(r => `<span class="result ${r === 'L' ? 'loss' : ''}">${r === 'W' ? '胜' : r === 'L' ? '负' : '和'}</span>`).join('')}</div><button data-demo="对局回放">回放</button></div><h4 class="section-label">角色战绩</h4><table class="record-table"><thead><tr><th scope="col">角色</th><th scope="col">对局</th><th scope="col">胜</th><th scope="col">负</th><th scope="col">和</th><th scope="col">胜率</th></tr></thead><tbody>${data.rows.map(r => `<tr><td><div class="record-person">${portrait(r[0])}<span>${r[1]}</span></div></td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${(r[3] / r[2] * 100).toFixed(1)}%</td></tr>`).join('')}</tbody></table></div></section></div>`;
}
function friendsPage() {
  return `<div class="panel-layout"><aside class="friend-sidebar"><button class="side-item" data-friend-filter="all" aria-selected="${friendFilter === 'all'}">全部好友 <small>04</small></button><button class="side-item" data-friend-filter="online" aria-selected="${friendFilter === 'online'}">在线好友 <small>03</small></button></aside><section><label class="search-wrap"><span aria-hidden="true">⌕</span><input id="friend-search" aria-label="搜索好友" placeholder="搜索用户名" autocomplete="off"></label><div class="friends-heading"><span>我的好友</span><span id="friend-count"></span></div><div id="friend-list"></div></section></div>`;
}
function renderFriendList() {
  const input = document.querySelector('#friend-search');
  if (!input) return;
  const query = input.value.trim().toLowerCase();
  const shown = friends.filter(f => (friendFilter === 'all' || f.state !== 'offline') && f.name.toLowerCase().includes(query));
  document.querySelector('#friend-count').textContent = `${shown.length} 位好友`;
  document.querySelector('#friend-list').innerHTML = shown.length ? shown.map((f) => `<div class="friend-row">${portrait(f.character)}<div><div class="friend-name">${f.name}<span class="tag">${f.rank}</span></div><div class="friend-state ${f.state}">${f.label}</div></div><div class="friend-actions"><button data-friend-profile="${f.name}">履历</button><button class="invite" data-demo="${f.state === 'playing' ? '观战' : f.state === 'offline' ? '留言' : '邀请对弈'}">${f.state === 'playing' ? '观战' : f.state === 'offline' ? '留言' : '邀请对弈'}</button></div></div>`).join('') : '<div class="empty-state">未找到好友</div>';
}
function inventory() {
  const item = items.find(i => i.id === selectedItem);
  const shown = items.filter(i => inventoryFilter === 'all' || i.type === inventoryFilter);
  return `<div class="inventory-layout"><section><div class="inventory-tabs" role="tablist" aria-label="物品分类">${[['all', '全部'], ['consumable', '道具'], ['recruit', '招募']].map(([id, name]) => `<button role="tab" data-item-filter="${id}" aria-selected="${inventoryFilter === id}">${name}</button>`).join('')}<span>${shown.length} 种物品</span></div><div class="item-grid">${shown.map(i => `<button class="item" data-item="${i.id}" aria-pressed="${i.id === selectedItem}"><span class="quantity">×${i.count}</span><img src="${asset}items/${i.image}" alt=""><strong>${i.name}</strong></button>`).join('')}</div></section><aside class="item-detail" aria-label="选中物品详情"><img src="${asset}items/${item.image}" alt="${item.name}"><span class="type">${item.kind}</span><h3>${item.name}</h3><button class="use-item" data-demo="${item.action}">${item.action}</button><span class="detail-count">数量：${item.count}</span></aside></div>`;
}
function renderPanel() {
  const meta = { profile: socialProfile ? '详细信息' : '履历', friends: '好友', inventory: '仓库' }[view];
  if (!meta) return;
  dialog.dataset.view = view;
  document.querySelector('#panel-title').textContent = meta;
  panel.innerHTML = view === 'profile' ? profile() : view === 'friends' ? friendsPage() : inventory();
  if (view === 'profile' && socialProfile && selectedFriend) {
    document.querySelector('.profile-aside h3').textContent = selectedFriend.name;
    const image = document.querySelector('.profile-portrait');
    image.src = `${asset}characters/portraits/${selectedFriend.character}.webp`;
    image.alt = `${selectedFriend.name}的角色立绘`;
    document.querySelector('.profile-aside .online').textContent = selectedFriend.label;
    document.querySelector('.profile-aside .uid').textContent = `UID ${100028 + friends.indexOf(selectedFriend)}`;
  }
  if (view === 'friends') renderFriendList();
  document.querySelectorAll('[data-view]').forEach(b => {
    if (b.closest('.preview-bar,.window-nav')) {
      if (b.dataset.view === view) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    }
  });
  drawPaper();
}
function navigate(next, trigger) {
  if (next === 'home') { dialog.close(); return; }
  if (next === 'profile') socialProfile = false;
  view = next;
  renderPanel();
  if (!dialog.open) { lastTrigger = trigger; dialog.showModal(); }
  panel.scrollTop = 0;
  drawPaper();
}
function toast(label) {
  const message = document.querySelector('#toast');
  message.textContent = `${label} · 本样板仅演示入口，不执行真实操作`;
  message.hidden = false;
  if (dialog.open) dialog.append(message); else document.body.append(message);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { message.hidden = true; }, 2600);
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.view) navigate(button.dataset.view, button);
  else if (button.classList.contains('close-window')) dialog.close();
  else if (button.dataset.mode) { profileMode = button.dataset.mode; renderPanel(); document.querySelector(`[data-mode="${profileMode}"]`).focus(); }
  else if (button.dataset.friendFilter) { friendFilter = button.dataset.friendFilter; renderPanel(); document.querySelector(`[data-friend-filter="${friendFilter}"]`).focus(); }
  else if (button.dataset.friendProfile) {
    const friend = friends.find(f => f.name === button.dataset.friendProfile);
    selectedFriend = friend;
    socialProfile = true; view = 'profile'; renderPanel();
    document.querySelector('.profile-aside h3').textContent = friend.name;
    document.querySelector('.profile-portrait').src = `${asset}characters/portraits/${friend.character}.webp`;
    document.querySelector('.profile-portrait').alt = `${friend.name}的角色立绘`;
  }
  else if (button.dataset.itemFilter) { inventoryFilter = button.dataset.itemFilter; selectedItem = items.find(i => inventoryFilter === 'all' || i.type === inventoryFilter).id; renderPanel(); document.querySelector(`[data-item-filter="${inventoryFilter}"]`).focus(); }
  else if (button.dataset.item) { selectedItem = button.dataset.item; renderPanel(); document.querySelector(`[data-item="${selectedItem}"]`).focus({ preventScroll: true }); panel.scrollTop = 0; }
  else if (button.dataset.demo) toast(button.dataset.demo);
});
document.addEventListener('input', event => { if (event.target.id === 'friend-search') renderFriendList(); });
document.addEventListener('keydown', event => {
  const list = event.target.closest('[role="tablist"]');
  if (!list || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const buttons = [...list.querySelectorAll('button')];
  let index = buttons.indexOf(document.activeElement);
  if (index < 0) return;
  event.preventDefault();
  index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
  buttons[index].click();
});
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
dialog.addEventListener('close', () => {
  view = 'home';
  document.querySelectorAll('.preview-bar [data-view]').forEach(b => { if (b.dataset.view === 'home') b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  lastTrigger?.focus();
});
document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); dialog.close(); });
function drawPaper() {
  if (!window.rough) return;
  document.querySelectorAll('.sketch').forEach(s => s.remove());
  document.querySelectorAll('[data-sketch],.club-desk,.window-paper').forEach(el => {
    const width = el.clientWidth, height = el.clientHeight;
    if (!width || !height) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width); svg.setAttribute('height', height); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('sketch');
    const pen = window.rough.svg(svg);
    svg.append(pen.rectangle(2, 2, width - 4, height - 4, { seed: 19, stroke: el.classList.contains('club-desk') ? '#a28e643f' : '#a9997860', strokeWidth: .8, roughness: 1.1 }));
    el.append(svg);
  });
}
let resizeFrame;
window.addEventListener('resize', () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(drawPaper); });
document.fonts.ready.then(drawPaper);
drawPaper();
