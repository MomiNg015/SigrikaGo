(function () {
  'use strict';
  window.SpriteScenes = window.SpriteScenes || {};

  const names = { sigrika: '西格莉卡', denia: '达妮娅', aemeath: '爱弥斯' };
  const letters = 'ABCDEFGHJKLMN';
  function stonesFor(state) {
    const added = (state.moves || []).map((move, index) => {
      if (Array.isArray(move)) return move;
      return [Number(move.x), Number(move.y), move.color || (index % 2 ? 'white' : 'black')];
    });
    return added.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x < 13 && y >= 0 && y < 13);
  }

  function board(state) {
    const stones = stonesFor(state);
    let lines = '';
    for (let i = 0; i < 13; i += 1) {
      const p = 30 + i * 27;
      lines += `<path d="M30 ${p}H354 M${p} 30V354" />`;
    }
    const stars = [[3, 3], [9, 3], [6, 6], [3, 9], [9, 9]].map(([x, y]) => `<circle cx="${30 + x * 27}" cy="${30 + y * 27}" r="2.3" />`).join('');
    const coordinates = [...letters].map((letter, i) => `<text x="${30 + i * 27}" y="17">${letter}</text><text x="13" y="${33 + i * 27}">${13 - i}</text>`).join('');
    const pieces = stones.map(([x, y, color], index) => {
      const latest = index === stones.length - 1;
      const cx = 30 + x * 27;
      const cy = 30 + y * 27;
      return `<g><circle cx="${cx + .7}" cy="${cy + 1.6}" r="12.2" fill="#503b29" opacity=".18" /><circle cx="${cx}" cy="${cy}" r="11.8" fill="url(#sprite-stone-${color === 'white' ? 'white' : 'black'})" stroke="${color === 'white' ? '#b3a891' : '#262c2f'}" stroke-width=".6" />${latest ? `<circle cx="${cx}" cy="${cy}" r="3" fill="none" stroke="${color === 'white' ? '#b76376' : '#ffe9a2'}" stroke-width="1.6" />` : ''}</g>`;
    }).join('');
    const hits = [];
    for (let y = 0; y < 13; y += 1) {
      for (let x = 0; x < 13; x += 1) {
        const occupied = stones.some((stone) => stone[0] === x && stone[1] === y);
        hits.push(`<button class="battle-intersection" style="left:${(30 + x * 27) / 384 * 100}%;top:${(30 + y * 27) / 384 * 100}%" data-action="board-move" data-x="${x}" data-y="${y}" aria-label="${letters[x]}${13 - y}${occupied ? '，已有棋子' : '，落子'}" ${occupied ? 'disabled' : ''}></button>`);
      }
    }
    return `<div class="battle-board turn-${state.turn || 'black'}" aria-label="13路围棋棋盘，可点击交叉点演示落子">
      <svg viewBox="0 0 384 384" role="img" aria-label="13路棋盘与示例棋子">
        <defs><radialGradient id="sprite-stone-black" cx="32%" cy="25%"><stop offset="0" stop-color="#576064"/><stop offset=".58" stop-color="#272d30"/><stop offset="1" stop-color="#151a1d"/></radialGradient><radialGradient id="sprite-stone-white" cx="32%" cy="22%"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#f6f2e7"/><stop offset="1" stop-color="#ded8c8"/></radialGradient></defs>
        <g class="battle-board-coordinates" text-anchor="middle">${coordinates}</g><g class="battle-grid-lines" fill="none">${lines}</g><g fill="#6b5942">${stars}</g>${pieces}
      </svg>${hits.join('')}
    </div>`;
  }

  function playerCard(ctx, own) {
    const { state, art } = ctx;
    const active = (state.turn || 'black') === (own ? 'black' : 'white');
    const id = own ? 'sigrika' : 'denia';
    return `<aside class="battle-player-card ${own ? 'battle-own' : 'battle-rival'} ${active ? 'is-turn' : ''}" aria-label="${own ? '你的' : '对手'}玩家信息">
      <div class="battle-player-wash" aria-hidden="true"></div>
      ${art(id, own ? state.expression : 'smile', 'bust', 'battle-player-art')}
      <div class="battle-identity"><span class="battle-color-stone ${own ? 'is-black' : 'is-white'}" aria-label="${own ? '黑方' : '白方'}"></span><div><strong>${names[id]}</strong><span class="battle-user-name">${own ? '我 · 学园成员' : '棋友小鹿 · 学园成员'}</span></div></div>
      <div class="battle-clock ${active ? 'is-active' : ''}"><span class="battle-clock-label">${active ? '正在思考' : '等待落子'}</span><strong>${own ? '04:32' : '03:58'}</strong><span class="battle-clock-extra">30秒 / 3次</span></div>
      <div class="battle-player-stats"><span>提子 <b>${own ? '2' : '1'}</b></span><span>除子 <b>${own && state.skillUsed ? '2' : '0'}</b></span><span>超频 <b>${own && state.skillUsed ? '1' : '0'}</b></span></div>
      ${own ? `<button class="battle-skill-button ${state.skillUsed ? 'is-used' : ''}" data-action="cast-skill" ${state.skillUsed ? 'disabled' : ''}><span>✦</span> ${state.skillUsed ? '已使用' : '发动技能'}</button>` : '<span class="battle-skill-label">◇ 泡影幻梦</span>'}
    </aside>`;
  }

  window.SpriteScenes.renderBattle = function (ctx) {
    const { state, art } = ctx;
    const count = (state.moves || []).length;
    return `<section class="scene-battle">
      <header class="battle-topbar"><span class="battle-room-label">13 路对局</span><span class="battle-demo-tools"><button data-action="toggle-turn" title="切换行棋方">切换回合</button><button data-action="reset-board" title="重置样板棋盘与技能状态">重置</button></span></header>
      <div class="battle-arena">
        ${playerCard(ctx, true)}
        <div class="battle-center"><div class="battle-board-topline"><span><i class="battle-live-dot"></i>对局中</span><span>第 ${count + 1} 手</span></div>${board(state)}<div class="battle-board-bottomline"><span>黑贴 6½ 目</span><span>${state.turn === 'white' ? '白方' : '黑方'}行棋 · 点击棋盘试落子</span></div></div>
        ${playerCard(ctx, false)}
      </div>
      <nav class="battle-actions" aria-label="对局操作"><button data-action="pass">◷ <span>弃手</span></button><button data-action="demo-note" data-message="样板仅展示数子入口，正式对局使用原有数子流程。">▦ <span>数子</span></button><button data-action="cast-skill" ${state.skillUsed ? 'disabled' : ''}>✦ <span>技能</span></button><button data-action="demo-note" data-message="样板仅展示和棋入口，正式对局需双方同意。">◇ <span>和棋</span></button><button data-action="demo-note" data-message="样板仅展示认输入口，正式对局会弹出认输确认。">⚑ <span>认输</span></button></nav>
      ${state.skillShowing ? `<div class="battle-skill-banner" role="status"><div class="battle-skill-banner-art">${art('sigrika', 'serious', 'bust', '')}</div><div class="battle-skill-banner-copy"><small>西格莉卡 · 技能演出</small><strong>星辉符文</strong></div><span class="battle-skill-banner-star" aria-hidden="true">✦</span></div>` : ''}
    </section>`;
  };

  window.SpriteScenes.renderTeam = function (ctx) {
    const { state, art } = ctx;
    const members = ['sigrika', 'denia', 'aemeath'];
    const index = Math.max(0, Math.min(2, Number(state.teamActive) || 0));
    const current = members[index];
    const skills = ['星辉符文', '泡影幻梦', '小爱出击'];
    return `<section class="scene-team">
      <header class="team-heading"><span class="team-label">队际赛</span><h2>队际头像</h2><p>三位队员，依次登场。</p></header>
      <div class="team-showcase">
        <div class="team-current-art"><div class="team-art-circle" aria-hidden="true"></div>${art(current, current === 'sigrika' ? state.expression : 'smile', 'bust', 'team-current-bust')}<span class="team-art-spark one" aria-hidden="true">✦</span><span class="team-art-spark two" aria-hidden="true">✧</span></div>
        <div class="team-roster-panel"><div class="team-roster-caption"><span>出场顺序</span><span>点击头像切换队员</span></div><div class="team-portrait-strip" role="group" aria-label="队员出场顺序">${members.map((id, i) => `<button class="team-member ${i === index ? 'is-selected' : ''}" data-action="select-team" data-index="${i}" aria-label="选择${names[id]}" aria-pressed="${i === index}"><span class="team-member-crop">${art(id, id === 'sigrika' ? state.expression : 'smile', 'avatar', 'team-avatar-art')}</span><span class="team-member-order">0${i + 1}</span><span class="team-member-name">${names[id]}</span>${i === index ? '<span class="team-member-active">当前出场</span>' : ''}</button>`).join('')}</div><div class="team-current-info"><small>第 ${index + 1} 位 · 当前出场</small><h3>${names[current]}</h3><p>技能 · ${skills[index]}</p></div></div>
      </div>
      <footer class="team-footer"><span>头像保留头饰与肩部，半身位沿用同一角色的表情。</span><span>◦ 队际头像构图样板</span></footer>
    </section>`;
  };
})();
