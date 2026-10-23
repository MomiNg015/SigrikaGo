import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { user as initialUser } from './fixtures.js';
import '../../../../src/styles.css';
import ShopModal from '../../../../src/modals/ShopModal.jsx';
import { DEFAULT_SITE_SETTINGS } from '../../../../src/shared/siteSettings.js';
import './harness.css';
import './materials.css';

const query = new URLSearchParams(location.search);
const allowed = ['original', 'velvet', 'ticket', 'enamel'];
const initialSkin = allowed.includes(query.get('skin')) ? query.get('skin') : 'velvet';
const line = query.get('state') === 'long' ? '你的心声像晨鸟一样热闹……是有什么，悄悄锁住你的目光了吗？不必着急，请慢慢挑选。' : '欢迎。请先随意看看，不必急着开口。';
const settings = { ...DEFAULT_SITE_SETTINGS, shopMascotDialogues: { zahira: { greetingLines: [line] }, nabomo: { greetingLines: ['今天想扮演谁呢？'] } } };

function Sample() {
  const [open, setOpen] = useState(false);
  const [skin, setSkin] = useState(initialSkin);
  const [user, setUser] = useState(initialUser);
  const [notice, setNotice] = useState('');
  useEffect(() => { setOpen(true); }, []);
  useEffect(() => {
    const receive = event => {
      if (event.origin !== location.origin || event.source !== window.parent) return;
      if (event.data?.type === 'shop-material-skin' && allowed.includes(event.data.skin)) setSkin(event.data.skin);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 2400);
    return () => clearTimeout(timer);
  }, [notice]);
  return <main id="shop-materials" data-skin={skin} className="app-shell player-theme-enabled theme-bright-school">
    {open ? <ShopModal token="local-material-preview" user={user} musicTracks={[]} siteSettings={settings} onPurchased={setUser} onNotice={setNotice} onClose={() => setOpen(false)} /> : <div className="sample-reopen"><button onClick={() => setOpen(true)}>重新打开商店</button></div>}
    {notice && <div className="sample-notice" role="status">{notice}</div>}
  </main>;
}
createRoot(document.getElementById('root')).render(<Sample />);
