const descriptions = {
  spread: '角色展示台：大立绘、角色专色与圆形展示台，搭配厚阴影技能卡和倾斜对白纸。',
  banner: '战术卡册：深墨角色卡搭配专色环纹，姓名、立绘与音乐集中展示，右侧突出技能。',
  reading: '漫画分镜：网点、爆发纹和大字构图，用漫画分镜与对白框突出角色表现。',
  current: '现有效果：当前正式组件与完整主题，使用同一组公开角色数据，便于直接比较。'
};
let view = 'spread';
const frame = document.getElementById('preview');
const character = document.getElementById('character');
function refresh() {
  const url = `./preview.html?view=${view}&character=${character.value}`;
  frame.src = url;
  document.getElementById('direct').href = url;
  document.getElementById('summary').textContent = descriptions[view];
}
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  view = button.dataset.view;
  document.querySelectorAll('[data-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  refresh();
}));
character.addEventListener('change', refresh);
document.getElementById('reset').addEventListener('click', refresh);
for (const id of ['desktop', 'mobile']) document.getElementById(id).addEventListener('click', () => {
  frame.classList.toggle('phone', id === 'mobile');
  document.getElementById('desktop').setAttribute('aria-pressed', String(id === 'desktop'));
  document.getElementById('mobile').setAttribute('aria-pressed', String(id === 'mobile'));
});
