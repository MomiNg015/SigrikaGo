export const SYSTEM_VOICE_EVENTS = {
  gameStart: "game-start",
  byoYomiStart: "byo-yomi-start",
  byoYomiPeriods: "byo-yomi-periods",
  byoYomiCountdown: "byo-yomi-countdown",
  timeout: "timeout",
  resultVictory: "result-victory",
  resultDefeat: "result-defeat",
  resultDraw: "result-draw"
};

const DEFAULT_SYSTEM_VOICE_TEXT = {
  [SYSTEM_VOICE_EVENTS.gameStart]: "对局开始",
  [SYSTEM_VOICE_EVENTS.byoYomiStart]: "开始读秒",
  [SYSTEM_VOICE_EVENTS.timeout]: "超时",
  [SYSTEM_VOICE_EVENTS.resultVictory]: "对局胜利",
  [SYSTEM_VOICE_EVENTS.resultDefeat]: "对局失败",
  [SYSTEM_VOICE_EVENTS.resultDraw]: "和棋"
};

export function resolveSystemVoice(event, { character = null, params = {} } = {}) {
  const characterVoice = character?.systemVoices?.[event];
  if (characterVoice) return { type: "audio", src: characterVoice };
  if (event === SYSTEM_VOICE_EVENTS.byoYomiPeriods) {
    return { type: "tts", text: `还剩${params.periods}次读秒` };
  }
  if (event === SYSTEM_VOICE_EVENTS.byoYomiCountdown) {
    return { type: "tts", text: String(params.seconds) };
  }
  return { type: "tts", text: DEFAULT_SYSTEM_VOICE_TEXT[event] ?? "" };
}
