import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, Check, Shirt, LockKeyhole, Music2, Pause, Play, Volume2, X, BookOpen, Sparkles } from 'lucide-react';
import { ModalDialog } from '../../../src/modals/modalComponents.jsx';
import { CharacterDetailDialog } from '../../../src/modals/house/HouseNestedDialogs.jsx';
import CharacterCostumeDialog, { orderCostumeCards } from '../../../src/modals/house/CharacterCostumeDialog.jsx';
import PortraitShowcase, { portraitShowcaseAspect } from '../../../src/shared/PortraitShowcase.jsx';
import SkillDescription from '../../../src/shared/SkillDescription.jsx';
import { derivedSkillDefinitionsFromSkill } from '../../../src/shared/derivedSkills.js';
import { DEFAULT_SKILL_TRAITS, formatSkillOverclock } from '../../../src/shared/skillTraits.js';
import { loadCachedPublicSkillTraitCatalog } from '../../../src/app/skillTraitCatalog.js';
import { DEFAULT_AUDIO_SETTINGS } from '../../../src/audio/audioSettings.js';
import catalog from './catalog.json';
import '../../../src/styles/base/skill-description.css';
import './style.css';

// Seed the shared catalog before mounting; no production API request is made.
await loadCachedPublicSkillTraitCatalog({ apiClient: async () => ({ traits: DEFAULT_SKILL_TRAITS }) });
const query = new URLSearchParams(location.search);
const view = ['dossier', 'stage', 'notebook', 'current'].includes(query.get('view')) ? query.get('view') : 'dossier';
const character = catalog.characters.find(c => c.id === query.get('character')) ?? catalog.characters.find(c => c.id === 'denia');
if (view === 'current') await import('../../../src/styles.css');
const initialOwned = catalog.costumes.filter(c => c.characterSlug === character.id).slice(0, 1).map(c => c.id);

function Sample() {
  const [open, setOpen] = useState(true);
  const [page, setPage] = useState('detail');
  const [chapter, setChapter] = useState('skill');
  const [equippedId, setEquippedId] = useState('default');
  const [selectedId, setSelectedId] = useState('default');
  const [notice, setNotice] = useState('');
  const [playing, setPlaying] = useState('');
  const audioRef = useRef(null);
  const audioIntent = useRef(0);
  const wardrobeTrigger = useRef(null);
  const user = { ownedCostumeIds: initialOwned, equippedCostumes: equippedId === 'default' ? {} : { [character.id]: catalog.costumes.find(c => c.id === equippedId) } };
  const cards = orderCostumeCards(character, catalog.costumes, user);
  const selected = cards.find(c => c.id === selectedId) ?? cards[0];
  const equipped = cards.find(c => c.id === equippedId) ?? cards[0];
  const aspect = portraitShowcaseAspect(cards.map(c => c.portraitUrl));
  const wardrobe = page === 'wardrobe';
  const owned = selected.isDefault || selected.owned;
  const skills = [character.skill, ...derivedSkillDefinitionsFromSkill(character.skill)];

  function stopAudio() {
    audioIntent.current += 1;
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying('');
  }
  useEffect(() => () => { audioIntent.current += 1; audioRef.current?.pause(); }, []);
  async function playAudio(kind) {
    const wasPlaying = playing === kind;
    stopAudio();
    if (wasPlaying) return;
    const intent = audioIntent.current;
    const src = kind === 'voice' ? `/assets/voice/${character.id}_sortie.ogg` : character.id === 'denia' ? '/assets/music/bgm_loop.ogg' : '/assets/music/sigrika_loop.ogg';
    const audio = new Audio(src);
    audio.volume = 0.35;
    audioRef.current = audio;
    setPlaying(`loading-${kind}`);
    audio.onended = () => { if (intent === audioIntent.current) setPlaying(''); };
    try { await audio.play(); if (intent === audioIntent.current) setPlaying(kind); else audio.pause(); }
    catch { if (intent === audioIntent.current) { setPlaying(''); setNotice('试听未能开始，请再试一次。'); } }
  }
  function openWardrobe() { stopAudio(); setSelectedId(equippedId); setNotice(''); setPage('wardrobe'); }
  function backToDetail() { setPage('detail'); setNotice(''); requestAnimationFrame(() => wardrobeTrigger.current?.focus()); }
  function close() { stopAudio(); setOpen(false); }
  function equip(card = selected) {
    if (!(card.isDefault || card.owned)) return;
    setEquippedId(card.id);
    setNotice(`已换上「${card.name}」`);
  }
  const status = card => card.id === equippedId ? '正在穿戴' : card.isDefault || card.owned ? '已拥有' : '未拥有';

  function navigation() {
    const tabs = view === 'notebook' ? [['skill','技能'],['profile','人物'],['wardrobe','衣柜']] : [['detail','角色详情'],['wardrobe','衣柜']];
    const active = wardrobe ? 'wardrobe' : view === 'notebook' ? chapter : 'detail';
    function change(id) { if (id === 'wardrobe') openWardrobe(); else { setPage('detail'); setChapter(id === 'profile' ? 'profile' : 'skill'); setNotice(''); } }
    return <nav className="page-tabs" aria-label="角色内容">{tabs.map(([id,label], index) => <button key={id} type="button" ref={id === 'wardrobe' ? wardrobeTrigger : undefined} aria-pressed={active === id} onClick={() => change(id)} onKeyDown={event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      change(tabs[next][0]); event.currentTarget.parentElement.children[next].focus();
    }}>{view === 'notebook' && <span className="tab-number">0{index + 1}</span>}{label}</button>)}</nav>;
  }
  const identity = <div className="identity"><span className="eyebrow">星炬学院围棋部 · 部员档案</span><h1>{character.name}</h1><a href={character.cvUrl} target="_blank" rel="noreferrer" className="cv">CV：{character.cvName}</a></div>;
  const portrait = <div className="figure-area"><div className="figure-halo"/><span className="figure-note">{wardrobe ? 'FITTING ROOM' : 'MEMBER HANDBOOK'}</span><PortraitShowcase src={(wardrobe ? selected : equipped).portraitUrl} alt={character.name} groupAspect={aspect}/><span className="figure-label">{wardrobe ? selected.name : equipped.name}</span></div>;
  const voice = <button className="quote" onClick={() => playAudio('voice')} type="button"><span>{character.description}</span><span className="quote-action"><Volume2 size={16}/>{playing === 'voice' ? '停止语音' : playing === 'loading-voice' ? '正在加载…' : '听听她的声音'}</span></button>;
  const music = <div className="music-line"><Music2 size={18}/><div><strong>技能音乐</strong><small>{character.skill.name} · 默认曲目</small></div><button className="round-button" type="button" aria-label={playing === 'music' ? '暂停技能音乐' : '试听技能音乐'} onClick={() => playAudio('music')}>{playing === 'music' ? <Pause size={17}/> : <Play size={17}/>}</button><span className="sr-only" role="status">{playing === 'loading-music' ? '正在加载音乐' : ''}</span></div>;
  const skillContent = <div className="skills">{skills.map((skill, index) => <section className="skill-section" key={skill.effectType}><div className="section-kicker">{index ? '派生技能' : '角色技能'}</div><div className="skill-heading"><h2>{skill.name}</h2><span className="cost">{formatSkillOverclock(skill)}</span></div><SkillDescription description={skill.description}/></section>)}</div>;
  const acquisition = <div className="acquisition"><span>获得途径</span><strong>{character.acquisitionMethod}</strong></div>;
  const wardrobeCards = <div className="costume-options" aria-label="可预览的服装">{cards.map((card,index) => <button type="button" className={`costume-option ${card.id === selectedId ? 'selected' : ''} ${!card.isDefault && !card.owned ? 'locked' : ''}`} key={card.id} aria-pressed={card.id === selectedId} aria-label={`预览${card.name}，${status(card)}`} onClick={() => { setSelectedId(card.id); setNotice(''); }}><span className="option-number">0{index + 1}</span><PortraitShowcase src={card.portraitUrl} groupAspect={aspect}/><strong>{card.name}</strong><span className="ownership">{card.id === equippedId ? <Check size={13}/> : !card.isDefault && !card.owned ? <LockKeyhole size={12}/> : null}{status(card)}</span></button>)}</div>;
  const costumeCopy = <div className="costume-copy"><div className="section-kicker">{selected.id === equippedId ? '当前装扮' : '试穿预览'}</div><h2>{selected.name}</h2>{selected.illustName && <div className="credit">illust：{selected.illustUrl ? <a href={selected.illustUrl} target="_blank" rel="noreferrer">{selected.illustName}</a> : selected.illustName}</div>}<p>{selected.description || '这套服装的介绍尚未填写。'}</p></div>;
  const confirm = <div className="confirm"><div aria-live="polite" className="equip-summary">{notice || (selected.id === equippedId ? '这就是你现在的装扮' : owned ? '喜欢这套？确认后换上' : '未拥有 · 可以欣赏，暂不可换装')}</div><button className="primary" type="button" disabled={!owned || selected.id === equippedId} onClick={() => equip()}>{selected.id === equippedId ? <Check size={17}/> : owned ? <Shirt size={17}/> : <LockKeyhole size={17}/>}{selected.id === equippedId ? '正在穿戴' : owned ? '换上这套' : '尚未拥有'}</button></div>;

  if (view === 'current') return <div className="current-sample-content">{!open && <button className="reopen" type="button" onClick={() => { setOpen(true); setPage('detail'); }}>打开角色详情</button>}{open && !wardrobe && <CharacterDetailDialog character={character} detailOwned itemEffects={{}} user={user} audioSettings={DEFAULT_AUDIO_SETTINGS} onSelectCharacterMusic={() => {}} onOpenCostumes={openWardrobe} onPlayDetailVoice={() => playAudio('voice')} onClose={close}/>} {open && wardrobe && <CharacterCostumeDialog character={character} characterOwned costumes={catalog.costumes} loading={false} equippingId="" user={user} onEquip={equip} onClose={backToDetail}/>}</div>;

  return <main className={`lab lab-${view}`}>
    <div className="background-caption">SIGRIKAGO <span>部员手册</span></div>
    <button className="reopen" type="button" onClick={() => { setPage('detail'); setOpen(true); }}>打开角色详情</button>
    {open && <div className="lab-overlay"><ModalDialog ariaLabel={`${character.name}${wardrobe ? '的衣柜' : '角色详情'}`} onClose={wardrobe ? backToDetail : close} className={`lab-window ${wardrobe ? 'is-wardrobe' : ''}`}>
      <header className="window-heading"><span className="paper-title"><BookOpen size={18}/>{wardrobe ? `${character.name}的衣柜` : '角色详细信息'}</span><span className="window-counter">{view === 'dossier' ? '夹页档案' : view === 'stage' ? '立绘展台' : '随身手账'}</span><button className="close" type="button" aria-label="关闭窗口" onClick={close}><X size={20}/></button></header>
      <div className="window-layout">
        <aside className="portrait-side">{identity}{portrait}{!wardrobe && view !== 'notebook' && <button ref={wardrobeTrigger} className="wardrobe-entry" type="button" onClick={openWardrobe}><Shirt size={18}/>打开衣柜<span>→</span></button>}{wardrobe && <button className="back" type="button" onClick={backToDetail}><ArrowLeft size={16}/>返回角色详情</button>}</aside>
        <div className="content-side">{navigation()}<div className="content-scroll">
          {!wardrobe && <>{(view !== 'notebook' || chapter === 'skill') && <>{skillContent}{music}</>}{(view !== 'notebook' || chapter === 'profile') && <>{voice}{acquisition}</>}{view === 'notebook' && chapter === 'skill' && <div className="notebook-footnote"><Sparkles size={16}/>熟悉技能，再落下第一枚棋子。</div>}</>}
          {wardrobe && <div className="wardrobe-content">{view === 'notebook' ? <>{wardrobeCards}{costumeCopy}</> : <>{costumeCopy}{wardrobeCards}</>}</div>}
        </div>{wardrobe && confirm}{!wardrobe && <footer className="detail-footer"><span>星炬学院 · 围棋部</span><span>{view === 'notebook' ? chapter === 'profile' ? '02 / 人物' : '01 / 技能' : '已加入社团'}</span></footer>}</div>
      </div>
    </ModalDialog></div>}
  </main>;
}

const root = document.getElementById('root');
// The production detail resolves its portal during render, so the theme root must already exist.
if (view === 'current') root.className = 'app-shell player-theme-enabled theme-bright-school lab-current-backdrop';
createRoot(root).render(<Sample/>);
