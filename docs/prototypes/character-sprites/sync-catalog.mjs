import { writeFile } from 'node:fs/promises';
import { ADMIN_DEFAULT_CONFIG } from '../../../server/adminDefaultSnapshot.js';

const expressions = {
  sigrika: { smile: '微笑', thinking: '思考', surprised: '惊讶', closed_smile: '闭眼笑', worried: '担忧', angry: '生气', embarrassed: '害羞', serious: '认真', original: '开口笑' },
  denia: { smile: '温柔微笑', closed_smile: '闭眼浅笑', sleepy: '慵懒困倦', playful: '俏皮轻笑', thinking: '安静思考', surprised: '轻微惊讶', annoyed: '轻微不满', serious: '清醒认真', original: '开口笑' },
  aemeath: { smile: '明快微笑', closed_smile: '闭眼开心笑', wink: '俏皮眨眼', surprised: '好奇惊讶', thinking: '专注思考', wry: '无奈吐槽', annoyed: '轻微不满', serious: '坚定认真', original: '柔和微笑' }
};
const ids = [...Object.keys(expressions), 'lynae', 'qiuyuan', 'mornye', 'changli', 'chisa', 'nabomo'];
const catalog = Object.fromEntries(ids.map(id => {
  const row = ADMIN_DEFAULT_CONFIG.characters.find(character => character.slug === id);
  if (!row) throw new Error(`Missing default character: ${id}`);
  return [id, {
    id, name: row.name, description: row.description,
    cv: row.cvName, acquisition: row.acquisitionMethod,
    legacyPortrait: `../../../public/assets/characters/portraits/${id}.webp`,
    ...(expressions[id] ? { expressions: expressions[id] } : {}),
    skill: { name: row.skill.name, description: row.skill.description, cost: row.skill.costValue, uses: row.skill.uses },
    derivedSkills: JSON.parse(row.skill.paramsJson || '{}').derivedSkills || []
  }];
}));
await writeFile(new URL('./catalog-data.js', import.meta.url), `// Offline display data from server/adminDefaultSnapshot.js; no runtime API.\nwindow.SpriteCatalog = ${JSON.stringify(catalog, null, 2)};\n`, 'utf8');
