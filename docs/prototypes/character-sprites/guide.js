(() => {
  'use strict';
  const data = window.GuideSampleData;
  const catalog = window.SpriteCatalog;
  const nodes = new Map(data.nodes.map(node => [node.id, node]));
  const frame = document.querySelector('#guide-frame');
  const scenarios = [
    { id: 'node-1', label: '相遇与招呼', note: '沿用原样板的教室场景。人物站在场景里，对话纸张压在身前；头部、肩部保持清楚。' },
    { id: 'node-3', label: '三项剧情分支', note: '原来的三个回答完整保留。选项区与正文滚动区分开，长选项不会压住人物名字。' },
    { id: 'node-4-1', label: '长规则对白', note: '人物缩放、站位与裁切沿用相遇和分支。纸面高度固定，长文只在正文区滚动，按钮位置不变。' },
    { id: 'node-4-2', label: '达妮娅接话', note: '更换角色时沿用同一个人物站位；每段仍使用已经按原文配置的表情。' },
    { id: 'doc-liberty-left-top', board: 'doc-setup-1', label: '棋盘讲解', note: '人物与对白作为浮层覆盖在对弈界面上，头肩越过框顶。框加高，底边不变；手机棋盘不再为对白腾出一段嵌入空间。' },
    { id: 'doc-liberty-question-1', board: 'doc-setup-1', label: '棋盘问答', note: '实际的 7 / 9 / 14 三个回答。答错可看到达妮娅反馈，再回到原问题。棋盘不接受普通落子。' },
    { id: 'doc-liberty-wrong-1', board: 'doc-setup-1', label: '答错与表情反馈', note: '达妮娅的提醒保留原文。在样板设置里可开启原节点自动推进，也可以暂停观察表情。' },
    { id: 'story-18', board: 'story-16', preceding: 'story-17', label: '指定位置落子', note: '对白退场后给棋盘让出空间。仅目标点能推进；错误点击保留当前教学状态。这里仅演示目标点击，不执行真实围棋规则。' },
    { id: 'doc-ko-user', board: 'doc-setup-2', label: '无立绘的选项', note: '现有引导没有纯旁白节点。这里展示实际 player-choice：不杜撰旁白，也不让上一名角色继续冒充说话人。' },
    { id: 'doc-skill-174', board: 'doc-skill-setup', label: '技能前后对白', note: '使用技能教学的原话与节点：先点技能，再选 F-5。技能横幅展示角色与技能名；棋盘反色是本地演示，实际特效和规则仍以正式系统为准。' },
    { id: 'home:handbook', label: '首页入口指引', note: '入口和对弈共用同一人物与对白浮层。高亮入口避开整个人物突出区；点击部员手册查看原有说明。' }
  ];
  const mobileSize = () => innerWidth <= 560 ? (innerHeight <= 700 ? 'small' : 'phone') : 'desktop';
  const state = { id: nodes.has(location.hash.slice(1)) ? location.hash.slice(1) : 'doc-liberty-question-1', size: mobileSize(), board: [], npc: 'sigrika', typing: true, auto: false, selected: null, scenario: null, skill: null, skillArmed: false };
  let timers = [];
  let generation = 0;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, symbol => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[symbol]));
  const current = () => state.id.startsWith('home:') ? data.home.find(step => `home:${step.id}` === state.id) : nodes.get(state.id);
  const portrait = (id, expression) => `./assets/${id}/${catalog[id]?.expressions?.[expression] ? expression : 'smile'}.png`;
  const sprite = (id, expression, className) => `<div class="${className} character-${escape(id)}" aria-label="${escape(catalog[id]?.name)} · ${escape(catalog[id]?.expressions?.[expression])}" role="img"><img src="${portrait(id, expression)}" alt="" draggable="false"></div>`;
  const clearTimers = () => { generation += 1; timers.forEach(clearTimeout); timers = []; document.querySelector('#guide-toast').hidden = true; };
  const later = (callback, delay) => { const version = generation; timers.push(setTimeout(() => { if (version === generation) callback(); }, delay)); };
  function toast(text) {
    const element = document.querySelector('#guide-toast');
    element.textContent = text;
    element.hidden = false;
    later(() => { element.hidden = true; }, 2200);
  }
  function setBoard(id) {
    const node = nodes.get(id);
    const setup = node?.boardSetup;
    if (!setup) throw new Error(`Missing board setup: ${id}`);
    state.player = node.playerCharacterId || '';
    state.playerColor = node.playerColor || 'black';
    state.opponent = node.npcCharacterId || 'sigrika';
    state.invalid = [];
    state.lastMove = setup.lastMovePointId;
    state.board = (setup?.stones || []).map(stone => { const [x, y] = stone.pointId.split(',').map(Number); return { x, y, color: stone.color }; });
  }
  function applySnapshot(id) {
    const snapshot = data.boardSnapshots[id];
    if (!snapshot) return;
    state.board = snapshot.stones.map(stone => { const [x, y] = stone.pointId.split(',').map(Number); return { x, y, color: stone.color }; });
    state.invalid = snapshot.invalidPoints;
    state.lastMove = snapshot.lastMovePointId;
  }
  function addStone(node) {
    if (!node.pointId) return;
    const [x, y] = node.pointId.split(',').map(Number);
    if (!state.board.some(stone => stone.x === x && stone.y === y)) state.board.push({ x, y, color: node.color || 'black' });
    state.lastMove = node.pointId;
  }
  function selectScenario(id) {
    clearTimers();
    state.scenario = scenarios.find(scenario => scenario.id === id) || scenarios[4];
    state.selected = null;
    state.skill = null;
    state.skillArmed = false;
    if (state.scenario.board) setBoard(state.scenario.board);
    else if (!state.board.length) setBoard('doc-setup-1');
    if (state.scenario.preceding) addStone(nodes.get(state.scenario.preceding));
    applySnapshot(id);
    state.id = id;
    state.npc = current()?.characterId || 'sigrika';
    render();
  }
  function advance(id) {
    clearTimers();
    state.selected = null;
    state.skill = null;
    state.skillArmed = false;
    if (state.id.startsWith('home:')) {
      const index = data.home.findIndex(step => `home:${step.id}` === state.id);
      if (index >= 2) { selectScenario('home:handbook'); toast('入口与说明演示结束，已回到入口。'); return; }
      state.id = `home:${data.home[index + 1]?.id || 'hello'}`;
      if (state.id === 'home:sigrika') { selectScenario('home:handbook'); toast('入口与说明演示结束，已回到入口。'); return; }
      render();
      return;
    }
    const visited = new Set();
    while (nodes.has(id) && !visited.has(id)) {
      visited.add(id);
      const node = nodes.get(id);
      applySnapshot(id);
      if (node.type === 'board-setup') { setBoard(id); state.npc = node.npcCharacterId || 'sigrika'; }
      else if (node.type === 'npc-move') addStone(node);
      else if (node.type === 'npc-skill') {
        state.skill = node;
        state.id = id;
        render();
        return;
      }
      if (node.text || node.options?.length || ['player-move', 'player-skill', 'resign'].includes(node.type)) { state.id = id; render(); return; }
      id = node.nextNodeId;
    }
    toast('这一段演示已结束，可在右侧重看其它情境。');
  }
  function options(node) {
    if (node.action) return '<span class="guide-target-instruction">点击高亮的部员手册</span>';
    if (node.options?.length) return node.options.map((option, index) => `<button class="guide-answer" data-action="answer" data-index="${index}" disabled>${escape(option.label)}</button>`).join('');
    if (node.type === 'player-move') return '<button data-action="hint">显示目标</button>';
    if (node.type === 'player-skill') return '<button data-action="skill">发动技能</button>';
    return `<button class="guide-continue" data-action="continue" disabled>${node.type === 'resign' ? '认输' : state.skill ? '继续' : '继续 →'}</button>`;
  }
  function conversation(node, stage = false) {
    const pureChoice = node.type === 'player-choice';
    const id = pureChoice ? '' : node.characterId || (node.type === 'npc-dialogue' ? state.npc : '');
    const expression = node.expressionId || 'smile';
    if (id) state.npc = id;
    const text = node.text || node.prompt || '';
    return `<div class="guide-conversation ${stage ? 'on-stage' : 'npc-overlay'}${id ? '' : ' without-art'}">
      ${id ? sprite(id, expression, 'guide-floating-sprite') : ''}
      <section class="guide-chat" aria-label="${pureChoice ? '选择回答' : '角色对白'}">
        <div class="guide-chat-copy"><h2 class="guide-speaker">${escape(pureChoice ? '你的回答' : node.speakerName || catalog[id]?.name || '旁白')}</h2>
          ${text ? `<div class="guide-text-scroll" tabindex="0" data-action="reveal" aria-label="对白内容"><p id="guide-dialogue-text" data-full-text="${escape(text.replaceAll('{username}', '小星'))}"></p></div>` : ''}
        </div>
        <div class="guide-answers ${node.options?.some(option => option.label.length > 12) ? 'long-answers' : ''}" aria-label="对白操作">${options(node)}</div>
      </section>
      ${stage ? '' : `<button class="guide-peek" data-action="peek" aria-expanded="true" aria-label="暂收引导，查看${state.id.startsWith('home:') ? '界面' : '棋盘'}">查看${state.id.startsWith('home:') ? '界面' : '棋盘'}</button>`}
    </div>`;
  }
  function players() {
    const own = state.playerColor === 'white' ? 'white' : 'black';
    const opposite = own === 'white' ? 'black' : 'white';
    return `<div class="guide-player-strip"><div><span class="guide-stone ${own}"></span><strong>${escape(catalog[state.player]?.name || '小星')}</strong><span>${own === 'black' ? '黑棋' : '白棋'}</span></div><div><span class="guide-stone ${opposite}"></span><strong>${escape(catalog[state.opponent]?.name || '西格莉卡')}</strong><span>${opposite === 'black' ? '黑棋' : '白棋'}</span></div></div>`;
  }
  function boardScene(node) {
    const active = ['player-move', 'player-skill', 'resign'].includes(node.type);
    const actionText = node.prompt || node.text || (node.type === 'player-move' ? '请在棋盘上落子' : node.type === 'player-skill' ? '请发动技能' : '认输');
    return `<div class="guide-board-layout ${active ? 'action-layout' : ''}">${players()}<div class="guide-board-zone ${active ? 'accepts-action' : ''}">
      ${window.SpriteScenes.renderGuideBoard({ moves: state.board, turn: node.color || 'black', lastMovePointId: state.lastMove, invalidPoints: state.invalid })}
      <div class="guide-board-info"><span>13 路 · 星炬围棋</span><span>${active ? '等待你的操作' : '教学讲解中'}</span></div>
    </div>
      ${active ? `<div class="guide-action-prompt"><span>${escape(actionText)}</span>${options(node)}</div>` : conversation(node)}
      <nav class="guide-game-actions" aria-label="对局操作"><button disabled>弃手</button><button disabled>数子</button><button data-action="skill" ${node.type === 'player-skill' ? '' : 'disabled'}>技能</button><button disabled>和棋</button><button ${node.type === 'resign' ? 'data-action="continue"' : 'disabled'}>认输</button></nav>
    </div>`;
  }
  function homeScene(node) {
    return `<div class="guide-home-scene"><div class="guide-home-title">围棋部</div><div class="guide-home-entries"><button data-action="home-target" class="guide-home-target">部员手册</button><button disabled>开始对弈</button><button disabled>学生证</button></div>
      ${node.window === 'house' ? '<div class="guide-home-sheet"><h2>部员手册</h2><div class="guide-home-members">西格莉卡　达妮娅</div></div>' : ''}
      ${conversation({ ...node, type: 'npc-dialogue' })}
    </div>`;
  }
  function render() {
    clearTimers();
    const node = current();
    if (!node) return;
    const isHome = state.id.startsWith('home:');
    const stage = !isHome && node.type === 'story';
    frame.className = `guide-frame scene-battle size-${state.size} ${stage ? 'stage-mode' : isHome ? 'home-mode' : 'board-mode'}`;
    frame.innerHTML = `<header class="guide-game-header"><span>${stage ? '星炬学院 · 围棋部' : isHome ? '部员首页' : '新生对弈指导'}</span><button data-action="exit" aria-label="退出剧情引导">×</button></header>${stage ? `<div class="guide-stage-scene">${conversation(node, true)}</div>` : isHome ? homeScene(node) : boardScene(node)}<div id="guide-confirm" class="guide-confirm" hidden><section role="dialog" aria-modal="true" aria-label="结束剧情教学？"><h2>结束剧情教学？</h2><p>退出/跳过会结束整个剧情教学。</p><div><button data-action="cancel-exit">取消</button><button data-action="confirm-exit">结束教学</button></div></section></div>`;
    document.querySelector('#guide-node-id').textContent = node.id;
    const role = node.characterId || '';
    document.querySelector('#guide-expression').textContent = role ? `${catalog[role]?.name || role} · ${catalog[role]?.expressions?.[node.expressionId] || '默认表情'}` : '无角色立绘';
    document.querySelector('#guide-design-note').textContent = state.scenario?.note || '';
    document.querySelector('#guide-scenarios').innerHTML = scenarios.map(scenario => `<button data-action="scenario" data-value="${scenario.id}" aria-pressed="${scenario.id === state.scenario?.id}">${scenario.label}</button>`).join('');
    const quickSelect = document.querySelector('#guide-quick-select');
    if (!quickSelect.options.length) quickSelect.innerHTML = scenarios.map(scenario => `<option value="${scenario.id}">${scenario.label}</option>`).join('');
    quickSelect.value = state.scenario?.id || '';
    document.querySelectorAll('[data-action="size"]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.value === state.size)));
    history.replaceState(null, '', `#${state.id}`);
    const point = node.type === 'player-move' && node.targetHighlightEnabled !== false ? node.pointId : null;
    if (point) frame.querySelector(`[data-x="${point.split(',')[0]}"][data-y="${point.split(',')[1]}"]`)?.classList.add('guide-target-point');
    frame.querySelectorAll('.battle-intersection').forEach(button => {
      if (node.type === 'player-skill' && state.skillArmed) button.disabled = state.invalid?.includes(`${button.dataset.x},${button.dataset.y}`) || false;
      else if (node.type !== 'player-move') button.disabled = true;
    });
    if (node.type === 'player-skill' && state.skillArmed) frame.querySelector(`[data-x="${node.pointId.split(',')[0]}"][data-y="${node.pointId.split(',')[1]}"]`)?.classList.add('guide-target-point');
    if (state.skill) {
      const id = state.skill.skillCharacterId || state.skill.characterId || state.npc;
      frame.insertAdjacentHTML('beforeend', `<div class="guide-skill-banner">${sprite(id, 'serious', 'guide-skill-art')}<div><span>${escape(catalog[id]?.name)}</span><strong>${escape(catalog[id]?.skill?.name || '共鸣技能')}</strong></div></div>`);
    }
    revealText(node);
    if (node.options?.length) frame.querySelectorAll('.guide-answer').forEach((button, index) => {
      const delay = node.options[index].revealDelaySeconds;
      if (delay !== '' && delay != null) later(() => { button.disabled = false; }, Number(delay) * 1000);
    });
  }
  function revealText(node) {
    const element = document.querySelector('#guide-dialogue-text');
    const text = element?.dataset.fullText || '';
    const type = state.typing && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const complete = () => {
      if (element) element.textContent = text;
      const buttons = frame.querySelectorAll('.guide-answers button');
      if (node.options?.length) buttons.forEach((button, index) => { const delay = node.options[index].revealDelaySeconds; if (delay === '' || delay == null) button.disabled = false; });
      else buttons.forEach(button => { button.disabled = state.auto && node.manualContinueEnabled === false; });
      const canAutoAdvance = ['story', 'npc-dialogue', 'npc-move', 'npc-skill'].includes(node.type);
      if (state.auto && canAutoAdvance && node.autoContinueEnabled && !node.options?.length) later(() => advance(node.nextNodeId), Number(node.autoContinueDelaySeconds || 0) * 1000);
    };
    if (!type || !text) { complete(); return; }
    let length = 0;
    const write = () => { if (element.dataset.revealed) { complete(); return; } length = Math.min(text.length, length + (text.length > 200 ? 6 : 1)); element.textContent = text.slice(0, length); if (length < text.length) later(write, 24); else complete(); };
    write();
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const { action, value } = button.dataset;
    const node = current();
    if (action === 'scenario') selectScenario(value);
    else if (action === 'size') { state.manualSize = true; state.size = value; render(); }
    else if (action === 'replay') selectScenario(state.scenario.id);
    else if (action === 'peek') {
      const peeking = button.closest('.guide-conversation').classList.toggle('is-peeking');
      button.setAttribute('aria-expanded', String(!peeking));
      button.setAttribute('aria-label', peeking ? '返回对白' : `暂收引导，查看${state.id.startsWith('home:') ? '界面' : '棋盘'}`);
      button.textContent = peeking ? '返回对白' : `查看${state.id.startsWith('home:') ? '界面' : '棋盘'}`;
    }
    else if (action === 'answer') { const option = node.options[Number(button.dataset.index)]; later(() => advance(option?.nextNodeId), Number(option?.transitionDelaySeconds || 0) * 1000); }
    else if (action === 'continue') advance(node.nextNodeId);
    else if (action === 'reveal') { const text = document.querySelector('#guide-dialogue-text'); text.dataset.revealed = 'true'; text.textContent = text.dataset.fullText; }
    else if (action === 'home-target') { if (state.id === 'home:handbook') advance(); }
    else if (action === 'board-move' && node.type === 'player-move') {
      const pointId = `${button.dataset.x},${button.dataset.y}`;
      if (node.pointId && pointId !== node.pointId) { toast('请再看看引导的位置。'); return; }
      addStone({ ...node, pointId });
      advance(node.nextNodeId);
    } else if (action === 'board-move' && node.type === 'player-skill' && state.skillArmed) {
      const pointId = `${button.dataset.x},${button.dataset.y}`;
      if (pointId !== node.pointId) { toast('请选择 F-5 处的棋子。'); return; }
      applySnapshot(node.nextNodeId);
      state.skill = node;
      state.skillArmed = false;
      render();
      later(() => advance(node.nextNodeId), 1500);
    } else if (action === 'hint') frame.querySelector('.guide-target-point')?.focus();
    else if (action === 'skill' && node.type === 'player-skill') { state.skillArmed = true; render(); }
    else if (action === 'exit') { document.querySelector('#guide-confirm').hidden = false; frame.querySelector('[data-action="cancel-exit"]').focus(); }
    else if (action === 'cancel-exit') document.querySelector('#guide-confirm').hidden = true;
    else if (action === 'confirm-exit') { selectScenario(state.scenario.id); toast('样板已重置。'); }
  });
  document.querySelector('#guide-typewriter').addEventListener('change', event => { state.typing = event.target.checked; render(); });
  document.querySelector('#guide-quick-select').addEventListener('change', event => selectScenario(event.target.value));
  const autoLabel = document.createElement('label');
  autoLabel.className = 'guide-checkbox';
  autoLabel.innerHTML = '<input type="checkbox" id="guide-auto">按原节点自动推进';
  document.querySelector('.guide-replay').before(autoLabel);
  autoLabel.querySelector('input').addEventListener('change', event => { state.auto = event.target.checked; render(); });
  document.addEventListener('keydown', event => {
    const confirm = document.querySelector('#guide-confirm');
    if (confirm.hidden) return;
    if (event.key === 'Escape') { confirm.hidden = true; frame.querySelector('[data-action="exit"]').focus(); }
    else if (event.key === 'Tab') { event.preventDefault(); const buttons = [...confirm.querySelectorAll('button')]; const index = buttons.indexOf(document.activeElement); buttons[(index + 1) % buttons.length].focus(); }
  });
  let viewportMode = mobileSize();
  frame.addEventListener('keydown', event => { if (event.target.matches('[data-action="reveal"]') && ['Enter', ' '].includes(event.key)) { event.preventDefault(); event.target.click(); } });
  window.addEventListener('resize', () => { const next = mobileSize(); if (next !== viewportMode) { viewportMode = next; if (!state.manualSize) { state.size = next; render(); } } });
  selectScenario(state.id);
})();
