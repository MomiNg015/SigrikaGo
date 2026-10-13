const params = new URLSearchParams(location.search);
const player = (username, characterId, connected = true) => ({ user: { username, itemEffects: {} }, characterId, connected });
const fixtures = [
  { code: "483126", mode: "spark", black: player("今天也要吃橘子", "sigrika"), white: player("雨天的棉花糖", "denia"), moveNumber: 86, onlineCount: 12, status: "playing" },
  { code: "902417", mode: "standard", black: player("白昼漫游", "aemeath"), white: player("窗边的风", "lynae"), moveNumber: 124, onlineCount: 6, status: "playing" },
  { code: "615803", mode: "gomoku", black: player("薄荷汽水", "mornye"), white: player("星星不打烊", "chisa"), moveNumber: 23, onlineCount: 4, status: "playing" },
  { code: "270954", mode: "team", black: player("放学后的棋社", "qiuyuan"), white: player("晚风与纸飞机", "aemeath"), moveNumber: 57, onlineCount: 8, status: "playing" },
  { code: "318602", mode: "spark", black: player("想再下一盘", "lynae"), white: player("猫猫睡着了", "denia", false), moveNumber: 142, onlineCount: 3, status: "playing" },
  { code: "750129", mode: "standard", black: player("晨光收藏家", "sigrika"), white: player("月亮的留言", "mornye"), moveNumber: 211, onlineCount: 5, status: "finished" },
  { code: "146935", mode: "gomoku", black: player("周末有空吗", "chisa"), white: player("小小胜负师", "qiuyuan"), moveNumber: 31, onlineCount: 2, status: "finished" }
];
export let rooms = params.has("empty") ? [] : params.has("many") ? Array.from({ length: 30 }, (_, index) => ({ ...fixtures[index % fixtures.length], code: String(100001 + index) })) : fixtures;
if (params.has("long")) rooms = rooms.map(room => ({ ...room, black: { ...room.black, user: { ...room.black.user, username: "每天放学以后都想和大家再下一盘棋" } }, moveNumber: 1024, onlineCount: 128 }));
