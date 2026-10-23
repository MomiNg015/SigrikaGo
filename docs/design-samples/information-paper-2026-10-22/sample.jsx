import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './fixtures.js';
import '../../../src/styles.css';
import AnnouncementModal from '../../../src/modals/AnnouncementModal.jsx';
import MailboxModal from '../../../src/modals/MailboxModal.jsx';
import './harness.css';

const params = new URLSearchParams(location.search);
const production = location.pathname.endsWith('/production.html') || params.get('view') === 'production';
const original = production || params.get('view') === 'original';
const windowName = params.get('window') === 'mailbox' ? 'mailbox' : 'announcement';
if (!original) await import('./paper.css');
const fitPaperLists = original ? null : (await import('./fit-paper-lists.js')).fitPaperLists;

function Sample() {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [unread, setUnread] = useState({ announcement: 3, changelog: 1 });
  useEffect(() => { setOpen(true); }, []);
  useEffect(() => original ? undefined : fitPaperLists(document.querySelector('#information-paper-sample')), [open]);
  useEffect(() => {
    if (!notice) return undefined;
    const timeout = setTimeout(() => setNotice(''), 2400);
    return () => clearTimeout(timeout);
  }, [notice]);
  const props = { token: 'local-paper-preview', onClose: () => setOpen(false), onNotice: setNotice };
  return <main id={original ? 'information-production' : 'information-paper-sample'} className="app-shell player-theme-enabled theme-bright-school information-preview">
    {!open && <div className="sample-closed"><p>窗口已关闭</p><button onClick={() => setOpen(true)}>重新打开{windowName === 'mailbox' ? '邮箱' : '公告'}</button></div>}
    {open && (windowName === 'mailbox' ? <MailboxModal {...props} /> : <AnnouncementModal {...props} unreadByKind={unread} onSummaryChange={summary => summary?.unreadByKind && setUnread(summary.unreadByKind)} />)}
    {notice && <div className="sample-notice" role="status">{notice}</div>}
  </main>;
}

createRoot(document.getElementById('root')).render(<Sample />);
