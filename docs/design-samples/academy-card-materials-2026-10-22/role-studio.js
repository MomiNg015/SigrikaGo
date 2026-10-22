const motifs = [
  {role:'identity',name:'档案切角',use:'身份 / 个人资料',note:'上角大块裁切，像档案上的切章。',surface:'self'},
  {role:'record',name:'棋局矩阵',use:'战绩 / 挑战记录',note:'下角阶梯与方阵，留出数字阅读区。',surface:'self'},
  {role:'social',name:'交叠联结',use:'好友 / 伙伴关系',note:'两块宽幅环形交叠，表达关系。',surface:'friends'},
  {role:'inventory',name:'封装折带',use:'物品 / 仓库说明',note:'保留原 C 的斜切折带与局部网点。',surface:'warehouse'},
  {role:'tactics',name:'对向楔阵',use:'技能 / 观战对局',note:'相向楔形和中间留隙，形成对弈感。',surface:'handbook'},
  {role:'reading',name:'页角印层',use:'简介 / 公告正文',note:'低对比页角叠层，让长文更安静。',surface:'announcement'},
  {role:'honor',name:'授章菱片',use:'段位 / 成就',note:'段位镜像放左下，成就原图放右下。',surface:'achievement'},
];
const windows = {
  self:['我的履历','身份用切角，段位用镜像授章放左下，战绩和挑战用矩阵。'],
  social:['他人详情','沿用身份、授章和矩阵三种功能分工，保留社交操作区。'],
  friends:['好友','名单与伙伴详情都属于关系卡；小卡更轻，大卡放大交叠联结。'],
  warehouse:['仓库','物品卡和详情使用封装折带；商品图、数量与使用按钮保持清楚。'],
  watch:['观战','对局使用对向楔阵；结束态仍用灰底，纹理不承担状态含义。'],
  handbook:['角色详情','技能正文用对向楔阵，人物简介用页角印层；声痕和棋子装饰保留。'],
  achievement:['成就','授章菱片作为静态背景；解锁状态继续由原有界面表达。'],
  announcement:['公告','列表用小页角，长文用弱化的大页角，保持正文留白。'],
};
let surface='self',version='production';
const frame=document.querySelector('iframe');
function update(){
  const query=new URLSearchParams({v:version==='original'?'screenprint':'screenprint-roles',window:surface,fixture:document.querySelector('#fixture').value,off:version==='baseline'?'1':'0'});
  frame.src=(version==='production'?'./production.html?':'./sample.html?')+query;frame.title='功能丝印 · '+windows[surface][0];
  document.querySelector('#description').textContent=windows[surface][0];
  document.querySelector('#assignment').textContent=windows[surface][1];
  document.querySelector('#standalone').href=frame.src;
  document.querySelectorAll('[data-window]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.window===surface)));
  document.querySelectorAll('[data-version]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.version===version)));
}
for(const motif of motifs){
  const button=document.createElement('button');button.className='motif-choice';button.dataset.role=motif.role;
  button.innerHTML=`<span class="motif-paper"><img src="./role-${motif.role}.svg" alt="" /></span><strong>${motif.name}</strong><small>${motif.use}<br>${motif.note}</small>`;
  button.setAttribute('aria-label',`${motif.name}：查看${windows[motif.surface][0]}`);
  button.addEventListener('click',()=>{surface=motif.surface;version='production';update();document.querySelector('#live').scrollIntoView();});
  document.querySelector('.motif-board').append(button);
}
const note=document.createElement('p');note.className='motif-note';note.innerHTML='<strong>同功能，保持一致。<br>不同功能，改变构图。</strong>不按卡片序号随机换纹理。<br>大小、留白和所在角落随内容调整。';document.querySelector('.motif-board').append(note);
document.querySelectorAll('[data-window]').forEach(b=>b.addEventListener('click',()=>{surface=b.dataset.window;update();}));
document.querySelectorAll('[data-version]').forEach(b=>b.addEventListener('click',()=>{version=b.dataset.version;update();}));
document.querySelector('#fixture').addEventListener('change',update);
document.querySelectorAll('button[data-size]').forEach(b=>b.addEventListener('click',()=>{document.querySelector('.frame-wrap').dataset.size=b.dataset.size;document.querySelectorAll('button[data-size]').forEach(i=>i.setAttribute('aria-pressed',String(i===b)));}));
if(innerWidth<700)document.querySelector('button[data-size=narrow]').click();
