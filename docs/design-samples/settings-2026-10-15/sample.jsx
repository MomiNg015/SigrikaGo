import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, Check, Info, Mic2, Music, Palette, Volume2, VolumeX, X } from 'lucide-react';
import SettingsModal from '../../../src/modals/SettingsModal.jsx';
import WindowTitleSticker from '../../../src/modals/WindowTitleSticker.jsx';
import { DEFAULT_AUDIO_SETTINGS } from '../../../src/audio/audioSettings.js';
import { DEFAULT_SITE_SETTINGS } from '../../../src/shared/siteSettings.js';
import { VISUAL_THEME_OPTIONS } from '../../../src/app/visualTheme.js';
import './style.css';

const requested = new URLSearchParams(location.search).get('view');
const view = ['list', 'mixer', 'folio', 'current'].includes(requested) ? requested : 'list';
if (view === 'current') await import('../../../src/styles.css');
const channels = [ ['master','主音量',Volume2], ['bgm','背景音乐',Music], ['sfx','提示声',Bell], ['voice','语音',Mic2] ];
const tabs = [ ['audio','音频',Volume2], ['theme','界面',Palette], ['about','关于',Info] ];

function Sample() {
  const [audio, setAudio] = useState(() => ({ ...DEFAULT_AUDIO_SETTINGS, muted: {} }));
  const [tab, setTab] = useState('audio');
  const [open, setOpen] = useState(true);
  const [notice, setNotice] = useState('');
  const [wide, setWide] = useState(() => matchMedia('(min-width: 641px)').matches);
  const dialogRef = useRef(null);
  const reopenRef = useRef(null);
  const close = () => setOpen(false);
  useEffect(() => {
    const media = matchMedia('(min-width: 641px)');
    const update = () => setWide(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (open) dialogRef.current?.focus({ preventScroll: true });
    else reopenRef.current?.focus();
  }, [open]);
  useEffect(() => {
    const element = dialogRef.current;
    function keys(event) {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
    if (event.key !== 'Tab') return;
    const focusable = [...event.currentTarget.querySelectorAll('button:not([disabled]),input,[tabindex="0"]')];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    element?.addEventListener('keydown', keys);
    return () => element?.removeEventListener('keydown', keys);
  }, [open]);
  function changeTab(next, focus = false) {
    setTab(next); setNotice('');
    if (focus) dialogRef.current?.querySelector(`#tab-${next}`)?.focus();
  }
  function tabKeys(event, index) {
    const offsets = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (Object.hasOwn(offsets, event.key)) { event.preventDefault(); changeTab(tabs[(index + offsets[event.key] + tabs.length) % tabs.length][0], true); }
    if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); changeTab(tabs[event.key === 'Home' ? 0 : tabs.length - 1][0], true); }
  }
  const silent = audio.muted.master || audio.master === 0;
  const content = <>
    <div className="study-tabs" role="tablist" aria-label="设置分类" aria-orientation={view === 'folio' && wide ? 'vertical' : 'horizontal'}>
      {tabs.map(([id,label,Icon],index) => <button type="button" role="tab" id={`tab-${id}`} aria-controls={`panel-${id}`} aria-selected={tab===id} tabIndex={tab===id?0:-1} key={id} onKeyDown={e=>tabKeys(e,index)} onClick={()=>changeTab(id)}><Icon size={18}/><span>{label}</span></button>)}
    </div>
    <div className="study-content" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0}>
      {tab === 'audio' && <>
        {view==='mixer' && <div className="radio-art"><img src="/assets/characters/bright-school-radio-player.png" alt=""/><span>{silent ? '静音' : '声音调节'}</span></div>}
        <div className="channels">{channels.map(([id,label,Icon])=>{
          const muted=Boolean(audio.muted[id]);
          return <div key={id} className={`channel channel-${id} ${muted?'is-muted':''}`}>
            <label htmlFor={`level-${id}`}><Icon size={20}/><span>{label}</span></label>
            <output htmlFor={`level-${id}`}><b>{audio[id]}</b><span>%</span></output>
            <input type="range" id={`level-${id}`} min="0" max="100" value={audio[id]} style={{'--level':`${audio[id]}%`}} onChange={e=>{const value=Number(e.target.value);setAudio(old=>({...old,[id]:value,muted:{...old.muted,[id]:false}}));setNotice('');}}/>
            <button type="button" className="mute" aria-label={`${label}${muted?'取消静音':'静音'}`} aria-pressed={muted} onClick={()=>{setAudio(old=>({...old,muted:{...old.muted,[id]:!old.muted[id]}}));setNotice('');}}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}<span>{muted?'已静音':'静音'}</span></button>
          </div>;
        })}</div>
        {silent && <p className="master-notice" role="status"><VolumeX size={16}/>主音量已静音</p>}
      </>}
      {tab === 'theme' && <div className="theme-list">{VISUAL_THEME_OPTIONS.map((theme,index)=><button type="button" className={`theme-option ${theme.available?'chosen':'future'}`} key={theme.id} aria-pressed={theme.available} onClick={()=>setNotice(theme.available?'正在使用此界面':'敬请期待~')}>
        <span className={`theme-swatch swatch-${index}`} aria-hidden="true"><i/><i/><i/></span><span className="theme-name">{theme.label}<small>{theme.available?'使用中':'敬请期待'}</small></span>{theme.available&&<Check size={20}/>}</button>)}</div>}
      {tab === 'about' && <div className="about-copy"><p>{DEFAULT_SITE_SETTINGS.aboutText}</p></div>}
      {notice && <p className="study-notice" role="status">{notice}</p>}
    </div>
  </>;
  if(view==='current') return <div className="app-shell player-theme-enabled theme-bright-school"><main className="study-current">{open?<SettingsModal audioSettings={audio} setAudioSettings={setAudio} onClose={close} onNotice={setNotice}/>:<button ref={reopenRef} type="button" onClick={()=>setOpen(true)}>重新打开设置</button>}{notice&&<p role="status">{notice}</p>}</main></div>;
  return <main className={`study-stage study-${view}`}>
    {open ? <section ref={dialogRef} className="study-window" role="dialog" aria-modal="true" aria-labelledby="study-title" tabIndex={-1}>
      <WindowTitleSticker titleKey="settings" id="study-title"/>
      <button type="button" className="study-close" aria-label="关闭设置" onClick={close}><X size={20}/></button>
      <div className="study-layout">{content}</div>
    </section>:<button className="study-reopen" ref={reopenRef} type="button" onClick={()=>setOpen(true)}>重新打开设置</button>}
  </main>;
}
const root=createRoot(document.getElementById('root'));root.render(<Sample/>);
if(import.meta.hot) import.meta.hot.dispose(()=>root.unmount());
