const names={mint:'薄荷档案',ink:'墨纸分栏',blue:'晴蓝名片'};
const descriptions={mint:'保留左侧角色、右侧资料的构图，用薄荷方格与暖纸承接现有 Q 版形象。',ink:'保留清楚的明暗对比，深墨只承载身份与段位；战绩回到暖纸，记录按两列阅读。',blue:'身份压成浅蓝横栏，下方分开总战绩和角色记录；手机保持紧凑的纵向清单。'};
const frame=document.querySelector('iframe');
document.querySelectorAll('[data-design]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-design]').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));
  const design=button.dataset.design;
  frame.src=`./${design}.html`;
  frame.title=`${names[design]}交互样板`;
  document.querySelector('#open-sample').href=frame.src;
  document.querySelector('#description').textContent=descriptions[design];
}));
document.querySelectorAll('button[data-viewport]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('button[data-viewport]').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));
  document.querySelector('.frame-wrap').dataset.viewport=button.dataset.viewport;
}));
if(innerWidth<700) document.querySelector(`[data-viewport="${innerWidth<430 ? 'narrow' : 'mobile'}"]`).click();
