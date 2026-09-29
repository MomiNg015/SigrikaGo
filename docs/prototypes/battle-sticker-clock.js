const board = document.querySelector('#board');
const ns = 'http://www.w3.org/2000/svg';
const seed = [[3,3,'black'],[9,9,'white'],[9,3,'black'],[3,9,'white'],[4,3,'white'],[3,4,'black'],[4,4,'white'],[5,3,'black'],[8,9,'black'],[9,8,'white'],[8,8,'black'],[7,9,'white'],[9,4,'white'],[10,4,'black'],[8,4,'black'],[10,3,'white']];
let turn = 'black';
let moves = 42;
const used = new Set();
const occupied = new Set();
function svg(type, attrs) {
  const node = document.createElementNS(ns, type);
  for (const [key,value] of Object.entries(attrs)) node.setAttribute(key,value);
  return node;
}
function stone(x,y,color) {
  occupied.add(`${x},${y}`);
  board.append(svg('circle',{cx:32+x*38,cy:32+y*38,r:16,fill:color==='black'?'#352e29':'#fffaf0',stroke:'#615141','stroke-width':1,'pointer-events':'none'}));
}
function render() {
  for (const player of document.querySelectorAll('.player')) {
    player.classList.toggle('active',player.dataset.color===turn);
    player.querySelector('.skill').disabled = used.has(player.dataset.color);
  }
  const action = document.querySelector('#main-skill');
  action.textContent = document.querySelector(`[data-color=${turn}] .skill`).textContent;
  action.disabled = used.has(turn);
  document.querySelector('#move-count').textContent = moves;
}
function pass() { turn = turn==='black'?'white':'black'; moves++; render(); }
function use(color) { used.add(color); render(); }
function reset() {
  turn='black'; moves=42; used.clear(); occupied.clear(); board.replaceChildren();
  for(let i=0;i<13;i++) {
    const p=32+i*38;
    board.append(svg('path',{d:`M32 ${p}H488 M${p} 32V488`,stroke:'#796248','stroke-width':1,fill:'none'}));
  }
  for(const x of [3,6,9]) for(const y of [3,6,9]) board.append(svg('circle',{cx:32+x*38,cy:32+y*38,r:3,fill:'#665139'}));
  for(const [x,y,color] of seed) stone(x,y,color);
  for(let y=0;y<13;y++) for(let x=0;x<13;x++) {
    const hit=svg('circle',{cx:32+x*38,cy:32+y*38,r:18,fill:'transparent',role:'button',tabindex:occupied.has(`${x},${y}`)?-1:0,'aria-label':`${x+1}列${y+1}行`});
    const place=()=>{if(occupied.has(`${x},${y}`))return;stone(x,y,turn);hit.setAttribute('tabindex',-1);pass();};
    hit.addEventListener('click',place);
    hit.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();place();}});
    board.append(hit);
  }
  render();
}
for(const player of document.querySelectorAll('.player')) player.querySelector('.skill').addEventListener('click',()=>use(player.dataset.color));
document.querySelector('#main-skill').addEventListener('click',()=>use(turn));
document.querySelector('#pass').addEventListener('click',pass);
document.querySelector('#reset').addEventListener('click',reset);
reset();
