# 调整默认音量并取消语音触发的 BGM 衰减

## Goal

提供一版不使用语音触发 BGM 衰减的混音方案供实机试听，同时把未保存过音频设置的新用户默认值调整为主音量 100%、BGM 60%、音效 100%、语音 100%。

## Requirements

- `DEFAULT_AUDIO_SETTINGS` 改为 `master: 100`、`bgm: 60`、`sfx: 100`、`voice: 100`；只影响没有 `sigrika-audio-settings` 持久化值的新用户或无有效存储的环境。
- 所有角色音频和 TTS 播放均不再触发 BGM ducking，包括普通语音、技能、剧情、结果、进入读秒、剩余次数和 `countdown-10` 到 `countdown-1`。
- 删除最后 10 秒由房间 Hook 持有的场景级 BGM duck request。
- `countdown-10` 到 `countdown-1` 仍使用独立的无混响播放配置，继续保留 voice 音量、增益、响度归一化、预加载与 fallback。
- 保留 `requestBackgroundMusicDuck()`，供招募演出等非语音场景主动控制 BGM；本任务不改变这些显式场景效果。
- 音频运行行为变化同步更新系统设计音频分篇、入口摘要，并重新生成 `docs/system-design.html`。

## Acceptance Criteria

- [x] 新用户默认音量为 100% / 60% / 100% / 100%，已有持久化音频设置仍按原值加载。
- [x] 播放任意角色语音或 TTS 都不会改变 BGM 音量。
- [x] 倒计时语音走干声播放链；角色音频不可用时的 TTS 同样不触发逐段 ducking。
- [x] 房间音频 Hook 不再创建或持有最后 10 秒的 BGM duck request。
- [x] 招募演出等显式 scoped BGM duck 行为保持不变。
- [x] 相关确定性测试、构建和系统设计文档生成通过。

## Definition of Done

- Tests added or updated for countdown-mix activation and voice playback profile resolution.
- Focused audio tests, lint/build, and relevant repository checks pass.
- `docs/system-design.md`, `docs/system-design/05-assets-audio-preload.md`, and generated `docs/system-design.html` reflect the new contract.
- No unrelated dirty work is staged or overwritten.

## Technical Approach

- 更新唯一默认音量来源和对应确定性测试。
- 从 `backgroundDucking.js`、共享调度 helper 和 voice playback 中删除 voice-active counter；`backgroundDucking.js` 只保留显式 scoped request registry。
- 删除房间倒计时 mix request/helper；播放 profile 只控制语音效果链，`countdown` 继续映射为 `reverb: false`。
- 复用现有 Web Audio buffer cache、RMS normalization 和普通 Audio/TTS fallback；不引入新依赖。

## Decision (ADR-lite)

**Context**: 上一版通过最后 10 秒的稳定浅 ducking 避免逐秒泵动，但用户需要试听完全不因语音降低 BGM 的方案。

**Decision**: 取消所有 voice/TTS 驱动的 BGM ducking；只保留非语音场景显式申请的 scoped duck。倒计时片段仍使用无混响 profile，以免同时改变两个听感变量。

**Consequences**: BGM 在语音前后保持用户设置音量，听感不会抽吸；语音与音乐的可懂度完全依赖新的默认比例、语音响度归一化和素材混音。招募演出等显式场景衰减不受影响。

## Out of Scope

- 不重做全局 BGM/voice 混音器。
- 不为所有系统语音建立完整的后台可配置 profile 系统。
- 不修改音频素材文件或重新母带处理。
- 不加入浏览器级真实听感自动化测试。

## Technical Notes

- `src/audio/audioSettings.js` 是新用户默认音量和持久化设置合并的唯一来源。
- `src/audio/backgroundDucking.js` 保留显式 scoped request，但不再感知 voice-active 状态。
- `src/room/audio/useRoomAudioEffects.js` 是倒计时语音真实消费路径，不再拥有 BGM duck request。
- `src/audio/playback.jsx` 对解码语音保留 RMS normalization 和可选 dry/wet reverb，不再通知 BGM ducking。
- `docs/system-design/05-assets-audio-preload.md` 记录当前倒计时、语音混响、ducking 和测试边界。

## Research References

- [`research/countdown-mix-path.md`](research/countdown-mix-path.md) — 现有运行路径、问题成因和最小改造边界。
