import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/styles.css';
import './base.css';
import './warm.css';
import './warm-bookmarks.css';
import './file.css';
import './badge.css';
import './picker.css';
import { demoSettings, profile } from './mock.js';
import { CHARACTERS, characterListFromCatalog } from '../../../src/shared/characters.js';
import { UserProfileCard } from '../../../src/modals/UserProfileCard.jsx';
import ResumeModal from '../../../src/modals/ResumeModal.jsx';
import { ModalDialog } from '../../../src/modals/modalComponents.jsx';
import { Award, Palette, X } from 'lucide-react';

const directions = [
  { id: 'warm', name: '暖纸手账', detail: '左侧书签 · 米白纸卡 · 实色操作按钮', note: '模式移到左侧，操作颜色表达不同用途。' },
  { id: 'file', name: '社团档案', detail: '白色索引卡 · 叠纸阴影 · 方形工具键', note: '区域边界最清楚，档案感更强。' },
  { id: 'badge', name: '徽章面板', detail: '彩色实心面板 · 厚描边 · 凸起按键', note: '游戏感更强，边框和阴影也更醒目。' },
];
const params = new URLSearchParams(location.search);
function Demo({ context, empty }) {
  const [open, setOpen] = useState(true);
  const [aux, setAux] = useState('');
  const [portrait, setPortrait] = useState('denia');
  const [user] = useState(() => profile('spark', empty));
  const action = async () => {};
  const choosePortrait = id => {
    localStorage.setItem(`sigrika-match-characters:${user.id}`, JSON.stringify({ regular: [id] }));
    setPortrait(id);
  };
  return <div className="preview-stage">
    {!open ? <button className="reopen" onClick={() => setOpen(true)}>重新打开{context === 'self' ? '履历' : '详细信息'}</button>
      : context === 'self' ? <ResumeModal user={{ ...user, selectedCharacter: portrait }} token="local-sample"
        characterListView={characterListFromCatalog(CHARACTERS)} onClose={() => setOpen(false)}
        onOpenAchievements={() => setAux('成就')} onOpenPersonalization={() => setAux('个性化')}
        onOpenReplay={() => setAux('对局回放')} />
        : <div className="modal-backdrop profile-modal-backdrop sample-main-backdrop"><UserProfileCard titleStickers
          user={user} characters={CHARACTERS} token="local-sample" onClose={() => setOpen(false)}
          onAddFriend={action} onRemoveFriend={action} onAddBlacklist={action} onRemoveBlacklist={action}
          onOpenReplay={() => setAux('对局回放')} /></div>}
    {aux && <div className="modal-backdrop"><ModalDialog className="small-modal sample-aux" ariaLabel={aux} onClose={() => setAux('')}>
      <button className="close-button" aria-label="关闭样板面板" onClick={() => setAux('')}><X size={20}/></button>
      <h2>{aux === '成就' ? <Award/> : <Palette/>}{aux}</h2>
      {aux === '个性化' ? <><p>选择样板头像</p><div className="sample-portrait-options">{['denia','sigrika','aemeath'].map(id => <button key={id} aria-pressed={portrait === id} onClick={() => choosePortrait(id)}><img src={`/assets/characters/handbook-chibi-sprites/${id}-avatar.webp`} alt=""/>{CHARACTERS[id].name}</button>)}</div></>
        : <><p>已解锁 · 初入棋社</p><p>完成第一场对局，留下你的第一枚棋子。</p></>}
      <button onClick={() => setAux('')}>完成</button>
    </ModalDialog></div>}
  </div>;
}
function App() {
  const [variant, setVariant] = useState(Math.max(0, Math.min(2, (Number(params.get('v')) || 1) - 1)));
  const [context, setContext] = useState(params.get('context') === 'self' ? 'self' : 'social');
  const [empty, setEmpty] = useState(params.has('empty'));
  const [nonce, setNonce] = useState(0);
  const picker = useRef(null);
  const change = i => { setVariant(i); setNonce(n => n+1); };
  useEffect(() => {
    const url = new URL(location); url.searchParams.set('v', variant+1); url.searchParams.set('context', context);
    if (empty) url.searchParams.set('empty', '1'); else url.searchParams.delete('empty');
    history.replaceState(null, '', url);
  }, [variant,context,empty]);
  useLayoutEffect(() => {
    const nav = picker.current;
    const move = () => { const b = nav.querySelector('[data-active]'); const h = nav.querySelector('.proto-picker-highlight'); h.style.width = `${b.offsetWidth}px`; h.style.transform = `translateX(${b.offsetLeft}px)`; };
    move(); window.addEventListener('resize',move);
    requestAnimationFrame(() => requestAnimationFrame(() => nav.setAttribute('data-ready','')));
    return () => window.removeEventListener('resize', move);
  }, [variant]);
  useEffect(() => {
    const key = e => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
      // Mode tabs retain their own arrow navigation.
      if (e.target.closest('[role="tablist"]')) return;
      if (['1','2','3'].includes(e.key)) change(Number(e.key)-1);
      else if (e.key === 'ArrowRight') change((variant+1)%3);
      else if (e.key === 'ArrowLeft') change((variant+2)%3);
      else if (e.key.toLowerCase() === 'r') setNonce(n=>n+1);
    };
    document.addEventListener('keydown',key); return () => document.removeEventListener('keydown',key);
  }, [variant]);
  const d = directions[variant];
  return <>
    <header className="sample-toolbar">
      <div><strong>{variant+1} / {d.name}</strong><span>{d.detail}</span><small>{d.note}</small></div>
      <div className="sample-controls"><div role="group" aria-label="样板窗口"><button aria-pressed={context==='self'} onClick={()=>setContext('self')}>我的履历</button><button aria-pressed={context==='social'} onClick={()=>setContext('social')}>他人详情</button></div><label><input type="checkbox" checked={empty} onChange={e=>{demoSettings.empty=e.target.checked;setEmpty(e.target.checked);}}/>空数据</label><small>演示数据 · 操作仅在样板内生效</small></div>
    </header>
    <main id="profile-samples" className={`app-shell player-theme-enabled theme-bright-school variant-${d.id}`}>
      <Demo key={`${variant}-${context}-${empty}-${nonce}`} context={context} empty={empty}/>
    </main>
    <nav ref={picker} className="proto-picker" aria-label="Prototype variants"><span className="proto-picker-highlight" aria-hidden="true"/>{directions.map((d,i)=><button key={d.id} className="proto-picker-item" data-active={i===variant ? '' : undefined} aria-current={i===variant ? 'true' : undefined} onClick={()=>change(i)}>{d.name}</button>)}</nav>
  </>;
}
createRoot(document.getElementById('root')).render(<App/>);
