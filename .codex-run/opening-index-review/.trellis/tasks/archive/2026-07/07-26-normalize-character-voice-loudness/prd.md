# 统一角色语音响度

## Goal

对当前角色语音资产做一次可复现、可验证的批量响度校准，使不同角色和不同事件在正常 Web Audio 播放与普通 `Audio` 降级播放时都保持更接近的人耳感知响度，优先解决琳奈部分语音偏轻的问题。

## What I already know

* 用户确认希望执行一次全量批量校准，而不是只单独提高琳奈，并选择“源资产双遍 LUFS 校准、移除运行时 RMS 修正”方案。
* 用户要求把仇远当前仍走浏览器 TTS 的系统语音纳入这次校准。
* 用户选择用本机 `Microsoft Kangkang` 中文成年男声把仇远 18 个 TTS 系统事件固化为静态 Ogg，再进入同一批量校准流程。
* 用户确认保留可复用的校准与响度漂移检查脚本，作为后续新增语音的质量门。
* `public/assets/voice/` 当前有 169 个 Ogg Vorbis 文件，总计约 6.7 MB；其中 164 个单声道、5 个双声道，采样率包含 44.1 kHz、48 kHz 和两个非标准 42173 Hz 文件。
* 当前 Web Audio 播放会按整段 `AudioBuffer` RMS 归一化到 `0.12`，增益限制为 `0.4–2.4`；普通 `Audio` fallback 不执行该归一化。
* 当前运行时估算下，琳奈全套平均约 `-17.0 LUFS`，并非整体最低，但 `lynae_result_loss.ogg` 触及 2.4 倍增益上限后仍约为 `-19.1 LUFS`，部分句子确实偏轻。
* 现有 RMS 归一化不等同于基于人耳权重的 LUFS 校准；源文件校准后继续执行运行时 RMS 修正会重新改变已校准的相对响度。
* 部分语音极短，可能无法得到有限的 EBU R128 integrated loudness，需要确定短片段回退规则。

## Assumptions (temporary)

* 范围覆盖 `public/assets/voice/` 中所有当前角色语音 Ogg，并覆盖仇远当前仍走 TTS 的系统语音；不包含 BGM、SFX、其他角色 TTS 或招募演出音频。
* 推荐目标暂定为 `-18 LUFS integrated`、`-2 dBTP`；这接近当前实际播放中位响度，并给 Vorbis 重编码和混响保留峰值余量。
* 批处理应通过仓库脚本复现，先写入临时目录，验证成功后再逐个替换精确目标文件。
* Git 历史作为原始二进制资产的回退来源，不额外提交一份备份副本。

## Open Questions

* 无；需求已确认。

## Requirements (evolving)

* 对全部角色语音采用统一、可解释的响度标准。
* 仇远除已有两个技能语音候选外，`game-start`、`sortie`、`byo-yomi-start`、两个剩余读秒事件、`countdown-10` 到 `countdown-1` 和三个结果事件都必须纳入一致性处理。
* 仇远上述 18 个事件使用 `Microsoft Kangkang` 生成固定静态语音，并通过 `CHARACTER_SYSTEM_VOICES.qiuyuan` 显式映射；运行时不再为这些事件落入浏览器 TTS。
* 处理后不得出现超出目标 True Peak 的文件。
* 保持文件路径和角色语音映射不变，避免改动调用方和预加载契约。
* 保持原声道数与采样率；使用高质量 Vorbis 编码，尽量降低二次有损编码影响。
* 对无法直接执行 integrated loudness 校准的极短片段采用确定性回退策略。
* 提供 dry-run/分析与 apply/校准能力，避免人工逐文件处理。
* 提供可独立运行的响度漂移检查命令，使后续新增或替换语音能在不改写文件的情况下验证标准。
* 没有角色的准时宝必须以 `botProfile.id = "zhunshibao"` 保留独立语音身份，其读秒系统事件使用现有中文 TTS，不能因通用角色兼容回退播放西格莉卡静态语音。
* 更新音频系统设计文档，并重新生成 `docs/system-design.html`。

## Acceptance Criteria

* [x] 全部目标语音文件都能被脚本扫描、校准并重新解码。
* [x] 可测得 integrated loudness 的文件达到选定目标容差，且 True Peak 不超过上限。
* [x] 极短片段满足回退响度和峰值标准。
* [x] 校准后 Web Audio 与普通 `Audio` fallback 不再采用互相矛盾的响度修正规则。
* [x] 既有 169 个语音路径保持不变，并只新增仇远确认过的 18 个系统语音路径。
* [x] 仇远当前 18 个 TTS 系统事件按确认后的方式纳入校准并有解析测试覆盖。
* [x] 仇远 18 个新增静态语音使用 `Microsoft Kangkang` 声线，事件文本与当前 TTS 文本一致。
* [x] 相关单元测试、音频验证、`npm run docs:system-design` 与适当的项目质量门通过。
* [x] 仓库提供可重复运行的校准命令与只读漂移检查命令，错误时返回非零退出码。
* [x] 准时宝进入读秒时解析为 TTS，且回归测试证明不会落入西格莉卡静态语音。

## Definition of Done

* 批处理脚本与自动验证落库。
* 目标语音资产完成批量校准。
* 运行时播放逻辑与新的源资产契约一致。
* 系统设计文档及生成 HTML 同步更新。
* 未暂存、未提交任何进入本任务前已经存在的商店/服装 WIP。

## Out of Scope (explicit)

* 不对现有静态素材重新配音、不改变台词、不修改播放时机；仇远现有浏览器 TTS 例外，按用户选择固化为静态 TTS 资产。
* 不调整 BGM、SFX、仇远以外的 TTS 或全局用户音量默认值。
* 不改变现有轻量空灵混响的听感，除非仅为避免双重响度校准所需。

## Technical Notes

* 运行时实现：`src/shared/voiceEffects.js`、`src/audio/playback.jsx`。
* 音频设计事实：`docs/system-design/05-assets-audio-preload.md`。
* 资产目录：`public/assets/voice/`。
* FFmpeg 已在当前环境可用。
* 仇远目前只有 `qiuyuan_skill_cast.ogg` 与 `qiuyuan_skill_cast_1.ogg` 两个技能语音候选；其余 18 个标准系统事件因没有 `CHARACTER_SYSTEM_VOICES.qiuyuan` 映射而落入 `SpeechSynthesisUtterance`。
* 浏览器 `SpeechSynthesisUtterance` 不暴露可供 Web Audio 测量的音频缓冲区，具体声线和实际响度由操作系统/浏览器决定，因此无法像静态 Ogg 一样通过 LUFS/True Peak 做可重复校准。

## Research References

* [`research/loudness-calibration.md`](research/loudness-calibration.md) — EBU R128、ITU-R BS.1770 与 FFmpeg 双遍校准约束，以及在本仓库中的可行方案。

## Feasible Approaches

### A. 源资产双遍 LUFS 校准，并移除运行时 RMS 修正（已选择）

* 使用 FFmpeg 对全部角色语音做双遍校准，普通片段以 LUFS/True Peak 为标准，极短片段使用 RMS/峰值回退。
* Web Audio 继续负责统一 voice 通道与混响，但不再按文件 RMS 二次改变增益；普通 `Audio` fallback 因源文件已统一而获得相近响度。
* 优点：两条播放路径一致，文件离线试听也一致，没有运行时响度清单维护成本。
* 缺点：169 个 Ogg 需要高质量二次编码，产生较大的二进制 diff。

### B. 保留源文件，生成逐文件响度增益清单

* 扫描资产后生成 `src` 到 gain 的清单，Web Audio 播放时按 LUFS 差值加权。
* 优点：不重编码现有素材，二进制资产不变。
* 缺点：普通 `Audio.volume` 在 100% 用户音量下无法对偏轻文件继续放大；新增语音必须同步更新清单；降级路径仍不一致。

### C. 仅处理异常值，保留现有运行时 RMS

* 只重编码超出容差的文件，其余维持当前算法。
* 优点：二进制修改少。
* 缺点：保留 RMS 与 LUFS 的双重标准，无法真正保证角色间一致，未来仍容易反复出现同类问题。

## Decision (ADR-lite)

**Context**：现有 Web Audio RMS 修正与普通 `Audio` fallback 行为不一致，且不能保证人耳感知响度一致。

**Decision**：用户选择方案 A，全量离线校准静态角色语音，并移除运行时逐文件 RMS 修正。仇远当前 18 个 TTS 系统事件使用 `Microsoft Kangkang` 中文成年男声固化为静态 Ogg 后一并校准。

**Consequences**：获得跨播放路径一致、可离线验证的资产契约；仇远语音不再随操作系统/浏览器改变。代价是批量重编码 Ogg、增加 18 个静态资产，并需要为极短语音提供确定性回退。

## Final Confirmation

用户已确认按上述范围实施，并要求保留可复用校准/漂移检查脚本；其他角色仍缺失的 TTS fallback 静态化不在本次范围。

## Implementation Result

* `public/assets/voice/` 现有 187 个 Ogg 全部通过 `npm run check:voices`。
* 135 个常规片段的 integrated loudness 范围为 `-18.65` 到 `-17.93 LUFS`，平均 `-18.03 LUFS`。
* 52 个短片段的 RMS 范围为 `-19.2` 到 `-18.3 dBFS`，平均 `-18.96 dBFS`。
* 琳奈可测片段平均为 `-18.05 LUFS`。
* 最终 Ogg True Peak 严格不超过 `-2 dBTP`。
* 准时宝的无角色 botProfile 语音身份已与西格莉卡兼容回退隔离，读秒使用浏览器/系统 `zh-CN` TTS。
