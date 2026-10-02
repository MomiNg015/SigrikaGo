# Voice gain path research

## Existing paths

- `audioVolume(settings, "voice")` clamps the combined master/voice percentage to
  `0..1`; the new-user defaults are both 100.
- Static voice playback calls `boostedVoiceVolume()`, which multiplies by `1.35`
  and clamps to `1`, before both Web Audio playback and ordinary `Audio` fallback.
- Browser TTS writes the unboosted voice-channel value to
  `SpeechSynthesisUtterance.volume`; at the defaults this is already `1`.
- Static Ogg files are currently authored to `-18 LUFS`, or `-19 dBFS RMS` for
  short/unmeasurable clips, with final True Peak no higher than `-2 dBTP`.

## Options considered

### Raise runtime boost

Rejected for this task. The default static path is already clamped to `1`, so a
larger `boost` would not change default playback. It would also keep different
headroom behavior between Web Audio, ordinary `Audio`, and browser TTS.

### Duck BGM while voices play

Rejected. It changes relative mix rather than character-source loudness and
contradicts the current contract that voice/TTS never owns a BGM duck request.

### Raise the authored calibration baseline

Selected. A linear `1.15` gain equals `20 * log10(1.15)`, approximately
`+1.214 dB`. Applying the same delta to integrated loudness, short-clip RMS,
processing peak, and final True Peak keeps the calibrated relationship intact:

- ordinary target: about `-16.786 LUFS`;
- short target: about `-17.786 dBFS RMS`;
- final True Peak ceiling: about `-0.786 dBTP`;
- processing ceiling: about `-1.286 dBTP`.

This changes actual source level at default settings, includes every committed
voice Ogg (including Qiuyuan's generated TTS assets), and preserves parity
between Web Audio and ordinary `Audio` fallback.

## Scope boundary

Zhunshibao remains a characterless bot with an empty static voice map, so its
countdown continues through the existing browser `zh-CN` TTS fallback. The
runtime TTS path is already at `utterance.volume = 1` under default settings and
cannot obtain the authored Ogg gain without changing TTS architecture; that
architecture change is outside this calibration task.
