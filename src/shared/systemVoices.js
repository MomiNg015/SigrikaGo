export const SYSTEM_VOICE_EVENTS = {
  gameStart: "game-start",
  skillCast: "skill-cast",
  sortie: "sortie",
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
  [SYSTEM_VOICE_EVENTS.sortie]: "出战",
  [SYSTEM_VOICE_EVENTS.byoYomiStart]: "开始读秒",
  [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: "还剩2次读秒",
  [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: "还剩1次读秒",
  [SYSTEM_VOICE_EVENTS.timeout]: "超时",
  [SYSTEM_VOICE_EVENTS.resultVictory]: "对局胜利",
  [SYSTEM_VOICE_EVENTS.resultDefeat]: "对局失败",
  [SYSTEM_VOICE_EVENTS.resultDraw]: "和棋"
};

export function resolveSystemVoice(event, { character = null, params = {} } = {}) {
  if (event === SYSTEM_VOICE_EVENTS.byoYomiCountdown) {
    const text = countdownText(params.seconds);
    if (!text) return { type: "tts", text: "" };
  }
  const countdownMatch = /^(countdown-(1|2|3|4|5|6|7|8|9|10))$/.exec(event);
  if (typeof event === "string" && event.startsWith("countdown-") && !countdownMatch) {
    return { type: "tts", text: "" };
  }
  if (countdownMatch) {
    const text = countdownText(Number(countdownMatch[2]));
    if (!text) return { type: "tts", text: "" };
  }
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
  if (countdownMatch) {
    return { type: "tts", text: countdownText(Number(countdownMatch[2])) };
  }
  return { type: "tts", text: DEFAULT_SYSTEM_VOICE_TEXT[event] ?? "" };
}

function countdownText(seconds) {
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 10) return "";
  return String(seconds);
}
