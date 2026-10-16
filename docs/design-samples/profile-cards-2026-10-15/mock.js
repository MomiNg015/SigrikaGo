import { CHARACTERS } from '../../../src/shared/characters.js';

export const demoUser = {
  id: 'profile-design-demo', username: '莫名', selectedCharacter: 'denia', characterId: 'denia',
  ownedCharacters: Object.keys(CHARACTERS), ownedDecorations: [], itemEffects: {},
  coins: 1280, rank: '4段', stars: 3, rating: 1200, relation: 'none', likeCount: 24,
};
export const demoSettings = { empty: new URLSearchParams(location.search).has('empty') };
localStorage.setItem(`sigrika-match-characters:${demoUser.id}`, JSON.stringify({ regular: ['denia'] }));
export const records = [
  { characterId: 'denia', total: 68, wins: 46, losses: 20, draws: 2 },
  { characterId: 'sigrika', total: 42, wins: 26, losses: 15, draws: 1 },
  { characterId: 'aemeath', total: 18, wins: 11, losses: 7, draws: 0 },
];
export function profile(mode = 'spark', empty = false) {
  const regular = mode === 'spark';
  return { ...demoUser, mode, rank: regular ? '4段' : '2段', stars: regular ? 3 : 2,
    recordStats: empty ? { totalGames: 0, wins: 0, losses: 0, draws: 0 }
      : regular ? { totalGames: 128, wins: 83, losses: 42, draws: 3 } : { totalGames: 36, wins: 21, losses: 14, draws: 1 },
    recentResults: empty ? [] : ['win','win','loss','win','draw','win','loss','win','win','win'],
    characterStats: empty ? [] : regular ? records : [{ characterId: 'denia', total: 36, wins: 21, losses: 14, draws: 1 }],
  };
}
// This isolated sample handles every API call locally. No account requests leave the page.
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input.url, location.href);
  if (!url.pathname.startsWith('/api/')) return originalFetch(input, init);
  const empty = demoSettings.empty;
  let data = {};
  if (url.pathname.endsWith('/profile')) data = { profile: profile(url.searchParams.get('mode') || 'spark', empty) };
  else if (url.pathname.endsWith('/capture-record')) data = { record: empty ? null : { captures: 156, ranking: 12, characterId: 'sigrika' } };
  else if (url.pathname.endsWith('/like')) data = { likeCount: 25, likedToday: true };
  else if (url.pathname.endsWith('/replays')) data = { records: [], nextCursor: null };
  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
