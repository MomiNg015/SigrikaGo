import catalog from '../catalog.json';

const query = new URLSearchParams(location.search);
let seed = 27182;
Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
export const user = { id: 'shop-material-preview', username: '莫名', coins: query.get('state') === 'poor' ? 5 : 1280, ownedCharacters: ['sigrika', 'denia', 'nabomo'], ownedDecorations: [], ownedMusicIds: [], ownedItems: {}, characterCostumes: {} };
const items = catalog.goods.slice(0, 5).map(item => ({
  id: item.id, targetId: item.id, name: item.name, category: item.category === '棋子' ? 'decoration' : 'item',
  description: item.description, priceCoins: item.price, finalPrice: item.price, discountPercent: 0,
  imageUrl: item.image, stockQuantity: item.stock, remainingStock: item.stock, purchasable: true, itemTargetType: 'self'
}));
const costumes = catalog.costumes.map(item => ({
  id: item.id, name: item.name, characterSlug: item.id.split('-')[0], portraitUrl: item.image,
  description: item.description, priceCoins: item.price, finalPrice: item.price, discountPercent: 0,
  enabled: true, shopVisible: true, purchasable: true, characterOwned: true, owned: false
}));
const realFetch = window.fetch.bind(window);
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }); }
window.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url, location.href);
  if (!url.pathname.startsWith('/api/')) return realFetch(input, options);
  const path = url.pathname;
  if (path === '/api/shop') return json({ items: query.get('state') === 'empty' ? [] : items });
  if (path === '/api/costumes') return json({ costumes: query.get('state') === 'empty' ? [] : costumes });
  if (path.endsWith('/purchase')) {
    const id = path.split('/')[3];
    const costume = path.startsWith('/api/costumes/');
    const item = (costume ? costumes : items).find(entry => entry.id === id);
    if (!item) return json({ error: '商品不存在' }, 404);
    if (user.coins < item.finalPrice) return json({ error: '金币不足' }, 400);
    if (item.owned || (item.remainingStock === 0)) return json({ error: '商品不可重复购买或已售罄' }, 409);
    user.coins -= item.finalPrice;
    if (costume) item.owned = true;
    else if (item.category === 'decoration') user.ownedDecorations.push(item.targetId);
    else { user.ownedItems[item.targetId] = (user.ownedItems[item.targetId] || 0) + 1; if (item.remainingStock > 0) item.remainingStock--; }
    return json({ user: { ...user }, [costume ? 'costume' : 'item']: item, achievementUnlocks: [] });
  }
  if (path === '/api/costumes/equip') {
    const body = JSON.parse(options.body || '{}');
    user.characterCostumes[body.characterSlug] = body.costumeId;
    return json({ user: { ...user } });
  }
  return json({ error: '此接口未包含在样板中' }, 404);
};
