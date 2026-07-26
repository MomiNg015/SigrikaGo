# 角色语音响度校准研究

## Primary references

* ITU-R BS.1770-5: https://www.itu.int/rec/R-REC-BS.1770-5-202311-I
  * 定义节目响度与 True Peak 的客观测量算法，目标是让不同来源的主观响度更一致，并避免数字过载。
* EBU R 128 (2023): https://tech.ebu.ch/files/live/sites/tech/files/shared/r/r128.pdf
  * 推荐用 Programme Loudness 做归一化，并以 Maximum True Peak 约束完整信号链的峰值。
* FFmpeg `loudnorm` filter: https://www.ffmpeg.org/ffmpeg-filters.html#loudnorm
  * 支持 EBU R128 integrated loudness、LRA、最大 True Peak，以及适合文件资产的双遍处理。

## Repo constraints

* `public/assets/voice/` 有 169 个 Ogg Vorbis 文件；当前资产已是有损编码，批量重写必须使用高质量设置并做解码验证。
* 角色语音以单声道为主，但存在 5 个双声道文件；测量和输出必须保留声道数。
* 采样率并不完全统一；批处理应读取并保留每个输入文件的采样率，避免 FFmpeg 动态模式默认使用 192 kHz 输出。
* 一些倒计时或短词语音短于 integrated loudness 的有效测量窗口，可能产生非有限测量值；需要 RMS/峰值回退而不是跳过文件。
* 当前运行时 Web Audio 使用整段 RMS 做 `0.4–2.4` 倍修正，普通 `Audio` fallback 只应用 voice 音量。离线校准后继续保留 RMS 修正会破坏 LUFS 结果。

## Common conventions and why they exist

* 用 LUFS 而不是 sample peak 或普通 RMS 对齐跨素材响度，因为 BS.1770 使用频率权重与门限，更贴近人耳主观响度。
* 同时限制 True Peak，因为编码、滤波和重采样后的峰值可能出现在样本之间，sample peak 不能完整反映余量。
* 文件资产使用双遍处理：第一遍测量，第二遍把实测值传回处理器，可重复性与准确性优于一次动态扫描。
* 输出后重新测量，而不是只相信处理命令成功；极短片段、峰值受限素材和编码误差都可能偏离目标。

## Feasible approaches

### Source normalization

全量重写源资产，普通片段按 integrated loudness + True Peak 校准，极短片段按 RMS + 峰值回退；运行时取消逐文件 RMS 修正。

最适合本仓库，因为普通 `Audio` fallback 也会消费同一批已校准素材。

### Runtime gain manifest

保留源资产，生成每个路径的 LUFS offset。它能避免重编码，但 HTML `Audio.volume` 无法在满音量时继续放大偏轻文件，因此无法让 fallback 完全一致。

### Outlier-only rewrite

只处理明显异常文件。二进制 diff 较小，但会留下两套标准和重复回归风险，不适合用户明确要求的批量校准。

## Recommendation

采用源资产双遍校准：

* 普通语音：目标暂定 `-18 LUFS integrated`、最大 `-2 dBTP`。
* 无法得到有限 integrated loudness 的极短语音：用与目标样本集校准后的 RMS 目标及 `-2 dBFS` 峰值限制回退。
* 保留每个文件的声道数和采样率，使用高质量 Vorbis 编码。
* 在临时目录完成全部输出和复测后再替换精确文件列表。
* 移除运行时逐文件 RMS 修正，保留用户 voice 音量、voice boost、倒计时 dry profile 与普通语音混响。

