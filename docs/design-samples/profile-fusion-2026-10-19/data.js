// Deliberate fixtures: these values describe the preview, never a live account.
export const characters = [
  { id: 'sigrika', name: '西格莉卡', games: 62, wins: 43, losses: 17, draws: 2, color: '#c9e3c8' },
  { id: 'aemeath', name: '爱弥斯', games: 38, wins: 25, losses: 12, draws: 1, color: '#f4c4d6' },
  { id: 'qiuyuan', name: '仇远', games: 18, wins: 10, losses: 8, draws: 0, color: '#c6d9df' },
  { id: 'denia', name: '达妮娅', games: 10, wins: 5, losses: 5, draws: 0, color: '#ddcdf0' }
];
export const modes = {
  spark: { name: '星炬', title: '星炬围棋', rank: 5, stars: 3, games: 128, wins: 83, losses: 42, draws: 3 },
  standard: { name: '标准', title: '标准围棋', rank: 4, stars: 2, games: 64, wins: 35, losses: 27, draws: 2 },
  other: { name: '其它', title: '五子棋', rank: 3, stars: 2, games: 28, wins: 17, losses: 11, draws: 0 },
  team: { name: '队际赛', title: '队际赛', rank: 4, stars: 3, games: 32, wins: 21, losses: 10, draws: 1 }
};
export const results = ['胜', '负', '胜', '胜', '和', '负', '胜', '胜', '负', '胜'];
export const art = (id, avatar = false) => `/assets/characters/handbook-chibi-sprites/${id}${avatar ? '-avatar' : ''}.webp`;
export function recordRows(mode, play) {
  if (play === 'team') return characters.map((character, index) => ({ ...character, games: [26, 21, 15, 9][index], wins: [18, 14, 9, 5][index], losses: [7, 6, 6, 4][index], draws: [1, 1, 0, 0][index] }));
  if (mode === 'spark') return characters;
  return []; // Ordinary Go / gomoku do not have skill-character statistics.
}
