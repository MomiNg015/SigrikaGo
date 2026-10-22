import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/styles.css';
import './harness.css';
import './corners.css';
import { profile } from './fixtures.js';
import { CHARACTERS, characterListFromCatalog } from '../../../src/shared/characters.js';
import ResumeModal from '../../../src/modals/ResumeModal.jsx';
import { UserProfileCard } from '../../../src/modals/UserProfileCard.jsx';
import { ModalDialog } from '../../../src/modals/modalComponents.jsx';

const params = new URLSearchParams(location.search);
const variant = ['orbit', 'facets', 'coordinate'].includes(params.get('v')) ? params.get('v') : 'baseline';
const context = params.get('context') === 'social' ? 'social' : 'self';
function Sample() {
  const [open, setOpen] = useState(true);
  const [aux, setAux] = useState('');
  const [user] = useState(() => profile());
  const localAction = async () => {};
  return <main id="surface-root" className="app-shell player-theme-enabled theme-bright-school" data-corner={variant} data-texture={params.get('texture') === 'off' ? 'off' : 'on'}>
    {!open && <button className="sample-reopen" onClick={() => setOpen(true)}>重新打开{context === 'self' ? '履历' : '详细资料'}</button>}
    {open && (context === 'self'
      ? <ResumeModal user={user} token="local-corner-sample" characterListView={characterListFromCatalog(CHARACTERS)} onClose={() => setOpen(false)} onOpenAchievements={() => setAux('成就')} onOpenPersonalization={() => setAux('个性化')} onOpenReplay={() => setAux('对局回放')} />
      : <div className="modal-backdrop profile-modal-backdrop"><UserProfileCard titleStickers user={user} characters={CHARACTERS} token="local-corner-sample" onClose={() => setOpen(false)} onAddFriend={localAction} onRemoveFriend={localAction} onAddBlacklist={localAction} onRemoveBlacklist={localAction} onOpenReplay={() => setAux('对局回放')} /></div>)}
    {aux && <div className="modal-backdrop"><ModalDialog className="small-modal sample-aux" ariaLabel={aux} onClose={() => setAux('')}><h2>{aux}</h2><p>此入口仅演示窗口打开与返回。纹理样板使用本地示例数据。</p><button onClick={() => setAux('')}>返回</button></ModalDialog></div>}
  </main>;
}
createRoot(document.getElementById('root')).render(<Sample />);
