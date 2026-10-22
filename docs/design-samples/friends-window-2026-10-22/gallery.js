const frame = document.getElementById('preview');
const notes = {
  roster: '把头像、名字与状态合成一组；常用操作直接可见，名单更容易扫读。',
  cards: '角色形象与名字组成独立名片；桌面双列、手机单列，游戏感更强。',
  companion: '左侧选择好友，右侧集中查看与操作；手机改为上方名单、下方固定操作区。',
  current: '直接渲染当前 FriendsToolbar、FriendsList 与窗口标题组件，示例数据与三版相同。'
};
let variant = 'roster';
function selectVariant(value) {
  variant = value;
  frame.src = `./preview.html?variant=${value}`;
  document.getElementById('direction-note').textContent = notes[value];
  document.querySelectorAll('[data-variant]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.variant === value)));
}
document.querySelectorAll('[data-variant]').forEach(button => button.addEventListener('click', () => selectVariant(button.dataset.variant)));
document.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => {
  frame.className = button.dataset.size === 'desktop' ? '' : `phone ${button.dataset.size === '320' ? 'narrow' : ''}`;
  document.querySelectorAll('[data-size]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
}));
document.getElementById('reset').addEventListener('click', () => selectVariant(variant));
window.addEventListener('keydown', event => {
  const names = { 0: 'current', 1: 'roster', 2: 'cards', 3: 'companion' };
  if (names[event.key]) selectVariant(names[event.key]);
});
