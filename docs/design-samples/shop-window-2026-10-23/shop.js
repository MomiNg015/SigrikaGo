const catalog = await fetch(new URL('./catalog.json', import.meta.url)).then(response => response.json());
const query = new URLSearchParams(location.search);
const variant = ['a', 'b', 'c'].includes(query.get('variant')) ? query.get('variant') : 'a';
const scenario = query.get('scenario') || 'normal';
const shop = document.querySelector('#shop');
const detail = document.querySelector('#detail');
const state = { store: 'goods', selected: 0, offset: 0, coins: scenario === 'poor' ? 5 : 1280, owned: new Set(), bought: {}, thanks: false, cooling: false };
const escape = text => String(text ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const getItems = () => scenario === 'empty' ? [] : Array.from({ length: Math.min(5, catalog[state.store].length) }, (_, index) => catalog[state.store][(state.offset + index) % catalog[state.store].length]);
function itemStatus(item) {
  const index = catalog[state.store].indexOf(item);
  if (state.owned.has(item.id) || (scenario === 'mixed' && index === 1)) return '已拥有';
  if ((scenario === 'mixed' && index === 2) || (item.stock >= 0 && (state.bought[item.id] || 0) >= item.stock)) return '已售罄';
  if (scenario === 'mixed' && index === 3 && state.store === 'costumes') return '需先获得角色';
  if (state.coins < item.price) return '金币不足';
  return '';
}
const itemImage = item => `<img src="${escape(item.image)}" alt="${escape(item.name)}" draggable="false">`;
const price = item => `<span class="price"><b>${item.price}</b><span>金币</span></span>`;
function buyButton(item) {
  const status = itemStatus(item);
  return `<button class="primary buy" data-action="buy" data-id="${item.id}" ${status ? 'disabled' : ''}>${status || '购买'}</button>`;
}
function tags(item) {
  const stock = item.stock >= 0 ? item.stock - (state.bought[item.id] || 0) : null;
  return `<div class="item-tags"><span>${escape(item.character || item.category)}</span>${stock !== null ? `<span>余 ${stock}</span>` : ''}</div>`;
}
function merchant() {
  const costume = state.store === 'costumes';
  const src = costume ? `/assets/costumes/nivora-${state.thanks ? 'thanks' : 'greeting'}.webp` : `/assets/zahira_shop_${state.thanks ? 'laugh' : 'default'}.webp`;
  const line = state.thanks ? (costume ? '嗯，还挺有眼光的。' : '请收好……看来，它也一直在等你。') : scenario === 'empty' ? (costume ? '真不凑巧呢，今天没有能给你看的东西。' : '今天的货物都已有归处了。等下次集市再见吧。') : costume ? '今天想扮演谁呢？' : '欢迎。请先随意看看，不必急着开口。';
  return `<aside class="merchant"><p class="speech">${line}</p><img class="mascot" src="${src}" alt="${costume ? '娜波摩' : '扎希拉'}"></aside>`;
}
function card(item) {
  return `<article class="product-card ${itemStatus(item) ? 'unavailable' : ''}">${tags(item)}<button class="card-detail" data-action="detail" data-id="${item.id}" aria-label="查看${escape(item.name)}详情"><span class="product-art">${itemImage(item)}</span><strong>${escape(item.name)}</strong></button><div class="card-bottom">${price(item)}${buyButton(item)}</div></article>`;
}
function selectedPanel(item) {
  return `<section class="selected-panel" aria-label="选中商品"><button class="selected-art" data-action="detail" data-id="${item.id}" aria-label="查看${escape(item.name)}详情">${itemImage(item)}</button><div class="selected-copy">${tags(item)}<h2>${escape(item.name)}</h2><p>${escape(item.description)}</p><div class="selected-actions">${price(item)}${buyButton(item)}</div><button class="text-button more" data-action="detail" data-id="${item.id}">查看详情 ↗</button></div></section>`;
}
function render() {
  const items = getItems();
  state.selected = Math.min(state.selected, Math.max(0, items.length - 1));
  shop.className = `shop variant-${variant} ${state.store}`;
  document.querySelector('#balance').textContent = state.coins;
  document.querySelector('#shop-title').textContent = state.store === 'costumes' ? '残星会cosplay部' : '扎希拉商铺';
  document.querySelectorAll('[data-store]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.store === state.store)));
  document.querySelector('.refresh').disabled = state.cooling || !items.length;
  const content = document.querySelector('#content');
  if (!items.length) {
    content.innerHTML = `<div class="empty"><h2>${state.store === 'costumes' ? '暂无服装' : '暂时没有商品'}</h2><p>可以去另一间商铺逛逛。</p><button class="primary" data-action="switch">${state.store === 'costumes' ? '扎希拉商铺' : '残星会'}</button></div>${merchant()}`;
    return;
  }
  if (variant === 'a') content.innerHTML = `<div class="shelf-scroll"><div class="shelf-grid">${items.map(card).join('')}</div></div>${merchant()}`;
  if (variant === 'b') content.innerHTML = `<div class="catalog-list" aria-label="商品清单">${items.map((item, index) => `<button class="catalog-row" data-action="select" data-index="${index}" aria-pressed="${index === state.selected}"><span class="row-art">${itemImage(item)}</span><span class="row-copy"><small>${escape(item.character || item.category)}</small><strong>${escape(item.name)}</strong><span>${itemStatus(item) || `${item.price} 金币`}</span></span><span class="row-arrow" aria-hidden="true">›</span></button>`).join('')}</div><div class="inspector">${selectedPanel(items[state.selected])}${merchant()}</div>`;
  if (variant === 'c') content.innerHTML = `<div class="counter-scene">${selectedPanel(items[state.selected])}${merchant()}</div><div class="counter-tray"><button class="icon-button previous" data-action="previous" aria-label="上一件">‹</button><div class="thumbnail-strip" aria-label="挑选商品">${items.map((item, index) => `<button class="thumbnail" data-action="select" data-index="${index}" aria-pressed="${index === state.selected}" aria-label="挑选${escape(item.name)}">${itemImage(item)}<span>${item.price} 金币</span></button>`).join('')}</div><button class="icon-button next" data-action="next" aria-label="下一件">›</button></div>`;
}
function openDetail(item) {
  document.querySelector('#detail-content').innerHTML = `<header class="detail-header"><span>商品详情</span><button class="icon-button" data-action="close-detail" aria-label="关闭详情">×</button></header><div class="detail-art">${itemImage(item)}</div>${tags(item)}<h2 id="detail-title">${escape(item.name)}</h2><p class="detail-description">${escape(item.description)}</p><div class="detail-purchase">${price(item)}${buyButton(item)}</div>`;
  detail.dataset.itemId = item.id;
  if (!detail.open) detail.showModal();
}
let toastTimeout;
function notice(text) {
  clearTimeout(toastTimeout);
  const toast = document.querySelector('#toast');
  toast.textContent = text;
  toast.classList.add('visible');
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 2800);
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.store) {
    state.store = button.dataset.store; state.selected = 0; state.offset = 0; state.thanks = false; render(); return;
  }
  if (button.matches('.close')) { detail.close(); shop.hidden = true; document.querySelector('#closed').hidden = false; document.querySelector('#reopen').focus(); return; }
  if (button.id === 'reopen') { shop.hidden = false; document.querySelector('#closed').hidden = true; document.querySelector('.close').focus(); return; }
  const action = button.dataset.action;
  const item = catalog[state.store].find(entry => entry.id === button.dataset.id);
  if (action === 'detail') openDetail(item);
  if (action === 'close-detail') detail.close();
  if (action === 'select' || action === 'previous' || action === 'next') {
    state.selected = action === 'select' ? Number(button.dataset.index) : (state.selected + (action === 'next' ? 1 : -1) + getItems().length) % getItems().length;
    render();
    const selected = document.querySelector(`#content [data-action="select"][data-index="${state.selected}"]`);
    selected?.focus({ preventScroll: true }); selected?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  if (action === 'refresh') {
    state.offset = (state.offset + 2) % catalog[state.store].length; state.selected = 0; state.thanks = false; state.cooling = true; render();
    notice('已经换好这一批商品。');
    setTimeout(() => { state.cooling = false; document.querySelector('.refresh').disabled = !getItems().length; }, state.store === 'goods' ? 3000 : 1000);
  }
  if (action === 'switch') { state.store = state.store === 'goods' ? 'costumes' : 'goods'; state.offset = 0; render(); }
  if (action === 'buy' && item && !itemStatus(item)) {
    state.coins -= item.price; state.bought[item.id] = (state.bought[item.id] || 0) + 1;
    if (!item.repeatable) state.owned.add(item.id);
    state.thanks = true; render();
    if (detail.open) { openDetail(item); detail.querySelector('[data-action="close-detail"]').focus(); }
    else document.querySelector(`[data-action="detail"][data-id="${item.id}"]`)?.focus({ preventScroll: true });
    notice(`已购买${item.name}`);
  }
});
detail.addEventListener('click', event => { if (event.target === detail) { const r = detail.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) detail.close(); } });
render();
