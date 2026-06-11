export const GAME_MODE_IDS = ["spark", "standard"];

export const GAME_MODES = {
  spark: {
    id: "spark",
    title: "星炬对弈",
    shortTitle: "星炬",
    boardSize: 13,
    komi: 2.75,
    skillEnabled: true,
    time: {
      main: 5 * 60,
      byoYomi: 30,
      periods: 3
    },
    rulesText: "13路 5分钟30秒3次 黑贴2又3/4子"
  },
  standard: {
    id: "standard",
    title: "标准对弈",
    shortTitle: "标准",
    boardSize: 19,
    komi: 3.75,
    skillEnabled: false,
    time: {
      main: 5 * 60,
      byoYomi: 30,
      periods: 3
    },
    rulesText: "19路 5分钟30秒3次 黑贴3又3/4子"
  }
};

export function normalizeGameModeId(mode) {
  return GAME_MODE_IDS.includes(mode) ? mode : "spark";
}

export function gameModeById(mode) {
  return GAME_MODES[normalizeGameModeId(mode)];
}

export function modeOrderedEntries() {
  return GAME_MODE_IDS.map((id) => GAME_MODES[id]);
}

export function gameModeSkillEnabled(mode) {
  return gameModeById(mode).skillEnabled;
}
