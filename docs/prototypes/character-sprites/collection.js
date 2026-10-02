(() => {
  const catalog = window.SpriteCatalog;
  const newIds = ['sigrika', 'denia', 'aemeath'];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const title = text => `<h2 class="collection-title">${text}</h2>`;
  const characterButtons = state => `<div class="collection-character-picker" aria-label="出战角色">${newIds.map(id => `<button data-action="set-profile-character" data-value="${id}" aria-pressed="${state.characterId === id}">${catalog[id].name}</button>`).join('')}</div>`;
  const fullArt = ({ state, art }) => !state.fullArt ? '' : `<div class="collection-full-art" role="dialog" aria-modal="true" aria-label="${catalog[state.characterId].name}完整立绘"><button class="collection-full-close" data-action="close-full-art" aria-label="关闭完整立绘">×</button>${art(state.characterId, state.expression, 'full')}<span>${catalog[state.characterId].name}</span></div>`;
  const skill = value => `<section class="handbook-skill"><div class="handbook-skill-heading"><h3>${escape(value.name)}</h3><span>超频 ${escape(value.costValue ?? value.cost)} · ${value.uses} 次</span></div><p>${escape(value.description)}</p></section>`;

  function renderHandbook(context) {
    const { state, art } = context;
    const character = catalog[state.characterId];
    if (!state.handbookOpen) {
      return `<section class="scene-collection scene-handbook" aria-label="部员手册样板"><header class="collection-window-header">${title('部员手册')}<span>当前出战 · ${catalog[state.sortieId].name}</span></header><div class="handbook-grid" tabindex="0" aria-label="角色学生证列表">${Object.values(catalog).map(member => {
        const standard = !!member.expressions;
        const selected = state.sortieId === member.id;
        return `<article class="handbook-member member-${member.id}${selected ? ' is-sortie' : ''}${standard ? '' : ' member-legacy'}" aria-label="${member.name}部员证"><img class="student-id-skin" src="./assets/cards/student-id-light.png" alt="" draggable="false"><button class="handbook-member-open" data-action="${standard ? 'open-handbook' : 'demo-note'}" data-value="${member.id}" data-message="这轮先展示西格莉卡、达妮娅和爱弥斯的详情。" aria-label="查看${member.name}详情"><span class="handbook-member-portrait">${standard ? art(member.id, 'smile', 'bust') : `<img src="${member.legacyPortrait}" alt="">`}</span><strong class="student-id-name">${member.name}</strong><span class="student-id-school">星炬学院</span></button><button class="handbook-card-sortie" data-action="handbook-sortie" data-value="${member.id}" aria-label="${selected ? member.name + '已出战' : '派' + member.name + '出战'}" ${selected ? 'disabled' : ''}>${selected ? '✓ 已出战' : '出战'}</button></article>`;
      }).join('')}</div></section>`;
    }
    const expressionButtons = Object.entries(character.expressions).map(([key, label]) => `<button data-action="set-expression" data-value="${key}" aria-pressed="${state.expression === key}">${label}</button>`).join('');
    return `<section class="scene-collection scene-handbook handbook-detail" aria-label="${character.name}详情样板"><header class="collection-window-header"><button class="collection-back" data-action="handbook-back">← 部员手册</button><button data-action="view-full-art">查看完整立绘</button></header><div class="handbook-detail-layout" tabindex="0" aria-label="角色详情"><div class="handbook-art-column"><div class="handbook-large-art">${art(character.id, state.expression, state.viewport === 'phone' ? 'knee' : 'full')}</div><button class="handbook-expression-toggle" data-action="toggle-handbook-expressions" aria-expanded="${state.handbookExpressions}">表情预览 <span>${state.handbookExpressions ? '−' : '+'}</span></button><div class="handbook-expression-picker" ${state.handbookExpressions ? '' : 'hidden'}>${expressionButtons}</div></div><div class="handbook-detail-copy"><div class="handbook-name">${title(character.name)}${character.cv ? `<span>CV：${escape(character.cv)}</span>` : ''}</div><p class="handbook-character-line">${escape(character.description)}</p>${skill(character.skill)}${character.derivedSkills.map(skill).join('')}<div class="handbook-acquisition"><span>获得途径</span><strong>${escape(character.acquisition)}</strong></div><div class="handbook-detail-actions"><button data-action="demo-note" data-message="服装仍使用对应外观；本样板只展示默认造型。">服装</button><button class="collection-primary" data-action="handbook-sortie">${state.sortieId === character.id ? '已出战' : '出战'}</button></div></div></div>${fullArt(context)}</section>`;
  }

  function renderStudent({ state, art }) {
    return `<section class="scene-collection scene-student" aria-label="首页学生证样板"><header class="collection-window-header">${title('学生证')}${characterButtons(state)}</header><div class="student-desktop"><div class="student-card-zone"><button class="student-hanging-card" data-action="open-resume" aria-label="打开履历"><img class="student-card-shell" src="../../../public/assets/home/student-id-hanging.webp" alt=""><span class="student-card-pin" aria-hidden="true"></span><span class="student-card-photo">${art(state.characterId, 'smile', 'avatar')}</span><span class="student-card-name">莫名同学</span></button></div><div class="student-home-entries"><button class="student-handbook-entry" data-action="set-scene" data-value="handbook"><img src="../../../public/assets/home/book-entry.webp" alt=""><span>部员手册</span></button><button class="student-match-entry" data-action="demo-note" data-message="这里只演示学生证裁切。"><img src="../../../public/assets/home/fantasy-match-entry.webp" alt=""><span>对弈</span></button></div></div></section>`;
  }

  const modes = { spark: '星炬', standard: '标准', gomoku: '五子棋' };
  const modeRecords = { spark: [
    { id: 'sigrika', total: 64, wins: 42, losses: 20, draws: 2 },
    { id: 'denia', total: 37, wins: 23, losses: 13, draws: 1 },
    { id: 'aemeath', total: 25, wins: 13, losses: 11, draws: 1 }
  ], standard: [
    { id: 'sigrika', total: 26, wins: 16, losses: 9, draws: 1 },
    { id: 'denia', total: 16, wins: 10, losses: 6, draws: 0 },
    { id: 'aemeath', total: 10, wins: 5, losses: 5, draws: 0 }
  ], gomoku: [
    { id: 'sigrika', total: 14, wins: 8, losses: 5, draws: 1 },
    { id: 'denia', total: 8, wins: 4, losses: 3, draws: 1 },
    { id: 'aemeath', total: 6, wins: 3, losses: 3, draws: 0 }
  ] };
  function renderResume({ state, art }) {
    const rows = state.emptyStats ? [] : modeRecords[state.profileMode];
    const data = rows.reduce((totals, row) => ({ total: totals.total + row.total, wins: totals.wins + row.wins, losses: totals.losses + row.losses, draws: totals.draws + row.draws }), { total: 0, wins: 0, losses: 0, draws: 0 });
    return `<section class="scene-collection scene-resume" aria-label="履历样板"><header class="collection-window-header">${title('履历')}<button class="collection-back" data-action="set-scene" data-value="student">← 学生证</button></header><div class="resume-identity"><div class="resume-photo">${art(state.characterId, 'smile', 'avatar')}</div><div class="resume-name"><h3>莫名同学</h3><p>UID 10001</p></div><div class="resume-identity-actions"><button data-action="demo-note" data-message="此处为成就入口样板。">成就</button><button data-action="demo-note" data-message="此处为个性化入口样板。">个性化</button></div></div><div class="resume-mode-tabs" role="group" aria-label="战绩模式">${Object.entries(modes).map(([id, name]) => `<button data-action="set-profile-mode" data-value="${id}" aria-pressed="${state.profileMode === id}">${name}</button>`).join('')}</div><div class="resume-scroll" tabindex="0" aria-label="履历战绩"><div class="resume-summary"><div class="resume-rank"><span>段位</span><strong>${state.emptyStats ? '初段' : '三段'}<small>${state.emptyStats ? '☆☆☆' : '★★☆'}</small></strong></div><dl class="resume-metrics"><div><dt>总对局</dt><dd>${data.total}</dd></div><div><dt>胜</dt><dd>${data.wins}</dd></div><div><dt>负</dt><dd>${data.losses}</dd></div><div><dt>和</dt><dd>${data.draws}</dd></div><div><dt>胜率</dt><dd>${data.total ? (data.wins / data.total * 100).toFixed(1) : '0.0'}%</dd></div></dl></div><div class="resume-recent"><span>最近十盘</span>${state.emptyStats ? '<p>暂无近期战绩</p>' : '<div aria-label="近期战绩">' + ['胜','负','胜','胜','和','负','胜','胜','负','胜'].map(value => `<span class="resume-result-${value === '胜' ? 'win' : value === '负' ? 'loss' : 'draw'}">${value}</span>`).join('') + '</div>'}</div>${state.emptyStats ? '<div class="resume-empty">暂无角色战绩</div>' : `<table class="resume-record-table"><thead><tr><th scope="col">角色</th><th scope="col">对局</th><th scope="col">胜</th><th scope="col">负</th><th scope="col">和</th><th scope="col">胜率</th></tr></thead><tbody>${rows.map(record => `<tr><th scope="row"><span class="resume-record-character">${art(record.id, 'smile', 'avatar')}<span>${catalog[record.id].name}</span></span></th><td>${record.total}</td><td>${record.wins}</td><td>${record.losses}</td><td>${record.draws}</td><td>${record.total ? (record.wins / record.total * 100).toFixed(1) : '0.0'}%</td></tr>`).join('')}</tbody></table>`}</div><footer class="resume-footer">${characterButtons(state)}<button data-action="toggle-empty-stats" aria-pressed="${state.emptyStats}">${state.emptyStats ? '查看示例战绩' : '查看空状态'}</button></footer></section>`;
  }
  window.SpriteScenes = { ...window.SpriteScenes, renderHandbook, renderStudent, renderResume };
})();
