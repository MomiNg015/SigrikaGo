export const SYSTEM_VOICE_EVENTS = {
  gameStart: "game-start",
  skillCast: "skill-cast",
  byoYomiStart: "byo-yomi-start",
  byoYomiPeriods: "byo-yomi-periods",
  byoYomiPeriod2: "byo-yomi-period-2",
  byoYomiPeriod1: "byo-yomi-period-1",
  byoYomiCountdown: "byo-yomi-countdown",
  houseDetail: "house-detail",
  timeout: "timeout",
  resultVictory: "result-victory",
  resultDefeat: "result-defeat",
  resultDraw: "result-draw",
  countdown: (seconds) => `countdown-${seconds}`
};

const DEFAULT_SYSTEM_VOICE_TEXT = {
  [SYSTEM_VOICE_EVENTS.gameStart]: "对局开始",
  [SYSTEM_VOICE_EVENTS.byoYomiStart]: "开始读秒",
  [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: "还剩2次读秒",
  [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: "还剩1次读秒",
  [SYSTEM_VOICE_EVENTS.timeout]: "超时",
  [SYSTEM_VOICE_EVENTS.resultVictory]: "对局胜利",
  [SYSTEM_VOICE_EVENTS.resultDefeat]: "对局失败",
  [SYSTEM_VOICE_EVENTS.resultDraw]: "和棋"
};

export function resolveSystemVoice(event, { character = null, params = {} } = {}) {
  const characterVoice = character?.systemVoices?.[event];
  if (characterVoice) return { type: "audio", src: characterVoice };
  if (event === SYSTEM_VOICE_EVENTS.byoYomiPeriods) {
    if (params.periods === 2) {
      return resolveSystemVoice(SYSTEM_VOICE_EVENTS.byoYomiPeriod2, { character, params });
    }
    if (params.periods === 1) {
      return resolveSystemVoice(SYSTEM_VOICE_EVENTS.byoYomiPeriod1, { character, params });
    }
    return { type: "tts", text: `还剩${params.periods}次读秒` };
  }
  if (event === SYSTEM_VOICE_EVENTS.byoYomiCountdown) {
    return { type: "tts", text: countdownText(params.seconds) };
  }
  const countdownMatch = /^countdown-(\d+)$/.exec(event);
  if (countdownMatch) {
    return { type: "tts", text: countdownText(Number(countdownMatch[1])) };
  }
  return { type: "tts", text: DEFAULT_SYSTEM_VOICE_TEXT[event] ?? "" };
}

function countdownText(seconds) {
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 10) return "";
  return String(seconds);
}
