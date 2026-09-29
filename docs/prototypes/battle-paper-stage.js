const ns='http://www.w3.org/2000/svg';
const board=document.querySelector('#board');
let turn='black',moves=42,effectTimer;
const seed=[[3,3,'black'],[9,9,'white'],[9,3,'black'],[3,9,'white'],[4,3,'white'],[3,4,'black'],[4,4,'white'],[5,3,'black'],[8,9,'black'],[9,8,'white'],[8,8,'black'],[7,9,'white'],[9,4,'white'],[10,4,'black'],[8,4,'black'],[10,3,'white'],[5,5,'black'],[6,5,'white'],[6,6,'black'],[7,6,'white'],[5,7,'white'],[4,7,'black']];
const positions=new Map();
function svg(type,attrs){const el=document.createElementNS(ns,type);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,value);return el}
function drawBoard(){board.replaceChildren();positions.clear();for(let i=0;i<13;i++){const p=32+i*38;board.append(svg('path',{d:`M32 ${p}H488 M${p} 32V488`,stroke:'#6a554d','stroke-width':'.9',fill:'none'}))}for(const x of[3,6,9])for(const y of[3,6,9])board.append(svg('circle',{cx:32+x*38,cy:32+y*38,r:3,fill:'#3d2b25'}));for(const[x,y,c]of seed)addStone(x,y,c);for(let y=0;y<13;y++)for(let x=0;x<13;x++){const hit=svg('circle',{cx:32+x*38,cy:32+y*38,r:18,fill:'transparent',role:'button',tabindex:positions.has(`${x},${y}`)?'-1':'0','aria-label':`在${x+1}列${y+1}行试下`});hit.style.cursor='pointer';const place=()=>{if(positions.has(`${x},${y}`))return;addStone(x,y,turn);hit.setAttribute('tabindex','-1');moves++;switchTurn()};hit.addEventListener('click',place);hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();place()}});board.append(hit)}}
function addStone(x,y,c){positions.set(`${x},${y}`,c);board.append(svg('circle',{cx:34+x*38,cy:35+y*38,r:16,fill:'#3d2b2538','pointer-events':'none'}),svg('circle',{cx:32+x*38,cy:32+y*38,r:16,fill:c==='black'?'#3d2b25':'#fffbf2',stroke:'#3d2b25','stroke-width':'.8','pointer-events':'none'}))}
function renderTurn(){document.querySelectorAll('.player').forEach(p=>{const active=p.dataset.color===turn;p.classList.toggle('active',active);p.querySelector('.turn-sticker').textContent=active?'正在思考':'等待对方'});document.querySelector('#turn-label').textContent=turn==='black'?'黑方行棋':'白方行棋';document.querySelector('#move-count').textContent=moves}
function switchTurn(){turn=turn==='black'?'white':'black';renderTurn()}
function cast(color=turn){clearTimeout(effectTimer);document.body.classList.remove('casting');if(color!==turn){turn=color;renderTurn()}document.querySelector('.skill-burst strong').textContent=turn==='black'?'星辉符文':'泡影幻梦';requestAnimationFrame(()=>{document.body.classList.add('casting');effectTimer=setTimeout(()=>document.body.classList.remove('casting'),1250)})}
document.querySelector('#turn-toggle').onclick=switchTurn;
document.querySelector('#pass').onclick=()=>{moves++;switchTurn()};
document.querySelector('#effect-toggle').onclick=()=>cast();document.querySelector('#main-skill').onclick=()=>cast();
document.querySelectorAll('.skill').forEach(b=>b.onclick=()=>cast(b.dataset.player));
document.querySelector('#depth-toggle').onclick=e=>{const contained=document.body.classList.toggle('contained');e.currentTarget.setAttribute('aria-pressed',String(!contained));e.currentTarget.textContent=`立绘出框：${contained?'关':'开'}`};
document.querySelector('#reset').onclick=()=>{turn='black';moves=42;drawBoard();renderTurn()};
drawBoard();renderTurn();
