const directions = {
  archive: '01 / 借档案的秩序，留下校园的温度。左侧身份页，右侧完整战绩。',
  terminal: '02 / 段位与战绩先被看见。紧凑身份栏，明暗分区，角色卡片。',
  portrait: '03 / 先认识这个人，再读他的棋局。角色封面与轻盈的资料侧页。'
};
const query = new URLSearchParams(location.search);
let direction = Object.hasOwn(directions, query.get('v')) ? query.get('v') : 'archive';
let device = query.get('device') === 'phone' ? 'phone' : 'desktop';
function update() {
  document.querySelectorAll('[data-direction]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.direction === direction)));
  document.querySelectorAll('button[data-device]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.device === device)));
  document.querySelector('.preview').dataset.device = device;
  document.querySelector('#direction-note').textContent = directions[direction];
  const url = `./${direction}.html`;
  const frame = document.querySelector('iframe');
  if (!frame.src.endsWith(`/${direction}.html`)) frame.src = url;
  document.querySelector('#open-sample').href = url;
  history.replaceState(null, '', `?v=${direction}&device=${device}`);
}
document.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => { direction = button.dataset.direction; update(); }));
document.querySelectorAll('button[data-device]').forEach(button => button.addEventListener('click', () => { device = button.dataset.device; update(); }));
update();
