import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, X, MoreHorizontal, ChevronRight, Swords, Check, UserRound } from 'lucide-react';
import FriendsList from '../../../src/modals/friends/FriendsList.jsx';
import FriendsToolbar from './baseline-toolbar.jsx';
import WindowTitleSticker from '../../../src/modals/WindowTitleSticker.jsx';
import { CHARACTERS } from '../../../src/shared/characters.js';
import { modeOrderedEntries } from '../../../src/shared/gameModes.js';
import './sample.css';

const initialFriends = [
  { id: 'xiaoman', username: '小满', characterId: 'sigrika', status: 'online' },
  { id: 'wanfeng', username: '晚风', characterId: 'denia', status: 'online' },
  { id: 'qiu', username: '秋日来信', characterId: 'qiuyuan', status: 'playing' },
  { id: 'lynae', username: '沿着星轨去旅行', characterId: 'lynae', status: 'online' },
  { id: 'chisa', username: '千咲', characterId: 'chisa', status: 'offline' },
  { id: 'mornye', username: '午后的白日梦', characterId: 'mornye', status: 'offline' },
  { id: 'aemeath', username: '远航星', characterId: 'aemeath', status: 'offline' }
];
const initialBlacklist = [{ id: 'guest', username: '陌生棋手', characterId: 'nabomo', status: 'offline' }];
const searchable = [...initialFriends, ...initialBlacklist, { id: 'changli', username: '长离', characterId: 'changli', status: 'online' }];
const statusText = { online: '在线', playing: '对局中', offline: '离线' };
const variant = new URLSearchParams(location.search).get('variant') || 'roster';
const portrait = (user, full = false) => `/assets/characters/handbook-chibi-sprites/${user.characterId}${full ? '' : '-avatar'}.webp`;

function Status({ user }) {
  return <span className={`study-status ${user.status}`}><i />{statusText[user.status]}</span>;
}
function Avatar({ user, full = false }) {
  return <img className={full ? 'study-full-portrait' : 'study-avatar'} src={portrait(user, full)} alt={CHARACTERS[user.characterId]?.name || user.username} />;
}
function PreviewDialog({ children, title, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const active = document.activeElement;
    ref.current.showModal();
    return () => { if (active?.isConnected) active.focus(); };
  }, []);
  return <dialog ref={ref} className="study-dialog" aria-labelledby="sample-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="study-dialog-top"><h2 id="sample-dialog-title">{title}</h2><button type="button" className="study-icon" aria-label="关闭对话框" onClick={onClose}><X size={20} /></button></div>
    {children}
  </dialog>;
}

function Sample() {
  const [tab, setTab] = useState('friends');
  const [friends, setFriends] = useState(initialFriends);
  const [blacklist, setBlacklist] = useState(initialBlacklist);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(initialFriends[0].id);
  const [menuId, setMenuId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState('');
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState('');
  const rows = tab === 'friends' ? friends : blacklist;
  const selected = rows.find(user => user.id === selectedId) || rows[0];
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  const switchTab = value => { setTab(value); setMenuId(null); };
  const openProfile = user => { setMenuId(null); setDialog({ type: 'profile', user }); };
  const requestDuel = user => { if (user.status === 'online') { setMenuId(null); setDialog({ type: 'duel', user }); } };
  const confirmRemoval = user => { setMenuId(null); setDialog({ type: 'remove', user, list: tab }); };
  function lookup() {
    const value = query.trim();
    if (value.length < 2) { setError('用户名需为 2–8 位'); return; }
    const user = searchable.find(item => item.username === value);
    if (!user) { setError('示例中没有这位用户，请试试「小满」或「长离」'); return; }
    setError(''); openProfile(user);
  }
  function remove() {
    if (dialog.list === 'friends') setFriends(list => list.filter(user => user.id !== dialog.user.id));
    else setBlacklist(list => list.filter(user => user.id !== dialog.user.id));
    setDialog(null); setToast('已在本地演示中解除关系');
  }
  function relationChange(type, user) {
    if (type === 'friend') {
      setFriends(list => list.some(item => item.id === user.id) ? list : [...list, user]);
      setBlacklist(list => list.filter(item => item.id !== user.id)); setTab('friends');
    } else {
      setBlacklist(list => list.some(item => item.id === user.id) ? list : [...list, user]);
      setFriends(list => list.filter(item => item.id !== user.id)); setTab('blacklist');
    }
    setDialog(null); setToast(type === 'friend' ? '已在本地演示中添加好友' : '已在本地演示中加入黑名单');
  }
  const detailsButton = user => <button type="button" className="study-secondary" onClick={() => openProfile(user)}>详细信息</button>;
  const duelButton = user => <button type="button" className="study-primary" disabled={user.status !== 'online'} title={user.status === 'online' ? '对局申请' : user.status === 'playing' ? '对方正在对局' : '对方暂不在线'} onClick={() => requestDuel(user)}><Swords size={16} /><span>对局申请</span></button>;
  const moreButton = user => <button type="button" className="study-icon study-more" aria-label={`${user.username}的更多操作`} aria-expanded={menuId === user.id} onClick={() => setMenuId(menuId === user.id ? null : user.id)}><MoreHorizontal size={21} /></button>;
  const menu = user => menuId === user.id && <div className="study-menu">{detailsButton(user)}<button type="button" className="study-danger" onClick={() => confirmRemoval(user)}>{tab === 'friends' ? '解除好友' : '从黑名单解除'}</button></div>;
  const search = <form className="study-search" onSubmit={event => { event.preventDefault(); lookup(); }}><Search size={18} /><input aria-label="搜索用户名" placeholder="输入用户名" value={query} maxLength={8} onChange={event => { setQuery(event.target.value); setError(''); }} /><button type="submit" aria-label="搜索用户"><ChevronRight size={20} /></button></form>;
  const nav = <nav className="study-tabs" aria-label="好友列表分类"><button type="button" aria-pressed={tab === 'friends'} onClick={() => switchTab('friends')}>好友</button><button type="button" aria-pressed={tab === 'blacklist'} onClick={() => switchTab('blacklist')}>黑名单</button></nav>;
  const empty = <div className="study-empty"><UserRound size={32} strokeWidth={1.25} /><p>{tab === 'friends' ? '暂无好友' : '暂无黑名单'}</p></div>;

  if (closed) return <div className="study-stage"><button type="button" className="study-reopen" onClick={() => setClosed(false)}>重新打开好友窗口</button></div>;
  return <>
    {variant === 'current' ? <div className="app-shell player-theme-enabled theme-bright-school study-current"><div className="modal-backdrop"><section className="friends-modal window-sticker-host window-bookmark-host">
      <button className="close-button friends-modal-close" type="button" aria-label="关闭好友窗口" onClick={() => setClosed(true)}><X size={20} /></button>
      <header className="friends-modal-header window-sticker-header"><WindowTitleSticker titleKey="friends" id="friends-modal-title" /></header>
      <FriendsToolbar activeTab={tab} searchUsername={query} onSearchInput={setQuery} onSearchSubmit={lookup} onTabChange={switchTab} />
      <FriendsList activeTab={tab} rows={rows} characters={CHARACTERS} loading={false} actionRow={rows.find(user => user.id === menuId)} onOpenProfile={openProfile} onRequestMatch={requestDuel} onOpenConfirm={(_, user) => confirmRemoval(user)} onToggleAction={user => setMenuId(menuId === user.id ? null : user.id)} />
    </section></div></div> : <main className={`study-stage direction-${variant}`}>
      <section className="study-window" aria-label="社交系统">
        <header className="study-header"><h1><img src="/assets/window-titles/friends.webp" alt="社交系统" /></h1><button type="button" className="study-icon study-close" aria-label="关闭好友窗口" onClick={() => setClosed(true)}><X size={20} /></button></header>
        <div className="study-toolbar">{nav}{search}</div>
        {error && <p role="alert" className="study-error">{error}</p>}
        {variant === 'roster' && <div className="study-roster">{rows.length ? rows.map(user => <article className={`roster-item ${user.status}`} key={user.id}>
          <div className="roster-content"><button type="button" className="study-person" onClick={() => openProfile(user)}><Avatar user={user} /><span className="study-identity"><strong>{user.username}</strong><Status user={user} /></span></button>
            <div className="roster-actions">{tab === 'friends' ? duelButton(user) : <button type="button" className="study-secondary" onClick={() => confirmRemoval(user)}>解除</button>}{moreButton(user)}</div></div>{menu(user)}
        </article>) : empty}</div>}
        {variant === 'cards' && <div className="study-cards">{rows.length ? rows.map(user => <article className={`club-card ${user.status}`} key={user.id}>
          <div className="card-top"><button type="button" className="study-person" onClick={() => openProfile(user)}><Avatar user={user} /><span className="study-identity"><strong>{user.username}</strong><Status user={user} /></span></button>{moreButton(user)}</div>
          <div className="card-actions">{detailsButton(user)}{tab === 'friends' ? duelButton(user) : <button type="button" className="study-secondary" onClick={() => confirmRemoval(user)}>从黑名单解除</button>}</div>{menu(user)}
        </article>) : empty}</div>}
        {variant === 'companion' && <div className="study-split"><div className="companion-roster">{rows.length ? rows.map(user => <button type="button" key={user.id} className={`companion-row ${selected?.id === user.id ? 'selected' : ''}`} aria-pressed={selected?.id === user.id} onClick={() => { setSelectedId(user.id); setMenuId(null); }}><Avatar user={user} /><span className="study-identity"><strong>{user.username}</strong><Status user={user} /></span><ChevronRight size={17} /></button>) : empty}</div>
          {selected && <aside className="companion-detail" aria-label={`${selected.username}的操作`}><div className="companion-art"><Avatar user={selected} full /></div><div className="companion-caption"><h2>{selected.username}</h2><Status user={selected} /></div><div className="companion-actions">{tab === 'friends' && duelButton(selected)}{detailsButton(selected)}<button type="button" className="study-danger" onClick={() => confirmRemoval(selected)}>{tab === 'friends' ? '解除好友' : '从黑名单解除'}</button></div></aside>}
        </div>}
      </section>
    </main>}
    {variant === 'current' && error && <p className="study-toast" role="alert">{error}</p>}
    {toast && <div className="study-toast" role="status"><Check size={17} />{toast}</div>}
    {dialog && <PreviewDialog title={dialog.type === 'profile' ? '详细信息' : dialog.type === 'duel' ? '选择对弈模式' : dialog.type === 'block' ? '加入黑名单' : dialog.list === 'friends' ? '解除好友' : '解除黑名单'} onClose={() => setDialog(null)}>
      {dialog.type === 'profile' && <><div className="dialog-profile"><Avatar user={dialog.user} /><div><h3>{dialog.user.username}</h3><Status user={dialog.user} /></div></div><p className="dialog-note">此处为资料入口演示；正式版沿用现有详细资料窗口。</p><div className="dialog-actions">{friends.some(user => user.id === dialog.user.id) ? duelButton(dialog.user) : <button type="button" className="study-primary" onClick={() => relationChange('friend', dialog.user)}>添加好友</button>}{!blacklist.some(user => user.id === dialog.user.id) && <button type="button" className="study-secondary" onClick={() => setDialog({ type: 'block', user: dialog.user })}>加入黑名单</button>}</div></>}
      {dialog.type === 'duel' && <><p className="dialog-note">向 {dialog.user.username} 发起对局申请</p><div className="duel-options">{modeOrderedEntries().map(mode => <button type="button" className="study-secondary" key={mode.id} onClick={() => { setDialog(null); setToast(`本地演示：已向${dialog.user.username}发送${mode.title}申请`); }}><Swords size={20} />{mode.title}<ChevronRight size={18} /></button>)}</div></>}
      {dialog.type === 'remove' && <><p className="dialog-note">确定{dialog.list === 'friends' ? '与' : '将'}「{dialog.user.username}」{dialog.list === 'friends' ? '解除好友关系' : '从黑名单解除'}？</p><div className="dialog-actions"><button type="button" className="study-secondary" onClick={() => setDialog(null)}>取消</button><button type="button" className="study-danger filled" onClick={remove}>确认解除</button></div></>}
      {dialog.type === 'block' && <><p className="dialog-note">将「{dialog.user.username}」加入黑名单？</p><div className="dialog-actions"><button type="button" className="study-secondary" onClick={() => setDialog(null)}>取消</button><button type="button" className="study-danger filled" onClick={() => relationChange('blacklist', dialog.user)}>确认加入</button></div></>}
    </PreviewDialog>}
  </>;
}
// Production CSS is only loaded for the actual-component baseline. It must not
// inject global input/button rules into the isolated exploratory designs.
function renderSample() { createRoot(document.getElementById('root')).render(<Sample />); }
if (variant === 'current') import('../../../src/styles.css').then(renderSample);
else renderSample();
