(() => {
  const expressions = {
    smile: '微笑', thinking: '思考', surprised: '惊讶', closed_smile: '闭眼笑',
    worried: '担忧', angry: '生气', embarrassed: '害羞', serious: '认真', original: '开口笑'
  };
  const names = { sigrika: '西格莉卡', denia: '达妮娅', aemeath: '爱弥斯' };
  const catalog = window.SpriteCatalog;
  const collectionScenes = ['handbook', 'student', 'resume'];
  const captions = {
    story: '推进对白，查看同一站位下的表情变化。',
    battle: '试下棋子或使用技能，观察半身立绘与信息卡。',
    team: '切换出战角色，比较三张头肩裁切。',
    result: '切换胜负，查看结算时的表情与构图。',
    handbook: '点开角色详情，查看完整立绘和表情。',
    student: '点击学生证打开履历；可切换三名出战角色。',
    resume: '切换角色、战绩模式或空状态，检查头像与信息布局。'
  };
  const state = {
    scene: ['story', 'battle', 'team', 'result', ...collectionScenes].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'handbook', expression: 'smile', framing: 'bust', storyIndex: 0, longText: false,
    characterId: 'sigrika', sortieId: 'sigrika', handbookOpen: false, handbookExpressions: false, fullArt: false, profileMode: 'spark', emptyStats: false,
    viewport: window.matchMedia('(max-width:760px)').matches ? 'phone' : 'desktop',
    turn: 'black', skillUsed: false, skillShowing: false, teamActive: 0, outcome: 'win',
    moves: [{ x: 3, y: 3, color: 'black' }, { x: 9, y: 9, color: 'white' }, { x: 9, y: 3, color: 'black' }, { x: 3, y: 9, color: 'white' }]
  };
  let toastTimer;
  let skillTimer;
  let renderVersion = 0;
  const scene = document.querySelector('#scene');
  const activeCharacter = () => collectionScenes.includes(state.scene) ? state.characterId : 'sigrika';
  const expressionMap = id => catalog[id]?.expressions || expressions;
  const source = (id, expression) => `./assets/${id}/${expressionMap(id)[expression] ? expression : 'smile'}.png`;
  const art = (id, expression, framing, extraClass = '') => `<div class="sprite-art character-${id} frame-${framing} ${extraClass}" role="img" aria-label="${names[id]} · ${expressionMap(id)[expression] || expressionMap(id).smile}"><img src="${source(id, expression)}" alt="" decoding="async" draggable="false"></div>`;

  const result = ({ state: current, art: image }) => {
    const mapping = {
      win: { title: '赢了耶！', expression: 'closed_smile', detail: '黑方胜', score: '3.5', unit: '目', delta: '+24', coins: '+30' },
      loss: { title: '下次再来！', expression: 'worried', detail: '白方胜', score: '2.5', unit: '目', delta: '−18', coins: '+10' },
      draw: { title: '不分胜负', expression: 'smile', detail: '双方和棋', score: '平局', unit: '', delta: '0', coins: '+15' }
    };
    const data = mapping[current.outcome];
    return `<section class="scene-result" aria-label="对局结算样板"><div class="result-sheet"><h2 class="result-heading">${data.title}</h2><div class="result-layout"><div><div class="result-character">${image('sigrika', current.expression, 'bust')}</div><p class="result-person">西格莉卡</p></div><div class="result-details"><h3>${data.detail}</h3><div class="result-score">${data.score}<small>${data.unit}</small></div><div class="result-summary-line"><span>积分</span><strong>${data.delta}</strong></div><div class="result-summary-line"><span>金币</span><strong>${data.coins}</strong></div><button class="result-confirm" data-action="result-confirm">确认</button></div></div><div class="result-outcomes" aria-label="结算状态"><button data-action="set-outcome" data-value="win" aria-pressed="${current.outcome === 'win'}">胜利</button><button data-action="set-outcome" data-value="loss" aria-pressed="${current.outcome === 'loss'}">败北</button><button data-action="set-outcome" data-value="draw" aria-pressed="${current.outcome === 'draw'}">平局</button></div></div></section>`;
  };

  function render() {
    renderVersion += 1;
    const narrowViewport = window.matchMedia('(max-width:760px)').matches;
    if (narrowViewport) state.viewport = 'phone';
    const context = { state, art };
    const scenes = window.SpriteScenes || {};
    const renderer = { story: scenes.renderStory, battle: scenes.renderBattle, team: scenes.renderTeam, result, handbook: scenes.renderHandbook, student: scenes.renderStudent, resume: scenes.renderResume }[state.scene];
    scene.innerHTML = renderer ? renderer(context) : '<p>正在准备画面…</p>';
    document.querySelector('#preview-viewport').className = `preview-viewport preview-${state.viewport}`;
    const currentId = activeCharacter();
    const fixedExpression = ['student', 'resume'].includes(state.scene) || (state.scene === 'handbook' && !state.handbookOpen);
    const currentExpression = fixedExpression ? 'smile' : state.expression;
    document.querySelector('#expressions').innerHTML = Object.entries(expressionMap(currentId)).map(([key, label]) => `<button data-action="set-expression" data-value="${key}" aria-pressed="${currentExpression === key}">${label}</button>`).join('');
    document.querySelector('#control-character').textContent = names[currentId];
    document.querySelector('#expression-label').textContent = expressionMap(currentId)[currentExpression];
    document.querySelector('#reference-art').innerHTML = art(currentId, currentExpression, 'avatar');
    document.querySelector('#character-control').hidden = !collectionScenes.includes(state.scene);
    document.querySelector('#expression-control').hidden = collectionScenes.includes(state.scene);
    document.querySelectorAll('[data-action="set-profile-character"]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.value === state.characterId)));
    document.querySelector('#scene-caption').textContent = captions[state.scene];
    document.querySelector('#size-caption').textContent = state.viewport === 'phone' ? '手机竖屏构图' : '桌面构图';
    document.querySelector('#framing-control').hidden = state.scene !== 'story';
    document.querySelectorAll('[data-action="set-scene"]').forEach(button => {
      if (button.dataset.value === state.scene) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-action="set-viewport"]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.value === state.viewport)));
    document.querySelector('[data-action="set-viewport"][data-value="desktop"]').disabled = narrowViewport;
    document.querySelectorAll('[data-action="set-framing"]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.value === state.framing)));
    history.replaceState(null, '', `#${state.scene}`);
    document.querySelector('.sample-controls').inert = state.fullArt;
    document.querySelector('.scene-nav').inert = state.fullArt;
    document.querySelector('.viewport-switch').inert = state.fullArt;
    if (state.fullArt) document.querySelector('[data-action="close-full-art"]').focus({ preventScroll: true });
  }

  async function setExpression(expression) {
    const id = activeCharacter();
    if (!expressionMap(id)[expression]) return;
    const request = ++renderVersion;
    const image = new Image();
    image.src = source(id, expression);
    try { await image.decode(); } catch { toast('这张表情加载失败，请再试一次。'); return; }
    if (request !== renderVersion) return;
    state.expression = expression;
    render();
  }
  function toast(message) {
    const element = document.querySelector('#toast');
    clearTimeout(toastTimer);
    element.textContent = message;
    element.hidden = false;
    toastTimer = setTimeout(() => { element.hidden = true; }, 2200);
  }
  function castSkill() {
    if (state.skillUsed) return;
    const previousExpression = state.expression;
    state.skillUsed = true;
    state.skillShowing = true;
    state.expression = 'serious';
    render();
    clearTimeout(skillTimer);
    skillTimer = setTimeout(() => {
      state.skillShowing = false;
      if (state.scene === 'battle' && state.expression === 'serious') state.expression = previousExpression;
      render();
    }, 2200);
  }
  function setScene(value) {
    if (!Object.hasOwn(captions, value)) return;
    state.scene = value;
    state.fullArt = false;
    clearTimeout(skillTimer);
    state.skillShowing = false;
    if (value === 'handbook') { state.handbookOpen = false; state.handbookExpressions = false; }
    if (value === 'result') state.expression = { win: 'closed_smile', loss: 'worried', draw: 'smile' }[state.outcome];
    if (value === 'story') state.expression = ['smile', 'thinking', 'surprised', 'closed_smile'][state.storyIndex];
    if (collectionScenes.includes(value)) state.expression = 'smile';
    else if (!expressions[state.expression]) state.expression = 'smile';
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const { action, value } = button.dataset;
    if (action === 'set-expression') { void setExpression(value); return; }
    if (action === 'set-scene') {
      setScene(value);
    } else if (action === 'set-profile-character' || action === 'open-handbook') {
      if (!catalog[value]?.expressions) return;
      state.characterId = value;
      state.expression = 'smile';
      state.fullArt = false;
      state.handbookExpressions = false;
      if (action === 'open-handbook') state.handbookOpen = true;
    } else if (action === 'handbook-back') {
      state.handbookOpen = false;
      state.handbookExpressions = false;
      state.expression = 'smile';
    } else if (action === 'handbook-sortie') {
      state.sortieId = state.characterId;
      toast(`${names[state.characterId]}已出战，仅在样板中生效。`);
    } else if (action === 'toggle-handbook-expressions') state.handbookExpressions = !state.handbookExpressions;
    else if (action === 'view-full-art') state.fullArt = true;
    else if (action === 'close-full-art') state.fullArt = false;
    else if (action === 'open-resume') { state.scene = 'resume'; state.expression = 'smile'; }
    else if (action === 'set-profile-mode') state.profileMode = value;
    else if (action === 'toggle-empty-stats') state.emptyStats = !state.emptyStats;
    else if (action === 'set-viewport') state.viewport = value;
    else if (action === 'set-framing') state.framing = value;
    else if (action === 'toggle-long-text') state.longText = !state.longText;
    else if (action === 'story-next' || action === 'story-back') {
      state.storyIndex = (state.storyIndex + (action === 'story-next' ? 1 : 3)) % 4;
      state.expression = ['smile', 'thinking', 'surprised', 'closed_smile'][state.storyIndex];
    } else if (action === 'cast-skill') { castSkill(); return; }
    else if (action === 'toggle-turn' || action === 'pass') state.turn = state.turn === 'black' ? 'white' : 'black';
    else if (action === 'reset-board') {
      state.moves = [];
      state.skillUsed = false;
      state.skillShowing = false;
      state.expression = 'smile';
      state.turn = 'black';
      clearTimeout(skillTimer);
    } else if (action === 'board-move') {
      const x = Number(button.dataset.x), y = Number(button.dataset.y);
      if (state.moves.some(move => move.x === x && move.y === y)) return;
      state.moves.push({ x, y, color: state.turn });
      state.turn = state.turn === 'black' ? 'white' : 'black';
    } else if (action === 'select-team') state.teamActive = Number(button.dataset.index);
    else if (action === 'set-outcome') {
      state.outcome = value;
      state.expression = { win: 'closed_smile', loss: 'worried', draw: 'smile' }[value];
    } else if (action === 'result-confirm') { toast('已确认。可切换胜负继续查看。'); return; }
    else if (action === 'demo-note') { toast(button.dataset.message || '这里仅展示界面。'); return; }
    else return;
    render();
    if (action === 'close-full-art') document.querySelector('[data-action="view-full-art"]').focus({ preventScroll: true });
  });
  document.addEventListener('keydown', event => {
    if (!state.fullArt) return;
    if (event.key === 'Escape') {
      state.fullArt = false;
      render();
      document.querySelector('[data-action="view-full-art"]').focus({ preventScroll: true });
    } else if (event.key === 'Tab') {
      event.preventDefault();
      document.querySelector('[data-action="close-full-art"]').focus({ preventScroll: true });
    }
  });
  window.SpriteDemo = { state, render, art, setExpression };
  window.addEventListener('resize', render);
  window.addEventListener('hashchange', () => { setScene(location.hash.slice(1)); render(); });
  render();
})();
