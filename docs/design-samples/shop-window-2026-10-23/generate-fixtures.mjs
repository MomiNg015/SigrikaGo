import { writeFileSync } from 'node:fs';
import { ADMIN_DEFAULT_CONFIG } from '../../../server/adminDefaultSnapshot.js';

const targets = ['rainbow-bean-candy', 'radio-recruitment-ticket', 'campus-recruitment-poster', 'aemeath-flight-snow-memorial-ticket', 'paw-stone', 'papagan-peach-stone', 'qiuyuan-skill-zhouwo'];
const characters = { sigrika: '西格莉卡', denia: '达妮娅', nabomo: '娜波摩' };
const goods = targets.map(id => {
  const item = ADMIN_DEFAULT_CONFIG.shopItems.find(row => row.targetId === id);
  if (!item) throw new Error(`Missing default item ${id}`);
  return { id, name: item.name, category: item.category === 'decoration' ? '棋子' : item.category === 'music' ? '音乐' : '道具', image: item.imageUrl, description: item.description, price: item.priceCoins, stock: item.stockQuantity, repeatable: item.category === 'item' };
});
const costumes = ADMIN_DEFAULT_CONFIG.costumes.map(item => ({ id: item.id, name: item.name, category: '服装', character: characters[item.characterSlug], image: item.portraitUrl, description: item.description, price: item.priceCoins, stock: -1, repeatable: false }));
writeFileSync(new URL('./catalog.json', import.meta.url), JSON.stringify({ goods, costumes }, null, 2) + '\n');
