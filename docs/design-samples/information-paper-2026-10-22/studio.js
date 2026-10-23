const frame = document.querySelector('iframe');
const space = document.querySelector('.frame-space');
const stage = document.querySelector('.preview-stage');
const link = document.querySelector('#standalone');
const params = new URLSearchParams(location.search);
const state = { window: params.get('window') === 'mailbox' ? 'mailbox' : 'announcement', view: 'production', size: innerWidth < 700 ? 'mobile' : 'desktop', fixture: 'normal' };
const sizes = { desktop: [1120, 800], mobile: [390, 844], narrow: [320, 568] };
function resize() {
  const [width, height] = sizes[state.size];
  const padding = parseFloat(getComputedStyle(stage).paddingLeft) * 2;
  const scale = Math.min(1, (stage.clientWidth - padding) / width);
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  frame.style.transform = `scale(${scale})`;
  space.style.width = `${width * scale}px`;
  space.style.height = `${height * scale}px`;
}
function update() {
  const search = new URLSearchParams({ window: state.window, view: state.view, fixture: state.fixture });
  frame.src = `./${state.view === 'production' ? 'production' : 'preview'}.html?${search}`;
  frame.title = `${state.window === 'mailbox' ? '邮箱' : '公告'}纸卡交互样板`;
  link.href = frame.src;
  for (const key of ['window', 'view', 'size']) document.querySelectorAll(`[data-${key}]`).forEach(button => button.setAttribute('aria-pressed', String(button.dataset[key] === state[key])));
  resize();
}
for (const key of ['window', 'view', 'size']) document.querySelectorAll(`[data-${key}]`).forEach(button => button.addEventListener('click', () => { state[key] = button.dataset[key]; update(); }));
document.querySelector('#fixture').addEventListener('change', event => { state.fixture = event.target.value; update(); });
document.querySelector('#replay').addEventListener('click', () => frame.contentWindow.location.reload());
new ResizeObserver(resize).observe(stage);
update();
