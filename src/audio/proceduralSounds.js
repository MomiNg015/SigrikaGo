import { DEFAULT_AUDIO_SETTINGS, audioVolume } from "./audioSettings.js";
import { browserAudioContextClass } from "./audioRuntime.js";

export function playCountdownBeep(second, audioSettings = DEFAULT_AUDIO_SETTINGS) {
  const volume = audioVolume(audioSettings, "sfx");
  if (volume <= 0) return;
  const AudioContextClass = browserAudioContextClass();
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = second <= 3 ? "square" : "sine";
  oscillator.frequency.setValueAtTime(second <= 3 ? 880 : 620, context.currentTime);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime((second <= 3 ? 0.2 : 0.13) * volume, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.11);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);
}

export function playDoorbellSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  const volume = audioVolume(audioSettings, "sfx");
  if (volume <= 0) return;
  const AudioContextClass = browserAudioContextClass();
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  if (context.state === "suspended") context.resume().catch(() => {});
  const tones = [
    { at: 0, frequency: 784, length: 0.18 },
    { at: 0.16, frequency: 1046.5, length: 0.28 }
  ];
  for (const tone of tones) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + tone.at;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.2 * volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + tone.length);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + tone.length + 0.04);
  }
}
