let selected = 'velvet';
let original = false;
const frame = document.querySelector('#preview');
const notes = {
  velvet: '扎希拉保留紫绒金签，棋子直接展示；点击店内路牌，查看残星会独立的赤黑银舞台风格。',
  ticket: '用盖印、货签和纸张叠层统一三个部位，保留原本轻松的手绘味道。',
  enamel: '用紫色珐琅边框与柔和拼色增加游戏道具感，对白改成与店招呼应的绒色。'
};
function update() {
  const skin = original ? 'original' : selected;
  frame.contentWindow.postMessage({ type: 'shop-material-skin', skin }, location.origin);
  document.querySelector('#original').setAttribute('aria-pressed', String(original));
  document.querySelector('#original').textContent = original ? '返回样板' : '查看正式版';
  document.querySelector('#standalone').href = `./preview.html?skin=${skin}&state=${document.querySelector('#state').value}`;
  document.querySelector('#direction-note').textContent = original ? 'A 已接入正式商店并去掉卡片纹理。当前显示正式样式；B／C 仅保留作历史样板。' : notes[selected];
}
document.querySelectorAll('[data-skin]').forEach(button => button.addEventListener('click', () => {
  selected = button.dataset.skin; original = false;
  document.querySelectorAll('[data-skin]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  update();
}));
document.querySelector('#original').addEventListener('click', () => { original = !original; update(); });
document.querySelectorAll('[data-width]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-width]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  frame.className = button.dataset.width === 'desktop' ? '' : `phone ${button.dataset.width === '320' ? 'narrow' : ''}`;
}));
function reset() { frame.src = `./preview.html?skin=${original ? 'original' : selected}&state=${document.querySelector('#state').value}`; update(); }
document.querySelector('#state').addEventListener('change', reset);
document.querySelector('#reset').addEventListener('click', reset);
frame.addEventListener('load', update);
