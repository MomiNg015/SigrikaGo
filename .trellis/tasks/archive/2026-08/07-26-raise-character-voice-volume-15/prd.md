# 角色语音整体提高 15%

## Goal

在保持上一轮角色间响度统一结果的前提下，将仓库内全部静态角色语音的线性增益统一提高 15%，使默认音频设置下也能实际听到提升，并继续由离线校准与只读检查防止角色间响度漂移。

## Requirements

- `public/assets/voice/*.ogg` 全量纳入，包含由 Microsoft Kangkang TTS 生成后固化为 Ogg 的仇远系统语音。
- 以线性振幅 `1.15` 为唯一提升系数，即相对当前校准基线增加约 `1.214 dB`。
- 普通片段、短片段和 True Peak 限制同步平移同一 dB 值，不能只改 loudness 目标而压缩原有峰值关系。
- 继续保留现有批量暂存、最终 Ogg 复测、采样率/声道数/编码验证及全批成功后替换的原子流程。
- 为全局校准目标变化提供显式 `--force` 写入选项，避免新旧容差区重叠时跳过仍需重写的文件。
- 不重新引入运行时逐文件 RMS 修正，也不通过降低 BGM 伪装角色语音变响。
- 准时宝继续使用现有 `zh-CN` 浏览器 TTS fallback；该路径在默认 voice 设置下已使用浏览器允许的最大 `utterance.volume`，本任务不把它替换为西格莉卡或其他静态语音。
- 同步更新系统设计入口、音频资源分篇与 Trellis 音频质量合同。

## Acceptance Criteria

- [x] 校准常量明确表达 `1.15` 线性增益及其 dB 换算。
- [x] 普通语音目标从 `-18 LUFS` 等量提高到约 `-16.8 LUFS`。
- [x] 短语音目标从 `-19 dBFS RMS` 等量提高到约 `-17.8 dBFS RMS`。
- [x] 最终 Ogg True Peak 上限从 `-2 dBTP` 等量提高到约 `-0.8 dBTP`，仍低于 `0 dBTP`。
- [x] 所有静态角色语音完成重新编码，`npm run check:voices` 全量通过。
- [x] 强制写入参数有单元测试，日常写入仍默认跳过已有效文件。
- [x] 仇远的 18 个固化 TTS 系统语音仍在批量校准范围内。
- [x] 准时宝读秒仍解析到 TTS，不回退为西格莉卡静态语音。
- [x] 聚焦测试、系统设计生成检查和仓库完整检查通过。

## Definition of Done

- 测试覆盖增益比例、换算目标和现有错误边界。
- `npm run voices:normalize` 与 `npm run check:voices` 成功。
- `npm run docs:system-design` 与 `npm run check` 成功。
- 文档与质量合同记录新的离线响度基线。
- 仅提交本任务文件和与既有脏文件重叠的本任务 hunks，不纳入服装店等无关 WIP。

## Technical Approach

在 `scripts/voiceLoudnessNormalization.mjs` 中保留上一轮基线值，并用
`20 * log10(1.15)` 派生新的 integrated loudness、短片段 RMS、最终 True
Peak 与处理中间 True Peak 目标。这样所有校准指标都以同一线性比例平移，
默认运行时即使已经达到 `volume=1`，源资产仍会实际提升 15%，而 Web Audio
与普通 `Audio` fallback 继续消费同一批源文件。

## Decision (ADR-lite)

**Context**: 现有静态语音播放先把用户 voice 音量乘以 1.35 再封顶到 1；
默认设置已经达到封顶值，因此继续提高运行时 boost 对默认用户无效，而且
浏览器 TTS 的 `utterance.volume` 默认也已经是 1。

**Decision**: 将 15% 提升放入现有离线资产校准合同，并让 loudness、RMS 和
True Peak 目标等量平移。运行时增益链、BGM 独立合同和准时宝 TTS 路由保持不变。

**Consequences**: 仓库内 187 个静态语音二进制会重新编码；所有浏览器的
Web Audio 与普通 Audio 路径均获得一致提升。浏览器实时 TTS 不会超出其现有
最大输出值，但仍遵循 master/voice 静音与音量设置。

## Out of Scope

- 不修改 BGM、SFX、主音量或新用户默认百分比。
- 不引入语音期间 BGM ducking。
- 不新增在线 TTS 服务或把准时宝 TTS 固化为音频资源。
- 不重新配音、不改变台词、音色、语速、混响 profile 或事件映射。

## Technical Notes

- 研究记录：[`research/voice-gain-path.md`](research/voice-gain-path.md)。
- 主要实现：`scripts/voiceLoudnessNormalization.mjs`、
  `scripts/voiceLoudnessNormalization.test.js`、
  `public/assets/voice/*.ogg`。
- 设计合同：`docs/system-design.md`、
  `docs/system-design/05-assets-audio-preload.md`、
  `.trellis/spec/frontend/quality-guidelines.md`。
