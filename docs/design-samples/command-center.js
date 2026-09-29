const iconPaths = {
  mail:'M3 5h18v14H3z M3 6l9 7 9-7',
  notice:'M5 10v5h4l9 5V4l-9 6H5 M8 15l2 6h3l-2-5',
  settings:'m9 3-1 3-3 1v4l-2 2 2 2v4l4 1 2 2 3-2 4-1v-4l2-2-2-2V7l-4-1-1-3Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  practice:'M4 5h16v14H4z M8 9h8v6H8z M9 1v4 M15 1v4 M9 19v4 M15 19v4 M1 9h3 M1 15h3 M20 9h3 M20 15h3',
  room:'M3 20V8l9-5 9 5v12H3 M9 20v-7h6v7 M3 8l9 5 9-5',
  members:'M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3Z M12 6v16 M6 8h3 M15 8h3 M6 12h3 M15 12h3',
  shop:'M3 9l3-6h12l3 6 M3 9h18v4l-3 2-3-2-3 2-3-2-3 2-3-2V9 M5 15v6h14v-6 M10 21v-5h4v5',
  inventory:'m3 7 9-5 9 5v11l-9 5-9-5Z M3 7l9 5 9-5 M12 12v11 M7 5l9 5v5',
  recruit:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z M19 2v4 M17 4h4',
  ranking:'M3 21h18 M5 17V9h4v8 M10 17V3h4v14 M15 17v-6h4v6',
  watch:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  friends:'M9 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6 M2 21v-4a7 7 0 0 1 14 0v4 M17 4a3 3 0 0 1 0 6 M19 14a5 5 0 0 1 3 5v2'
};
document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPaths[el.dataset.icon]}"/></svg>`;});
const dialog = document.querySelector('#panel');
const body = document.querySelector('#panel-content');
const room = document.querySelector('.command-room');
const characters = [{id:'sigrika',name:'西格莉卡'},{id:'aemeath',name:'爱弥斯'},{id:'mornye',name:'莫宁'},{id:'lynae',name:'琳奈'}];
let activeCharacter = characters[0];
let toastTimer;
function toast(text){const el=document.querySelector('#toast');clearTimeout(toastTimer);el.textContent=text;el.hidden=false;toastTimer=setTimeout(()=>{el.hidden=true;},3200);}
function choices(entries,action){return entries.map(([name,description])=>`<button class="choice" data-${action}="${name}"><span><strong>${name}</strong><small>${description}</small></span><b>↗</b></button>`).join('');}
function showPanel(key){
 const panels={
   match:['对弈部署',choices([['星炬','角色技能对弈 / 13 路棋盘'],['标准','经典围棋对弈'],['五子棋','连成五子，赢得对局']],'mode')],
   practice:['准时宝陪练',choices([['入门','熟悉落子与棋盘'],['中级','练习布局与攻防'],['高级','挑战更强的对手']],'practice')],
   room:['好友对弈',choices([['创建房间','样板展示，不会实际创建房间'],['加入房间','预览房间号输入']],'room')],
   members:['部员手册',`<div class="character-options">${characters.map(c=>`<button data-character="${c.id}" aria-pressed="${c.id===activeCharacter.id}"><img src="../../public/assets/characters/portraits/${c.id}.webp" alt="${c.name}"><strong>${c.name}</strong></button>`).join('')}</div><p class="panel-copy">选择部员可更新大厅的出战角色。</p>`],
   profile:['我的履历',`<div class="profile-detail"><img src="../../public/assets/characters/portraits/${activeCharacter.id}.webp" alt="${activeCharacter.name}"><div><h3>木漏れ日</h3><p>三段 / 1,286 积分<br>当前出战：${activeCharacter.name}<br>128 场对局 / 62.5% 胜率</p></div></div>`],
   settings:['界面切换',`<button class="choice" data-theme="campus"><span><strong>明亮校园</strong><small>手绘校园 · 现有界面</small></span><b>01</b></button><button class="choice selected" data-theme="command" aria-pressed="true"><span><strong>星炬科技</strong><small>作战指挥室 · 当前预览</small></span><b>02 ✓</b></button><p class="panel-copy">这里仅预览第二项科技主题，不修改正式设置。</p>`],
   notice:['学院通讯','<p class="panel-copy">新的对局，已准备就绪。<br>这是一张作战指挥室主界面样板，可体验模式选择、部员切换与窗口外观。</p>'],
   mail:['邮箱','<p class="panel-copy">暂无邮件。此处展示科技主题的窗口外壳。</p>']
 };
 const labels={shop:'商店',inventory:'仓库',recruit:'部员招募',ranking:'排行榜',watch:'观战',friends:'好友'};
 const panel=panels[key]||[labels[key],'<p class="panel-copy">本轮先确认作战指挥室的主界面方向。此入口展示窗口外观，内容页尚未扩展。</p>'];
 document.querySelector('#panel-title').textContent=panel[0];body.innerHTML=panel[1];if(!dialog.open)dialog.showModal();
}
function cleanView(){const clean=room.classList.toggle('clean');document.querySelector('.restore').hidden=!clean;if(clean)document.querySelector('.restore').focus();else document.querySelector('#clean-view').focus();}
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.panel)showPanel(button.dataset.panel);
 if(button.dataset.character){activeCharacter=characters.find(c=>c.id===button.dataset.character);document.querySelector('.avatar-shell img').src=`../../public/assets/characters/portraits/${activeCharacter.id}.webp`;document.querySelector('.avatar-shell img').alt=activeCharacter.name;document.querySelector('.identity-bottom>span').innerHTML=`<i></i>${activeCharacter.name} · 出战中`;showPanel('members');toast(`样板出战角色已更换为${activeCharacter.name}`);}
 if(button.dataset.mode||button.dataset.practice){const label=button.dataset.mode||`${button.dataset.practice}陪练`;body.innerHTML=`<div class="match-status"><svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 4 71 22v36L40 76 9 58V22Z M40 15v50 M15 40h50 M26 26l28 28 M54 26 26 54"/></svg><h3>${label}</h3><p>部署界面预览已打开。<br>当前为视觉样板，没有发起真实匹配。</p><button data-panel="match">返回模式选择</button></div>`;}
 if(button.dataset.room){if(button.dataset.room==='加入房间'){body.innerHTML='<form id="room-form"><label for="room-code">房间号</label><input id="room-code" name="code" inputmode="numeric" pattern="[0-9]{4,8}" maxlength="8" required placeholder="输入 4–8 位数字" style="display:block;width:100%;padding:15px;margin:15px 0;background:#091a28;border:1px solid #6eabb0;color:#eef8fa;font:inherit"><button class="choice" type="submit">预览加入</button></form>';}else toast('这是创建房间的视觉预览，没有创建真实房间。');}
 if(button.dataset.theme==='campus')window.location.href='campus-refresh.html';
 if(button.dataset.theme==='command'){dialog.close();toast('当前已是作战指挥室样板');}
});
document.addEventListener('submit',event=>{if(event.target.id==='room-form'){event.preventDefault();toast('房间号格式有效；样板不会连接真实房间。');}});
document.querySelector('#close-panel').addEventListener('click',()=>dialog.close());
document.querySelector('#clean-view').addEventListener('click',cleanView);
document.querySelector('.restore').addEventListener('click',cleanView);
document.addEventListener('keydown',event=>{if(event.key.toLowerCase()==='h'&&!dialog.open&&!['INPUT','TEXTAREA'].includes(event.target.tagName)){event.preventDefault();cleanView();}});
document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();toast('当前位于作战指挥室大厅');});
