const TITLES = {
  handbook: "部员手册",
  resume: "履历",
  recruitment: "部员招募栏",
  friends: "社交系统",
  warehouse: "仓库",
  leaderboard: "排行榜",
  watch: "对局列表",
  announcements: "公告",
  mailbox: "邮箱",
  "message-board": "留言板",
  settings: "设置",
  achievements: "成就",
  personalization: "个性化",
  profile: "详细资料",
  replays: "对局回放",
  "select-character": "选择角色",
  "picker-title": "选择称号",
  "picker-badge": "选择徽章",
  "picker-nameplate": "选择用户名背景",
  report: "举报用户",
  blacklist: "加入黑名单",
  practice: "准时宝陪练",
  "team-lineup": "队际赛",
  "match-mode": "选择对弈模式"
};

export const WINDOW_TITLE_STICKERS = Object.freeze(Object.fromEntries(
  Object.entries(TITLES).map(([key, title]) => [key, Object.freeze({
    title,
    src: `/assets/window-titles/${key}.webp`,
    width: title.length <= 2 ? 168 : title.length <= 4 ? 220 : 272,
    height: title.length <= 2 ? 76 : title.length <= 4 ? 80 : 84
  })])
));
