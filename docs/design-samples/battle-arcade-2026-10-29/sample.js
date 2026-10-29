const params = new URLSearchParams(location.search);
const variants = {
  round: { title: '01 / 圆帽街机', note: '大圆形技能键居中，两侧按重要度递减；最接近实体街机。', cost: '辨识度最高、街机感最直接。\n圆形占位较多；手机保留五键单排，技能名放在独立状态行。' },
  keys: { title: '02 / 阶梯键组', note: '宽技能键搭配高低键帽；桌面单排，手机收成紧凑的三列双层。', cost: '轮廓利落、文字空间充足。\n手机用双层键组，技能在左；更偏机械键盘式街机面板。' },
  pod: { title: '03 / 掌机控制舱 · 修订版', note: '角色技能名直接入键；右上 IRIS 次数窗口；有次数为彩虹，耗尽为灰色。', cost: '技能主键显示完整名称，右上角显示剩余次数。\n彩虹与灰色区分次数，回合限制单独控制能否点击。' }
};
let variant = Object.hasOwn(variants, params.get('variant')) ? params.get('variant') : 'pod';
let state = ['ready', 'waiting', 'spent', 'long'].includes(params.get('state')) ? params.get('state') : 'ready';
const icons = {
  pass: '<path d="M8 13V6a2 2 0 0 1 4 0v6M12 11V4a2 2 0 0 1 4 0v8M16 10V7a2 2 0 0 1 4 0v9c0 4-3 6-7 6-3 0-5-2-7-5l-3-5a2 2 0 0 1 3-2l2 3"/>',
  count: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 10h1m6 0h1M8 14h1m6 0h1M8 18h1m6 0h1"/>',
  skill: '<path d="m12 2 2.9 6.8L22 12l-7.1 3.2L12 22l-2.9-6.8L2 12l7.1-3.2Z"/><path d="m20 2 .8 2.2L23 5l-2.2.8L20 8l-.8-2.2L17 5l2.2-.8Z"/>',
  draw: '<path d="m2 8 5-4 5 2 5-2 5 4-4 10-4 2-4-1-5-5-3-6Z"/><path d="m12 6-4 4 3 2 4-3 6 5M10 15l4 4M7 17l3-3"/>',
  resign: '<path d="M5 22V3m0 1c5-5 9 5 15 0v11c-6 5-10-5-15 0"/>'
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;

if (!params.has('scene')) {
  const frames = [...document.querySelectorAll('iframe')];
  new ResizeObserver(entries => { document.querySelector('.desktop-column .frame-label span:last-child').textContent = `宽 ${Math.round(entries[0].contentRect.width)}px`; }).observe(frames[0]);
  const send = (type) => frames.forEach(frame => frame.contentWindow.postMessage({ type, variant, state }, location.origin));
  const update = () => {
    const info = variants[variant];
    document.querySelectorAll('[data-variant]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.variant === variant)));
    document.querySelector('#direction-note').textContent = info.note;
    document.querySelector('#tradeoff-title').textContent = info.title;
    document.querySelector('#tradeoff').innerText = info.cost;
    document.querySelector('#hierarchy-note').innerText = `${variant === 'pod' ? '技能：彩虹主键 / IRIS 次数窗口' : '技能：粉色主键 / 最大体量'}\n数目、认输：蓝与陶红 / 中体量\n弃手、和棋：奶白 / 小体量`;
    history.replaceState(null, '', `?variant=${variant}&state=${state}`);
    send('configure');
  };
  frames.forEach(frame => frame.addEventListener('load', () => send('configure')));
  document.querySelectorAll('[data-variant]').forEach(button => button.addEventListener('click', () => { variant = button.dataset.variant; update(); }));
  document.querySelector('#state').value = state;
  document.querySelector('#state').addEventListener('change', event => { state = event.target.value; update(); });
  document.querySelector('#reset').addEventListener('click', () => { state = 'ready'; document.querySelector('#state').value = state; update(); });
  document.querySelector('#phone-width').addEventListener('change', event => {
    document.querySelector('.phone-column').style.width = `${event.target.value}px`;
    document.querySelector('.phone-column').style.maxWidth = '100%';
  });
  update();
} else {
  document.body.innerHTML = `<main class="scene">
    <header class="battle-top"><strong>星炬对弈</strong><span>第 47 手</span></header>
    <div class="game-context"><div class="board" aria-label="静态棋盘示意"></div><div class="players">
      <div class="player mine"><img src="../../../public/assets/characters/handbook-chibi-sprites/sigrika-avatar.webp" alt="西格莉卡"><div><small><i class="stone-dot"></i>执黑 · 你的回合</small><strong>西格莉卡</strong><span class="clock">04:32</span></div></div>
      <div class="player"><img src="../../../public/assets/characters/handbook-chibi-sprites/denia-avatar.webp" alt="达妮娅"><div><small><i class="stone-dot white"></i>执白</small><strong>达妮娅</strong><span class="clock">05:18</span></div></div>
    </div></div>
    <div class="context-footer"><span class="turn">● 你的回合</span><span><span class="default-hint">选择交点落子</span><span class="selection-hint">再次点击技能可取消</span></span></div>
    <section class="controls-shell"><nav class="actions" aria-label="对弈操作"></nav><div class="skill-status"><i class="status-dot"></i><span></span></div></section>
    <p class="feedback" role="status" aria-live="polite">点击按钮体验按压与状态反馈 · 本地演示</p>
    <dialog aria-labelledby="confirm-title"><h2 id="confirm-title"></h2><p id="confirm-copy"></p><form method="dialog"><button value="cancel" autofocus>取消</button><button class="confirm" value="confirm">确认</button></form></dialog>
  </main>`;
  const board = document.querySelector('.board');
  let boardSvg = '<svg viewBox="0 0 280 280" role="img" aria-label="十三路棋盘示意"><g stroke="#876440" stroke-width=".9">';
  for (let i = 0; i < 13; i++) { const pos = 8 + i * 22; boardSvg += `<path d="M8 ${pos}H272M${pos} 8V272"/>`; }
  boardSvg += '</g><g fill="#775534">';
  for (const [x,y] of [[3,3],[9,3],[6,6],[3,9],[9,9]]) boardSvg += `<circle cx="${8+x*22}" cy="${8+y*22}" r="2.3"/>`;
  boardSvg += '</g>';
  const stones = [[3,3,0],[9,9,1],[9,3,0],[3,9,1],[4,3,1],[3,4,0],[4,4,1],[3,5,0],[5,3,0],[8,9,0],[8,8,1],[9,8,1],[7,9,0],[7,10,1],[6,9,0],[10,3,1],[10,4,0],[9,4,1],[8,4,0],[4,8,1],[4,9,0],[5,8,1],[8,3,0],[7,4,1],[6,5,0]];
  for (const [x,y,white] of stones) boardSvg += `<circle cx="${9+x*22}" cy="${10+y*22}" r="9.3" fill="#543e3329"/><circle cx="${8+x*22}" cy="${8+y*22}" r="9" fill="${white?'#fffdf6':'#393331'}" stroke="${white?'#a4947b':'#241f1e'}" stroke-width="1.1"/>`;
  board.innerHTML = `${boardSvg}<circle cx="140" cy="118" r="3" fill="#ff9ebb"/></svg>`;
  const actions = document.querySelector('.actions');
  const shell = document.querySelector('.controls-shell');
  const feedback = document.querySelector('.feedback');
  const dialog = document.querySelector('dialog');
  let pending = false;
  let dialogAction = '';
  let opener;
  let pressedButton;
  let pressTimer;
  const skillName = () => state === 'long' ? '星落之时·日灵的最后回响' : '星落日灵';
  function clearPress() {
    clearTimeout(pressTimer);
    pressedButton?.classList.remove('is-pressed');
    pressedButton = null;
  }
  function beginPress(button) {
    if (!button || button.disabled) return;
    clearPress();
    pressedButton = button;
    button.classList.add('is-pressed');
  }
  function releasePress() {
    clearTimeout(pressTimer);
    pressTimer = setTimeout(clearPress, 130);
  }
  actions.addEventListener('pointerdown', event => beginPress(event.target.closest('button')));
  document.addEventListener('pointerup', releasePress);
  document.addEventListener('pointercancel', clearPress);
  window.addEventListener('blur', clearPress);
  actions.addEventListener('keydown', event => {
    if (['Enter', ' '].includes(event.key) && !event.repeat) beginPress(event.target.closest('button'));
  });
  actions.addEventListener('keyup', event => {
    if (['Enter', ' '].includes(event.key)) releasePress();
  });
  function updateSkillStatus() {
    document.querySelector('.scene').classList.toggle('is-selecting', pending);
    document.querySelector('.skill').setAttribute('aria-pressed', String(pending));
    const name = skillName();
    document.querySelector('.skill-status span').textContent = `${name} · ${state === 'spent' ? '次数耗尽' : state === 'waiting' ? '对手回合' : pending ? '已选中 · 再次点击取消' : '剩余 2 次'}`;
  }
  function render() {
    clearPress();
    pending = false;
    if (dialog.open) dialog.close('cancel');
    shell.className = `controls-shell ${variant}`;
    actions.innerHTML = [['pass','弃手','minor'],['count','数目',''],['skill','技能',''],['draw','和棋','minor'],['resign','认输','']].map(([id,label,extra]) => `<button class="action ${id} ${extra}" data-action="${id}" ${id==='skill'?'aria-pressed="false"':''} ${(id==='skill' && ['waiting','spent'].includes(state)) ? 'disabled' : ''} aria-label="${id==='skill' ? '技能，'+(state==='spent'?'次数耗尽':state==='waiting'?'对手回合不可用':'剩余 2 次') : label}"><span class="key-face">${icon(id)}<span class="key-title">${label}</span>${id==='skill'?`<span class="use-count" aria-hidden="true">${state==='spent'?'0':'2'}</span>`:''}</span></button>`).join('');
    const skillButton = actions.querySelector('.skill');
    skillButton.dataset.uses = state === 'spent' ? '0' : '2';
    if (variant === 'pod') {
      skillButton.classList.toggle('long-name', state === 'long');
      skillButton.querySelector('.key-title').textContent = skillName();
      skillButton.querySelector('.use-count').textContent = state === 'spent' ? '00' : '02';
      skillButton.setAttribute('aria-label', `${skillName()}，剩余 ${skillButton.dataset.uses} 次${state === 'waiting' ? '，对手回合不可用' : ''}`);
    }
    document.querySelector('.turn').textContent = state === 'waiting' ? '○ 对手回合' : '● 你的回合';
    document.querySelector('.player.mine small').innerHTML = `<i class="stone-dot"></i>执黑${state === 'waiting' ? '' : ' · 你的回合'}`;
    document.querySelector('.player.mine').classList.toggle('active', state !== 'waiting');
    feedback.textContent = '点击按钮体验按压与状态反馈 · 本地演示';
    updateSkillStatus();
  }
  actions.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'skill') {
      pending = !pending;
      updateSkillStatus();
      feedback.textContent = pending ? '技能已选中。再次点击技能，取消选择。' : '已取消技能，继续落子。';
    } else if (['pass','resign'].includes(action)) {
      opener = button;
      dialogAction = action;
      document.querySelector('#confirm-title').textContent = action === 'resign' ? '确认认输？' : '确认弃手？';
      document.querySelector('#confirm-copy').textContent = action === 'resign' ? '认输将结束本局。本页仅演示确认反馈，不影响真实对局。' : '弃手将跳过本次落子。本页仅演示操作反馈。';
      dialog.querySelector('.confirm').textContent = action === 'resign' ? '确认认输' : '确认弃手';
      dialog.showModal();
    } else feedback.textContent = action === 'count' ? '已发送数目申请，等待对方确认。（演示）' : '已发送和棋申请，等待对方确认。（演示）';
  });
  dialog.addEventListener('close', () => {
    feedback.textContent = dialog.returnValue === 'confirm' ? (dialogAction === 'resign' ? '已认输 · 演示结束，可继续体验其它按键。' : '已弃手 · 演示反馈，可继续体验其它按键。') : '已取消，继续对局。';
    if (opener?.isConnected) opener.focus();
  });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'configure') return;
    if (Object.hasOwn(variants,event.data.variant)) variant = event.data.variant;
    if (['ready','waiting','spent','long'].includes(event.data.state)) state = event.data.state;
    render();
  });
  render();
}
