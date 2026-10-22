import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import WatchModal from '../../../src/modals/WatchModal.jsx';
import { CHARACTERS } from '../../../src/shared/characters.js';
import { rooms } from '../watch-mobile-2026-10-13/fixtures.js';
import { usePreviewRows } from './usePreviewRows.js';
import '../../../src/styles.css';
import './sample.css';

const params = new URLSearchParams(location.search);
const previewToken = 'watch-paper-local-preview';
const nativeFetch = window.fetch.bind(window);

// Only this page receives fictional rooms. No account data or real room is used.
window.fetch = async (input, options) => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.href);
  if (!url.pathname.startsWith('/api/')) return nativeFetch(input, options);
  const headers = new Headers(options?.headers ?? (input instanceof Request ? input.headers : undefined));
  if (url.pathname !== '/api/rooms/watch' || url.search !== '?mode=all'
      || headers.get('Authorization') !== `Bearer ${previewToken}`) {
    throw new Error('样板不连接真实接口');
  }
  await new Promise(resolve => setTimeout(resolve, 280));
  return Response.json(params.has('error') ? { error: '示例：列表暂时无法刷新，请稍后重试。' } : { rooms }, {
    status: params.has('error') ? 503 : 200
  });
};

function Sample() {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState('');
  const rootRef = useRef(null);
  usePreviewRows(rootRef, open && !params.has('current'));
  return <div ref={rootRef} className={`app-shell player-theme-enabled theme-bright-school wp-scene${params.has('current') ? '' : ' wp-preview'}`}>
    {open ? <WatchModal token={previewToken} characters={CHARACTERS}
      onJoinRoom={setSelected} onClose={() => setOpen(false)}/>
      : <div className="wp-demo-result">
        {selected && <p role="status">观战入口预览 · 房间 {selected}</p>}
        <button type="button" onClick={() => { setSelected(''); setOpen(true); }}>重新打开观战窗口</button>
      </div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<Sample/>);
