# 技能卡声痕素材

- 检索与处理日期：2026-10-22。
- 图案参考：[Seeklogo — Tacet Mark Wuthering Wave](https://seeklogo.com/vector-logo/676655/tacet-mark-wuthering-wave)。这是社区整理参考，不标作官方源文件。
- 下载地址：`https://images.seeklogo.com/logo-png/67/1/tacet-mark-wuthering-wave-logo-png_seeklogo-676655.png`。
- 原始下载为600×600 PNG，保存在本目录 `tacet-mark-source.png`。
- 术语核对：[Tacet Mark / 声痕](https://wutheringwaves.fandom.com/wiki/Tacet_Mark)。图案属于《鸣潮》声痕的视觉参考，不代表每个角色的专属声痕形态。
- 最终资源：`public/assets/ui/handbook-tacet-mark.png`，2079×756透明PNG。使用内置imagegen参考重建并去白底，保留非对称声波尖峰、间隔与小菱形。
- 生产渲染：`handbook-detail-cards.css` 中仅对技能标题的伪元素使用alpha mask，映射到已有 `--detail-ink`，20%透明度、180×72px、轻微倾斜，位于技能名背后。忽略原图RGB边缘颜色，不添加标签、动画或点击区域；简介保留独立的黑白棋装饰。

## 处理提示词

内置 `imagegen` 编辑模式，参考图为上述下载文件，`transparent_background: true`：

> Edit target: the attached black Wuthering Waves Tacet Mark symbol on a white square. Produce a high-resolution, clean, tightly framed TRANSPARENT PNG cutout of precisely this same symbol for a game UI. Preserve the reference's exact asymmetric waveform silhouette, number and position of the separated clusters, small diamond interruptions, narrow horizontal connections, tiny split tips and all major spikes; do not redesign, regularize, mirror or simplify the symbol. Remove ALL the white background and excess square canvas. Enlarge and reconstruct crisp, smooth antialiased edges, solid opaque near-black ink, no white fringe. Landscape canvas roughly 4:1, the mark fills about 92% of width with modest transparent margins and enough top/bottom clearance to preserve its tallest peaks. Target at least 2048 pixels wide. No other objects, no text, no border, no sticker outline, no paper, no shadows, no glow, no bevel, no gradients, no blur or grain. It will be tinted and set to low opacity in CSS behind a skill title, so output the mark only with a real alpha channel.
