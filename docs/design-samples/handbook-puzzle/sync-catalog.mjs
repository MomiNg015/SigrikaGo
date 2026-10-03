import { writeFile } from 'node:fs/promises';
import { ADMIN_DEFAULT_CONFIG } from '../../../server/adminDefaultSnapshot.js';

const portraitOptions = {
  sigrika: { color: '#ff9b4d', crop: [190, 0, 430, 430], focal: [415, 192] },
  denia: { color: '#f2a4d8', crop: [210, 0, 450, 450], focal: [420, 217] },
  aemeath: { color: '#67d9e8', crop: [190, 0, 440, 440], focal: [395, 181] },
  lynae: { color: '#38d7c2', crop: [220, 0, 440, 440], focal: [391, 181] },
  mornye: { color: '#8aa0ff', crop: [235, 0, 470, 470], focal: [422, 230] },
  chisa: { color: '#d74255', crop: [205, 0, 440, 440], focal: [435, 163] },
  changli: { color: '#e96c7d', crop: [180, 0, 450, 450], focal: [426, 167] },
  qiuyuan: { color: '#2f3a3d', crop: [190, 0, 450, 450], focal: [383, 163] },
  nabomo: { color: '#8fb4f7', crop: [210, 0, 460, 460], focal: [404, 228] },
  baconbits: { color: '#f59ab2', crop: [100, 175, 700, 700], focal: [450, 389] },
};

const catalog = Object.entries(portraitOptions).map(([id, portrait]) => {
  const row = ADMIN_DEFAULT_CONFIG.characters.find(character => character.slug === id);
  if (!row) throw new Error(`Missing character: ${id}`);
  return {
    id, name: row.name, description: row.description,
    cv: row.cvName, acquisition: row.acquisitionMethod,
    ...portrait,
    src: id === 'baconbits'
      ? '/assets/characters/portraits/baconbits.webp'
      : `./assets/characters/${id}.png`,
    imageSize: id === 'baconbits' ? [900, 900] : [832, 1216],
    skill: { name: row.skill.name, description: row.skill.description,
      cost: row.skill.costValue, uses: row.skill.uses },
    derivedSkills: JSON.parse(row.skill.paramsJson || '{}').derivedSkills || [],
  };
});
await writeFile(new URL('./catalog.json', import.meta.url), `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
