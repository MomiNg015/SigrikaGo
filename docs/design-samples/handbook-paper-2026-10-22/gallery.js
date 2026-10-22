const descriptions = {
  spread: '并页手册：立绘与说明各占一页，保留熟悉的左右结构，阅读区去掉嵌套框。',
  banner: '横幅档案：人物、姓名和音乐收进上方横幅，下方用完整宽度阅读技能。',
  reading: '连续阅读页：缩小立绘，让技能与人物介绍沿一张纸连续阅读，整页自然滚动。',
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
