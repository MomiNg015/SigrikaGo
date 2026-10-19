const names={arknights:'方舟档案',endfield:'终末地名片',hybrid:'融合档案'};
const descriptions={arknights:'对应第一张参考：左侧贯穿大立绘，右侧身份卡、签名和角色资料。',endfield:'对应第二张参考：左侧头像与战绩，右侧浅色成就板与深色角色展示，上深下浅。',hybrid:'结合两张参考：左侧完整角色与下方浅色战绩，右侧身份、成就、角色记录依次排列。'};
const frame=document.querySelector('iframe');
document.querySelectorAll('[data-design]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-design]').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));
  const design=button.dataset.design;
  frame.src=`./${design}.html`;frame.title=`${names[design]}交互样板`;
  document.querySelector('#open-sample').href=frame.src;
  document.querySelector('#description').textContent=descriptions[design];
}));
document.querySelectorAll('button[data-viewport]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('button[data-viewport]').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));
  document.querySelector('.frame-wrap').dataset.viewport=button.dataset.viewport;
}));
document.querySelector('#show-reference').addEventListener('click',event=>{
  const panel=document.querySelector('#reference-panel');panel.hidden=!panel.hidden;
  event.currentTarget.setAttribute('aria-expanded',String(!panel.hidden));
  event.currentTarget.textContent=panel.hidden ? '对照原图' : '收起原图';
});
if(innerWidth<700) document.querySelector('[data-viewport="mobile"]').click();
