let variant = 'a';
const frame = document.querySelector('#preview');
const notes = {
  a: '推荐从这一版开始：稳定的商品尺寸、整齐的价格与购买区，店主仍然陪伴在旁。',
  b: '选中清单就能看大图和说明；桌面左右联动，手机将预览固定在上方，减少反复开关详情。',
  c: '把逛店变成逐件挑选：商品与店主共享舞台，底部切换货品。氛围最强，同时比较的效率较低。'
};
function load() { frame.src = `./preview.html?variant=${variant}&scenario=${document.querySelector('#scenario').value}`; }
document.querySelectorAll('[data-variant]').forEach(button => button.addEventListener('click', () => {
  variant = button.dataset.variant;
  document.querySelectorAll('[data-variant]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelector('#direction-note').textContent = notes[variant];
  load();
}));
document.querySelectorAll('[data-width]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-width]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  frame.className = button.dataset.width === 'desktop' ? '' : `phone ${button.dataset.width === '320' ? 'narrow' : ''}`;
}));
document.querySelector('#scenario').addEventListener('change', load);
document.querySelector('#reset').addEventListener('click', load);
