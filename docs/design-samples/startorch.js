const content = document.querySelector('#content');
const modal = document.querySelector('#modal');
const asset = '../../public/assets/characters/portraits/';
const people = [{id:'sigrika',name:'西格莉卡'},{id:'aemeath',name:'爱弥斯'},{id:'mornye',name:'莫宁'},{id:'lynae',name:'琳奈'}];
const notes = {day:'白昼学院 / 陶瓷白 · 学院绿',night:'深空终端 / 深蓝黑 · 荧光青',orbit:'轨道观测站 / 银灰 · 轨道蓝'};
let page = 'home';
let member = people[0];
let selected = people[0];
let turn = 0;
let toastTimer;
const stones = new Map();
const initial = [[3,3],[9,9],[9,3],[3,9],[4,3],[4,4],[5,4],[5,5],[6,4],[6,5],[7,5],[7,6]];
function resetBoard(){stones.clear();initial.forEach(([x,y],i)=>stones.set(y*13+x,i%2?'white':'black'));turn=0;}
resetBoard();
function portrait(person, cls=''){return `<img class="${cls}" src="${asset}${person.id}.webp" alt="${person.name}">`;}
function notify(message){const el=document.querySelector('#status');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true;},3200);}
function openModal(title,html){document.querySelector('#modal-title').textContent=title;document.querySelector('#modal-body').innerHTML=html;modal.showModal();}
function render(){
 document.querySelectorAll('.top [data-page]').forEach(button=>{if(button.dataset.page===page)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
 document.querySelector('#direction-note').textContent=notes[document.body.dataset.direction];
 if(page==='home')content.innerHTML=`<div class="lobby"><aside class="identity">${portrait(selected,'avatar')}<small>围棋部 · 部员档案</small><h2>木漏れ日</h2><p class="muted">${selected.name} · 出战中</p><div class="id-line"></div><dl><div><dt>当前段位</dt><dd>三段</dd></div><div><dt>积分</dt><dd>1,286</dd></div></dl><button data-action="profile">查看履历 ↗</button></aside><section class="stage">${portrait(selected,'hero')}<div class="stage-copy"><small>STARTORCH ACADEMY</small><h1>星炬对弈</h1><p>落子之间，寻找下一种可能。</p><button class="primary" data-action="match">开始对弈 <span>↗</span></button></div></section><aside class="side"><button data-page="members"><span class="index">◇</span><b>部员手册 ↗</b><small>角色与出战配置</small></button><button data-action="practice"><span class="index">＋</span><b>准时宝陪练 ↗</b><small>从容练习，慢慢进步</small></button><button data-action="room"><span class="index">⌁</span><b>好友对弈 ↗</b><small>创建房间 · 邀请好友</small></button></aside></div><nav class="dock" aria-label="功能入口">${[['◇','商店'],['▣','仓库'],['✧','招募'],['▥','排行榜'],['◎','观战'],['♧','好友']].map(([icon,label])=>`<button data-demo="${label}"><span>${icon}</span>${label}</button>`).join('')}</nav>`;
 if(page==='battle')content.innerHTML=`<div class="page-heading"><div><h1>星炬对弈</h1><p>13 路 · 常规匹配 · 棋盘交互样板</p></div><button data-page="home">返回大厅</button></div><div class="battle"><aside class="player-panel">${portrait(people[1])}<h2>爱弥斯</h2><p>对手 · 白方</p><div class="clock">08:42</div><p>提子 02</p></aside><section class="board-wrap"><div class="board" aria-label="13 路演示棋盘">${Array.from({length:169},(_,i)=>`<button class="point ${stones.get(i)||''}" data-point="${i}" aria-label="第 ${Math.floor(i/13)+1} 行，第 ${i%13+1} 列${stones.has(i)?'，已有棋子':''}"></button>`).join('')}</div><div class="board-meta"><span id="turn-label">${turn%2?'白':'黑'}方落子 · 第 ${13+turn} 手</span><button data-action="reset">重置棋盘</button></div></section><aside class="player-panel">${portrait(selected)}<h2>${selected.name}</h2><p>木漏れ日 · 黑方</p><div class="clock">09:15</div><p>提子 01</p><button class="primary" data-action="skill">角色技能</button><p>样板棋钟静止，落子仅作视觉演示。</p></aside></div>`;
 if(page==='members')content.innerHTML=`<div class="page-heading"><div><h1>部员手册</h1><p>角色档案与出战选择</p></div><button data-page="home">返回大厅</button></div><div class="roster"><nav class="member-list" aria-label="选择角色">${people.map(p=>`<button data-member="${p.id}" aria-pressed="${p.id===member.id}">${portrait(p)}<span>${p.name}</span></button>`).join('')}</nav><div class="member-art">${portrait(member)}</div><section class="member-info"><small>星炬学园 · 部员档案</small><h1>${member.name}</h1><p>在棋盘上与伙伴并肩作战。选择部员，查看这套界面下的立绘与出战状态。</p><button class="primary" data-action="select">${selected.id===member.id?'当前出战':'设为出战'}</button><div class="rule"><h3>角色技能</h3><p>正式接入时沿用当前角色技能与次数信息。本样板先展示档案层级和角色选择效果。</p></div></section></div>`;
 if(page==='settings')content.innerHTML=`<section class="appearance"><h1>界面切换</h1><p class="muted" style="margin-top:14px">科技风放在第二项；上方可切换三种设计方向。</p><div class="theme-choices"><button class="theme-choice" data-action="campus"><div class="swatch">明亮校园</div><h3>明亮校园</h3><p>现有的手绘围棋部风格 ↗</p></button><button class="theme-choice selected" data-action="tech" aria-pressed="true"><div class="swatch tech">✳ / STARTORCH</div><h3>星炬科技 ✓</h3><p>${notes[document.body.dataset.direction]}</p></button></div><p class="muted">此处仅预览界面选项，不写入正式主题设置。</p></section>`;
}
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.direction){document.body.dataset.direction=button.dataset.direction;document.querySelectorAll('.preview button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();}
 if(button.dataset.page){page=button.dataset.page;render();}
 if(button.dataset.member){member=people.find(p=>p.id===button.dataset.member);render();}
 if(button.dataset.point!==undefined){const i=Number(button.dataset.point);if(stones.has(i)){notify('这个位置已有棋子');return;}const color=turn%2?'white':'black';stones.set(i,color);turn++;button.classList.add(color);button.setAttribute('aria-label',`${button.getAttribute('aria-label')}，已有棋子`);document.querySelector('#turn-label').textContent=`${turn%2?'白':'黑'}方落子 · 第 ${13+turn} 手`;}
 if(button.dataset.demo)openModal(button.dataset.demo,`<p>这是「${button.dataset.demo}」窗口的科技风外壳预览。本轮重点展示大厅、对弈、部员手册和界面切换，暂不模拟这里的业务操作。</p>`);
 const action=button.dataset.action;
 if(action==='match')openModal('选择对弈模式',['星炬','标准','五子棋'].map(name=>`<button data-mode="${name}">${name} <span style="float:right">↗</span></button>`).join(''));
 if(button.dataset.mode){modal.close();if(button.dataset.mode==='星炬'){page='battle';render();}else notify(`${button.dataset.mode}模式已选择；本轮仅提供星炬棋盘样板。`);}
 if(action==='practice')openModal('准时宝陪练',['入门','中级','高级'].map(name=>`<button data-practice="${name}">${name}</button>`).join(''));
 if(button.dataset.practice){modal.close();page='battle';render();notify(`已打开${button.dataset.practice}陪练视觉样板，没有启动真实 AI。`);}
 if(action==='room')openModal('好友对弈','<p>房间入口外观预览。此样板没有连接服务器，不会创建真实房间。</p><button data-page="battle" data-action="close-modal">预览对弈界面</button>');
 if(action==='profile')openModal('我的履历',`<div style="display:flex;gap:20px;align-items:center">${portrait(selected,'avatar')}<div><h3>木漏れ日</h3><p>三段 · 1,286 积分<br>出战部员：${selected.name}</p></div></div><p>演示记录：总对局 128 / 胜率 62.5%</p>`);
 if(action==='select'){selected=member;render();notify(`已在样板中设为出战：${selected.name}`);}
 if(action==='reset'){resetBoard();render();notify('棋盘已重置');}
 if(action==='skill')openModal('角色技能','<p>科技风技能信息窗样板。正式版本将沿用现有技能规则、剩余次数与目标选择流程。</p>');
 if(action==='campus')window.location.href='campus-refresh.html';
 if(action==='tech'){page='home';render();notify('正在预览星炬科技界面');}
 if(action==='close-modal')modal.close();
});
document.querySelector('#close').addEventListener('click',()=>modal.close());
document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();page='home';render();});
render();
