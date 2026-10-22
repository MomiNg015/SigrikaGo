const names={imprint:'A 学院徽印',relief:'B 工业浮雕',screenprint:'C 战术丝印'};
const windows={self:'我的履历',social:'他人详情',friends:'好友',warehouse:'仓库',watch:'观战',handbook:'角色详情',achievement:'成就',announcement:'公告'};
let selected='relief',surface='warehouse',off=false;
const frame=document.querySelector('iframe');
function update(){
  const query=new URLSearchParams({v:selected,window:surface,fixture:document.querySelector('#fixture').value,off:off?'1':'0'});
  frame.src='./sample.html?'+query;frame.title=names[selected]+' · '+windows[surface];
  document.querySelector('#open-sample').href=frame.src;
  document.querySelector('#description').textContent=(off?'原版对照':names[selected])+' · '+windows[surface];
  document.querySelectorAll('[data-variant]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.variant===selected)));
  document.querySelectorAll('[data-window-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.windowTab===surface)));
  document.querySelector('#baseline').setAttribute('aria-pressed',String(off));
}
document.querySelectorAll('[data-variant]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.variant;off=false;update();}));
document.querySelectorAll('[data-window-tab]').forEach(b=>b.addEventListener('click',()=>{surface=b.dataset.windowTab;update();}));
document.querySelectorAll('[data-proof]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.proof;surface=b.dataset.window;off=false;update();document.querySelector('#live').scrollIntoView();}));
document.querySelector('#baseline').addEventListener('click',()=>{off=!off;update();});
document.querySelector('#fixture').addEventListener('change',update);
document.querySelectorAll('[data-size]').forEach(b=>{if(b.tagName!=='BUTTON')return;b.addEventListener('click',()=>{document.querySelector('.frame-wrap').dataset.size=b.dataset.size;document.querySelectorAll('button[data-size]').forEach(i=>i.setAttribute('aria-pressed',String(i===b)));});});
if(innerWidth<700)document.querySelector('button[data-size=narrow]').click();
