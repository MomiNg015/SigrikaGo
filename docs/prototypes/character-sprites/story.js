(() => {
  const storyLines = [
    '你来啦。今天也一起下一局吧？',
    '这步先别急。看看这里，留一手，下一回合会舒服些。',
    '诶？原来还能这样走……让我再看一眼。',
    '这一局真有意思。刚才那一步，我们再试一次吧。',
  ];

  const longLines = [
    '先不用着急开始。你可以看看棋盘，也可以想一想上一局最想重试的那一步。等准备好了，我们再一起落子。',
    '我刚才只顾着往前走，差一点就漏看了旁边的空位。多停一下，看看对方下一步可能落在哪里，也许就能找到更合适的走法。',
    '我原本以为你会选另一边，没想到这一步把两处都照顾到了。先让我把前面几步再想一遍，等想明白了，再试着接下去。',
    '有几步我下得太快，还有几步是看到你的回应才明白的。我们可以从最有意思的那一段重新摆起，换一种走法，看看结果会不会不同。',
  ];

  window.SpriteScenes ||= {};
  window.SpriteScenes.renderStory = ({ state, art }) => {
    const index = Math.min(3, Math.max(0, Number(state.storyIndex) || 0));
    const extended = state.longText
      ? `<p>${longLines[index]}</p><p>不用一次想完。我们慢慢看，想到哪里就聊到哪里。</p>`
      : '';

    return `<section class="scene-story${state.longText ? ' story-long-text' : ''}" aria-label="西格莉卡剧情对话样板">
      <div class="story-stage">
        <div class="story-scene-caption"><span>棋社</span><span class="story-step" aria-label="第 ${index + 1} 段，共 4 段">${String(index + 1).padStart(2, '0')} / 04</span></div>
        ${art('sigrika', state.expression, state.framing, 'story-character')}
      </div>
      <div class="story-dialog">
        <div class="story-dialog-heading">
          <h2 class="story-speaker">西格莉卡</h2>
          <button type="button" class="story-length-toggle" data-action="toggle-long-text" aria-pressed="${Boolean(state.longText)}">${state.longText ? '收起长对白' : '试试长对白'}</button>
        </div>
        <div class="story-dialog-body" tabindex="0" aria-label="对白">
          <p>${storyLines[index]}</p>${extended}
        </div>
        <div class="story-dialog-actions">
          <button type="button" class="story-button story-button-back" data-action="story-back"${index === 0 ? ' disabled' : ''}>上一句</button>
          <button type="button" class="story-button story-button-next" data-action="story-next">${index === 3 ? '再看一遍' : '继续'}<span aria-hidden="true"> →</span></button>
        </div>
      </div>
    </section>`;
  };
})();
