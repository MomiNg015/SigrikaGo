import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/styles.css';
import { profile, user as initialUser } from './fixtures.js';
import { CHARACTERS, characterListFromCatalog, mergeCharacters } from '../../../src/shared/characters.js';
import ResumeModal from '../../../src/modals/ResumeModal.jsx';
import { UserProfileCard } from '../../../src/modals/UserProfileCard.jsx';
import FriendsModal from '../../../src/modals/FriendsModal.jsx';
import WarehouseModal from '../../../src/modals/WarehouseModal.jsx';
import WatchModal from '../../../src/modals/WatchModal.jsx';
import AchievementModal from '../../../src/modals/AchievementModal.jsx';
import AnnouncementModal from '../../../src/modals/AnnouncementModal.jsx';
import { CharacterDetailDialog } from '../../../src/modals/house/HouseNestedDialogs.jsx';
import { loadCachedPublicSkillTraitCatalog } from '../../../src/app/skillTraitCatalog.js';
import { ModalDialog } from '../../../src/modals/modalComponents.jsx';
import catalog from '../handbook-paper-2026-10-22/catalog.json';
import traits from '../handbook-paper-2026-10-22/traits.json';

await loadCachedPublicSkillTraitCatalog({apiClient:async()=>traits});
const params=new URLSearchParams(location.search);
const productionPreview=location.pathname.endsWith('/production.html');
if(!productionPreview){
  await import('./harness.css');
  await import('./preview-isolation.css');
  await import('./materials.css');
  await import('./screenprint-roles.css');
}
const variants=['imprint','relief','screenprint','screenprint-roles'];
const variant=variants.includes(params.get('v'))?params.get('v'):'imprint';
if(!productionPreview){
  document.documentElement.id='material-preview';
  document.documentElement.dataset.material=params.get('off')==='1'?'baseline':variant;
}
const view=params.get('window')||'warehouse';
const characters=mergeCharacters(catalog.characters,catalog.disabledSlugs);
const character=characters.aemeath;
const silent={master:0,voice:0,music:0,sfx:0};
const noop=()=>{};
function Sample(){
  const [open,setOpen]=useState(false);
  // Match the app lifecycle: a detail portal opens after its themed shell mounts.
  useEffect(()=>setOpen(true),[]);
  const [aux,setAux]=useState('');
  const [user,setUser]=useState(initialUser);
  const close=()=>setOpen(false);
  const onNotice=(message)=>setAux(message);
  const common={token:'material-local-preview',characters:CHARACTERS,onClose:close,onNotice};
  return <main id={productionPreview?undefined:'material-root'} className="app-shell player-theme-enabled theme-bright-school" data-material={productionPreview?undefined:params.get('off')==='1'?'baseline':variant}>
    {!open&&<button className="sample-reopen" onClick={()=>setOpen(true)}>重新打开窗口</button>}
    {open&&view==='self'&&<ResumeModal user={profile()} token={common.token} characterListView={characterListFromCatalog(CHARACTERS)} onClose={close} onOpenAchievements={()=>setAux('成就入口')} onOpenPersonalization={()=>setAux('个性化入口')} onOpenReplay={()=>setAux('回放入口')}/>}
    {open&&view==='social'&&<div className="modal-backdrop profile-modal-backdrop"><UserProfileCard titleStickers user={profile()} {...common} onAddFriend={noop} onRemoveFriend={noop} onAddBlacklist={noop} onRemoveBlacklist={noop}/></div>}
    {open&&view==='friends'&&<FriendsModal {...common}/>}
    {open&&view==='warehouse'&&<WarehouseModal {...common} user={user} onUserChange={setUser} onOpenRecruitment={()=>setAux('招募入口演示')} />}
    {open&&view==='watch'&&<WatchModal {...common} onJoinRoom={code=>setAux('观战入口演示 · '+code)}/>}
    {open&&view==='achievement'&&<AchievementModal {...common}/>}
    {open&&view==='announcement'&&<AnnouncementModal {...common}/>}
    {open&&view==='handbook'&&<CharacterDetailDialog character={params.get('fixture')==='long'?{...character,skill:{...character.skill,description:character.skill.description.repeat(6)}}:character} detailOwned itemEffects={{}} user={user} audioSettings={silent} onClose={close} onOpenCostumes={()=>setAux('衣柜入口演示')} onPlayDetailVoice={noop}/>}
    {aux&&<div className="modal-backdrop"><ModalDialog className="small-modal sample-aux" ariaLabel="本地演示" onClose={()=>setAux('')}><p>{aux}</p><button onClick={()=>setAux('')}>返回</button></ModalDialog></div>}
  </main>;
}
createRoot(document.getElementById('root')).render(<Sample/>);
