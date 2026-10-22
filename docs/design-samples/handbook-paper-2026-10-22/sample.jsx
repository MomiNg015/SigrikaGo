import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CharacterDetailDialog } from '../../../src/modals/house/HouseNestedDialogs.jsx';
import CharacterCostumeDialog from '../../../src/modals/house/CharacterCostumeDialog.jsx';
import { mergeCharacters } from '../../../src/shared/characters.js';
import { loadCachedPublicSkillTraitCatalog } from '../../../src/app/skillTraitCatalog.js';
import { DEFAULT_AUDIO_SETTINGS, stopVoicePlayback } from '../../../src/audio/playback.jsx';
import { playSystemVoice } from '../../../src/audio/systemVoicePlayback.js';
import { SYSTEM_VOICE_EVENTS } from '../../../src/shared/systemVoices.js';
import catalog from './catalog.json';
import traits from './traits.json';
import wardrobeCatalog from '../handbook-detail-2026-10-15/catalog.json';
import '../../../src/styles.css';
import './common.css';
import './variants.css';

// Public content snapshot only. Sample controls never write to a real account.
await loadCachedPublicSkillTraitCatalog({ apiClient: async () => traits });
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, options) => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.href);
  if (url.pathname.startsWith('/api/')) return Promise.reject(new Error('样板不连接账号接口'));
  return nativeFetch(input, options);
};
const params = new URLSearchParams(location.search);
const design = ['spread', 'banner', 'reading', 'current'].includes(params.get('view')) ? params.get('view') : 'spread';
const characters = mergeCharacters(catalog.characters, catalog.disabledSlugs);
const original = characters[params.get('character')] ?? characters.sigrika;
const character = params.has('long') ? { ...original, name: '西格莉卡的长姓名排版测试', skill: { ...original.skill, description: `${original.skill.description}\n`.repeat(7) } } : original;
const audioSettings = DEFAULT_AUDIO_SETTINGS;
const root = document.getElementById('root');
root.className = 'app-shell player-theme-enabled theme-bright-school hp-scene';
root.dataset.design = design;

function Sample() {
  const [open, setOpen] = useState(true);
  const [wardrobe, setWardrobe] = useState(false);
  const [user, setUser] = useState({ ownedMusicIds: ['sigrika-skill-dream'], ownedCostumeIds: [], equippedCostumes: {}, musicSelections: {} });
  useEffect(() => () => stopVoicePlayback(), []);
  function close() { stopVoicePlayback(); setOpen(false); }
  function selectMusic({ characterId, trackId, effectType }) {
    setUser(previous => ({ ...previous, musicSelections: effectType
      ? { ...previous.musicSelections, derivedSkill: { ...previous.musicSelections.derivedSkill, [characterId]: { ...previous.musicSelections.derivedSkill?.[characterId], [effectType]: trackId } } }
      : { ...previous.musicSelections, skill: { ...previous.musicSelections.skill, [characterId]: trackId } } }));
  }
  return <>
    {!open && <button className="hp-reopen" type="button" onClick={() => setOpen(true)}>重新打开角色详情</button>}
    {open && <CharacterDetailDialog character={character} detailOwned={!params.has('unowned')} itemEffects={{}} user={user}
      audioSettings={audioSettings} musicTracks={params.has('noMusic') ? [] : undefined} onSelectCharacterMusic={selectMusic}
      onOpenCostumes={() => { stopVoicePlayback(); setWardrobe(true); }}
      onPlayDetailVoice={() => playSystemVoice(SYSTEM_VOICE_EVENTS.houseDetail, { character, audioSettings })} onClose={close}/>}
    {wardrobe && <CharacterCostumeDialog character={character} characterOwned={!params.has('unowned')} costumes={wardrobeCatalog.costumes}
      loading={false} equippingId="" user={user} onEquip={costume => setUser(previous => ({ ...previous, equippedCostumes: costume.isDefault ? {} : { [character.id]: costume } }))} onClose={() => setWardrobe(false)}/>}
  </>;
}
createRoot(root).render(<Sample/>);
