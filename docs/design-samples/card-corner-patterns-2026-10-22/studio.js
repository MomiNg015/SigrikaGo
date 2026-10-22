const names={orbit:'星轨切片',facets:'光束折面',coordinate:'棋阵坐标'};
const descriptions={orbit:'A · 星轨切片：大卡片用圆弧，小卡片只露一段轨迹。',facets:'B · 光束折面：斜切色面与错位轮廓，角落有更鲜明的构成。',coordinate:'C · 棋阵坐标：有限的棋盘交点与菱框，适合资料与战绩。'};
let selected='orbit';
let baseline=false;
const frame=document.querySelector('iframe');
function update(){
  const query=new URLSearchParams({v:baseline?'baseline':selected,context:document.querySelector('#context').value,fixture:document.querySelector('#fixture').value,texture:document.querySelector('#texture').checked?'on':'off'});
  frame.src='./sample.html?'+query;
  frame.title=(baseline?'正式原版':names[selected])+'真实窗口';
  document.querySelector('#open-sample').href=frame.src;
  document.querySelector('#description').textContent=baseline?'当前正式窗口原版，再次点击返回纹理方案。':descriptions[selected];
}
document.querySelectorAll('[data-variant]').forEach(button=>button.addEventListener('click',()=>{
  selected=button.dataset.variant;baseline=false;
  document.querySelector('#baseline').setAttribute('aria-pressed','false');
  document.querySelectorAll('[data-variant]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  update();
}));
document.querySelector('#baseline').addEventListener('click',event=>{baseline=!baseline;event.currentTarget.setAttribute('aria-pressed',String(baseline));update();});
document.querySelectorAll('select,#texture').forEach(control=>control.addEventListener('change',update));
document.querySelectorAll('[data-viewport]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-viewport]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  document.querySelector('.frame-wrap').dataset.viewport=button.dataset.viewport;
}));
if(innerWidth<700)document.querySelector('[data-viewport="narrow"]').click();
