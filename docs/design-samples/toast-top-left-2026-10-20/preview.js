/* Local sample state only. Production toast scheduling and APIs are untouched. */
const $ = (selector) => document.querySelector(selector);
const stage = $('#stage');
const stack = $('#toast-stack');
const hold = $('#hold');
const reduced = $('#reduce-motion');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
reduced.checked = motionPreference.matches;
const icons = {
  success: '<path d="m5 12 4 4L19 6"/>',
  warning: '<path d="M12 8v5m0 3h.01M10.3 4.5 2.5 18a1 1 0 0 0 .9 1.5h17.2a1 1 0 0 0 .9-1.5L13.7 4.5a2 2 0 0 0-3.4 0Z"/>',
  danger: '<path d="m8 8 8 8m0-8-8 8"/><circle cx="12" cy="12" r="9"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  achievement: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>'
};
const svg = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const messages = {
  success: { tone: 'success', title: '保存成功', text: '设置已保存，可以继续对弈啦。' },
  warning: { tone: 'warning', title: '稍等一下', text: '连接尚未就绪，请稍后重试。' },
  danger: { tone: 'danger', title: '未能加入', text: '房间已满，换个房间试试吧。' },
  info: { tone: 'info', title: '对局提醒', text: '长离 · 谋定后动：第 1 / 2 手。' },
  mail: { tone: 'mail', title: '收到来信', text: '有一封新邮件，记得去看看。' },
  achievement: { tone: 'achievement', title: '成就达成', text: '第一场胜利，值得好好纪念。' },
  long: { tone: 'warning', title: '连接暂时中断', text: '本机陪练引擎加载失败，请检查网络后重试，或使用新版浏览器。' }
};
const directions = {
  drawer: ['01 / EVERYDAY', '轻一点，就很舒服。', '暖白纸条、细描边、小状态章。把注意力留给消息，适合保存、复制等高频反馈。', '最省空间，也最不打扰对局。'],
  memo: ['02 / CLUB NOTES', '像收到一张社团便签。', '纸胶带、淡淡横线与小印章，让系统提示也带一点文具的温度。适合来信、奖励与活动提醒。', '校园味最浓；比抽屉条多占一些高度。'],
  character: ['03 / A LITTLE COMPANY', '这次，由角色来告诉你。', '熟悉的西格莉卡探出头，递来一张小纸条。图像与文字分层，保留轻量的陪伴感。', '辨识度最高；频繁报错时会更抢注意力。']
};
let variant = 'drawer';
let selectedMessage = 'success';
const live = new Map();
const status = (text) => { $('#motion-status').textContent = text; };
const paused = (node) => hold.checked || node.matches(':hover') || node.contains(document.activeElement);

function syncTimer(node) {
  const entry = live.get(node);
  if (!entry || entry.exiting) return;
  clearTimeout(entry.timer);
  if (paused(node)) {
    entry.progress.pause();
    status(hold.checked ? '停留展示' : '阅读中 · 计时暂停');
  } else {
    entry.progress.play();
    entry.timer = setTimeout(() => dismiss(node), Math.max(0, entry.duration - Number(entry.progress.currentTime || 0)));
    status('停留片刻后，向左收回');
  }
}

function clearNotices() {
  for (const [node, entry] of live) {
    clearTimeout(entry.timer);
    entry.progress.cancel();
    entry.entrance.cancel();
    node.remove();
  }
  live.clear();
}

async function dismiss(node) {
  const entry = live.get(node);
  if (!entry || entry.exiting) return;
  entry.exiting = true;
  clearTimeout(entry.timer);
  entry.progress.pause();
  entry.entrance.cancel();
  const motion = reduced.checked ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(calc(-100% - 36px))' }];
  const exit = node.animate(motion, { duration: reduced.checked ? 100 : 220, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
  await exit.finished.catch(() => {});
  entry.progress.cancel();
  node.remove();
  live.delete(node);
  if (!stack.children.length) { $('#empty-hint').hidden = false; status('已原路收回'); }
}

function showMessage(key = selectedMessage) {
  $('#empty-hint').hidden = true;
  const message = messages[key];
  const node = document.createElement('article');
  node.className = `notice ${variant}`;
  node.dataset.tone = message.tone;
  const symbol = `<span class="notice-symbol">${svg(message.tone)}</span>`;
  const copy = `<div class="notice-copy"><strong class="notice-title">${variant === 'character' ? symbol : ''}${message.title}</strong><p class="notice-message">${message.text}</p></div>`;
  const close = '<button class="notice-close" type="button" aria-label="关闭这条消息"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="m3 3 6 6m0-6-6 6"/></svg></button>';
  const progress = '<div class="life-track" aria-hidden="true"><div class="life-fill"></div></div>';
  if (variant === 'drawer') node.innerHTML = symbol + copy + close + progress;
  if (variant === 'memo') node.innerHTML = '<div class="memo-heading"><span>星炬 · 社团便签</span></div>' + copy + symbol + close + progress;
  if (variant === 'character') {
    node.innerHTML = '<span class="portrait-fallback" hidden aria-hidden="true">西</span><img class="portrait" src="/assets/characters/handbook-chibi-sprites/sigrika-avatar.webp" alt=""><div class="bubble"><span class="sender">西格莉卡 · 社团传讯</span>' + copy + close + progress + '</div>';
    node.querySelector('img').addEventListener('error', (event) => { event.target.hidden = true; node.querySelector('.portrait-fallback').hidden = false; });
  }
  stack.append(node);
  while (live.size >= 3) {
    const [oldNode, oldEntry] = live.entries().next().value;
    clearTimeout(oldEntry.timer); oldEntry.progress.cancel(); oldEntry.entrance.cancel(); oldNode.remove(); live.delete(oldNode);
  }
  const duration = key === 'long' ? 6400 : 3800;
  const progressAnimation = node.querySelector('.life-fill').animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration, easing: 'linear', fill: 'forwards' });
  progressAnimation.pause();
  const motion = reduced.checked ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: 'translateX(calc(-100% - 36px))', opacity: .25 }, { transform: 'translateX(0)', opacity: 1 }];
  const entrance = node.animate(motion, { duration: reduced.checked ? 100 : 280, easing: 'cubic-bezier(.16,1,.3,1)' });
  live.set(node, { duration, progress: progressAnimation, entrance, timer: null, exiting: false });
  node.querySelector('.notice-close').addEventListener('click', () => dismiss(node));
  node.addEventListener('pointerenter', () => syncTimer(node));
  node.addEventListener('pointerleave', () => syncTimer(node));
  node.addEventListener('focusin', () => syncTimer(node));
  node.addEventListener('focusout', () => queueMicrotask(() => syncTimer(node)));
  entrance.finished.then(() => syncTimer(node)).catch(() => {});
  status(hold.checked ? '停留展示' : '从左上推进');
}

function replay() { clearNotices(); hold.checked = false; showMessage(); }
function selectVariant(next) {
  variant = next;
  stage.dataset.variant = next;
  const text = directions[next];
  ['#direction-tag', '#direction-title', '#direction-description', '#direction-tradeoff'].forEach((selector, index) => { $(selector).textContent = text[index]; });
  document.querySelectorAll('[data-variant]').forEach((button) => { if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.variant === next)); });
  hold.checked = true;
  clearNotices(); showMessage();
}
document.querySelectorAll('button[data-variant]').forEach((button) => button.addEventListener('click', () => selectVariant(button.dataset.variant)));
document.querySelectorAll('[data-message]').forEach((button) => button.addEventListener('click', () => {
  selectedMessage = button.dataset.message;
  document.querySelectorAll('[data-message]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  clearNotices(); showMessage();
}));
document.querySelectorAll('[data-size]').forEach((button) => button.addEventListener('click', () => {
  stage.dataset.size = button.dataset.size;
  document.querySelectorAll('button[data-size]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
}));
hold.addEventListener('change', () => { for (const node of live.keys()) syncTimer(node); });
reduced.addEventListener('change', () => { clearNotices(); showMessage(); });
motionPreference.addEventListener('change', (event) => { reduced.checked = event.matches; clearNotices(); showMessage(); });
$('#replay').addEventListener('click', replay);
$('#dismiss').addEventListener('click', () => { for (const node of live.keys()) dismiss(node); });
$('#burst').addEventListener('click', () => { clearNotices(); ['success', 'mail', 'warning'].forEach(showMessage); });
$('.wordmark').addEventListener('click', (event) => { event.preventDefault(); clearNotices(); showMessage(); });
document.addEventListener('keydown', (event) => {
  if (event.target.closest('button,input,a,textarea,select')) return;
  if (['1', '2', '3'].includes(event.key)) selectVariant(['drawer', 'memo', 'character'][Number(event.key) - 1]);
  if (event.code === 'Space') { event.preventDefault(); replay(); }
});
const requestedVariant = new URLSearchParams(window.location.search).get('variant');
if (Object.hasOwn(directions, requestedVariant)) selectVariant(requestedVariant);
else showMessage();
