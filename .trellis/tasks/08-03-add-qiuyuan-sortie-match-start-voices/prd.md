# 更新仇远系统语音

## Goal

将用户提供的 `sortie.wav` 与 `match_start.wav` 转换为项目标准 Ogg，并替换仇远现有的出战与对局开始固定语音；再以用户确认的自然中文神经男声替换仇远剩余读秒次数、倒计时和对局结果语音，使这些事件不再使用生硬的本机 Kangkang TTS。

## Requirements

* `C:/codex/musicsour/cVoice/qiuyuan/sortie.wav` 转换并写入 `public/assets/voice/qiuyuan_sortie.ogg`。
* `C:/codex/musicsour/cVoice/qiuyuan/match_start.wav` 转换并写入 `public/assets/voice/qiuyuan_match_start.ogg`。
* 保留 48 kHz、单声道属性，使用项目既有高质量 Vorbis 与离线响度校准流程。
* 保持 `SYSTEM_VOICE_EVENTS.sortie` 与 `SYSTEM_VOICE_EVENTS.gameStart` 的现有路径映射，不改变其它仇远语音。
* 从 `generate-qiuyuan-system-voices.ps1` 的 Kangkang 批量生成清单中移除这两个正式录音路径，避免未来使用 `-Force` 时覆盖。
* 更新系统设计文档，明确这两个事件已由用户提供的新录音替换，不再把仇远全部标准事件描述成同一批 Kangkang 生成语音。
* 不吸收工作区内与本任务无关的现有界面、样式与文档改动。
* 使用用户提供的 69 条、约 9 分 50 秒仇远原声作为角色音色与情绪参考，为 16 个事件生成同一角色的中文参考音色语音。
* 6 条角色化台词固定为：`byo-yomi-start`“听风，入局。”、`byo-yomi-period-2`“还剩两次读秒”、`byo-yomi-period-1`“只剩一次读秒，抓紧脚步”、`result-victory`“落子声尽，胜负自明”、`result-defeat`“一剑迟疑，满盘皆输……”、`result-draw`“下次再决胜负吧。”。
* `countdown-10` 到 `countdown-1` 继续逐项播报数字 10 到 1；数字语音与上述 6 条使用同一角色音色，但按用户要求保持清晰、中性，不做情绪表演。
* 正式批量写入前先生成 6 条角色化台词试听，由用户确认声线、情绪和节奏后再生成完整 16 条目标 Ogg。
* 角色化长句不得只依赖标点自动断句；按语义拆分独立表演片段，并在合成阶段写入明确停顿。失败台词需要遗憾感和自然收尾，不得匀速平读。
* 这 16 个正式参考音色路径必须退出 Kangkang 批量生成清单，避免以后使用 `-Force` 覆盖。
* 技能、出战和对局开始语音不在本轮新增参考音色批次内。

## Acceptance Criteria

* [x] 两个目标文件均为可解码的 Ogg Vorbis、48 kHz、单声道。
* [x] `qiuyuan_sortie.ogg` 对应新的 `sortie.wav`，`qiuyuan_match_start.ogg` 对应新的 `match_start.wav`。
* [x] `npm run check:voices` 通过，最终 Ogg 响度和 True Peak 满足项目静态角色语音合同。
* [x] 仇远系统语音映射与预加载测试继续通过。
* [x] 仇远 Kangkang 生成脚本不再声明或覆盖这两个正式录音路径。
* [x] 系统设计 Markdown 与生成后的 HTML 保持同步。
* [x] 用户已选择进入读秒、剩余两次、胜利、失败使用 V2，和棋使用 V1；剩余一次选择放慢约 6%、句间停顿 600 ms 的 D 版。
* [x] 中性倒计时 10 到 1 已生成、校准并写入现有仇远 Ogg 路径。
* [x] 16 个指定事件均已生成、校准并写入现有仇远 Ogg 路径。
* [x] 6 条角色化台词与事件逐项一致，倒计时 10 到 1 已确认发音清晰且顺序正确。
* [x] 旧 Kangkang 生成脚本已移除，不再拥有任何正式仇远语音路径。

## Definition of Done

* 资源已转换、校准并通过音频探测。
* 相关语音映射/预加载测试与项目质量门禁通过。
* 文档事实与实际资源来源一致。
* 无关工作区改动保持原样。

## Technical Approach

先用 FFmpeg 将两个 24-bit PCM WAV 编码为 48 kHz 单声道 Vorbis，覆盖既有同名仇远 Ogg；参考音色语音使用 IndexTTS2 在本地以 FP16 零样本推理，固定清晰中性片段为音色参考，并按台词语义选择克制、战斗或遗憾片段作为独立情绪参考。试听确认后，全部新语音运行项目的 `voices:normalize` 写入流程完成统一响度校准，再用 `check:voices` 和 `ffprobe` 验证。运行时路径保持不变，无需修改 `src/shared/musicLibrary.js`。

## Decision (ADR-lite)

**Context**: 仓库中已经存在与两个输入文件完全对应的仇远事件和目标路径。

**Decision**: 原路径原位替换资源，不新增事件、不改名、不增加候选随机池。

**Consequences**: 现有缓存、预加载与事件调用保持兼容；部署后同一路径将播放新录音，静态资源缓存仍由现有构建/部署策略处理。

## Out of Scope

* 修改仇远技能语音或运行时事件触发逻辑。
* 调整运行时混响、voice 音量或 BGM 行为。
* 新增后台语音上传管理功能。

## Technical Notes

* 两个输入 WAV 均为 PCM 24-bit、48 kHz、单声道；时长分别约 3.374 秒和 0.600 秒。
* 既有映射位于 `src/shared/musicLibrary.js`：`game-start -> qiuyuan_match_start.ogg`，`sortie -> qiuyuan_sortie.ogg`。
* 静态语音合同位于 `.trellis/spec/frontend/quality-guidelines.md` 的 Voice Playback 场景；写入命令为 `npm run voices:normalize`，只读门禁为 `npm run check:voices`。
* 参考素材位于 `C:/codex/musicsour/cVoice/qiuyuan/reference/`，共 69 条 48 kHz 单声道 WAV，总时长约 589.67 秒。
* 本地推理环境、模型与试听输出均位于项目忽略的 `.tmp/`，不进入项目运行时依赖或 Git 资源。
* 第一版试听的情绪参考权重过低，且完整句子一次性生成，用户反馈为“太生硬、没有情感、没有恰当的停顿”；第二版提高情绪参考强度，并按台词语义拆句后精确合成停顿。
* 用户已选择进入读秒、剩余两次、胜利、失败使用 V2，和棋使用 V1；剩余一次“只剩一次读秒，抓紧脚步”经过两轮试听后选择 D 版：不用喊腔、整体放慢约 6%，两句之间写入 600 ms 停顿。
