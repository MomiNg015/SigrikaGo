import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import WindowBookmarkTabs from '../../../src/modals/WindowBookmarkTabs.jsx';

const MODE_LABELS = { '星炬对弈': '星炬', '标准对弈': '标准', '玩些别的': '其它' };

// Sample-only adapter: existing profile components still own mode data and clicks.
// Reuse Settings' real bookmark component without changing production components.
export default function BookmarkPreview() {
  const anchor = useRef(null);
  const [model, setModel] = useState(null);
  useLayoutEffect(() => {
    const stage = anchor.current.closest('.preview-stage');
    let currentHost;
    const sync = () => {
      const host = stage.querySelector('.profile-folder-modal');
      if (currentHost !== host) currentHost?.classList.remove('window-bookmark-host');
      currentHost = host;
      if (!host) { setModel(null); return; }
      host.classList.add('window-bookmark-host');
      const tabs = [...host.querySelectorAll('.profile-folder-tabs > button')].map(button => ({
        button, label: MODE_LABELS[button.textContent] ?? button.textContent, selected: button.getAttribute('aria-selected') === 'true',
        pending: button.getAttribute('aria-disabled') === 'true', panel: button.getAttribute('aria-controls'),
      }));
      setModel(previous => previous?.host === host && previous.tabs.length === tabs.length
        && tabs.every((tab,i) => tab.button === previous.tabs[i].button && tab.selected === previous.tabs[i].selected
          && tab.pending === previous.tabs[i].pending) ? previous : { host, tabs });
    };
    const observer = new MutationObserver(sync);
    observer.observe(stage, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected','aria-disabled'] });
    sync();
    return () => { observer.disconnect(); currentHost?.classList.remove('window-bookmark-host'); };
  }, []);
  return <><span hidden ref={anchor}/>{model && createPortal(
    <WindowBookmarkTabs aria-label="玩法分类">{model.tabs.map(tab => <button key={tab.label}
      type="button" aria-selected={tab.selected} aria-disabled={tab.pending} aria-controls={tab.panel}
      onClick={() => { if (!tab.pending) tab.button.click(); }}>{tab.label}</button>)}</WindowBookmarkTabs>, model.host)}</>;
}
