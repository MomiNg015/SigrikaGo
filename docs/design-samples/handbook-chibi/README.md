# 新版部员手册 Q 版立绘

2026-10-08 用户提供的九张透明 PNG 原图保存在 `assets/characters/`。角色对应为仇远、爱弥斯、长离、千咲、琳奈、莫宁、达妮娅、西格莉卡、娜波摩。

运行 `node scripts/export-handbook-sprites.mjs --chibi` 导出无损 WebP，并逐像素验证透明度和可见 RGB。清单位于 `public/assets/characters/handbook-chibi-sprites/manifest.json`。

随后运行 `node scripts/export-handbook-silhouettes.mjs`，生成未持有角色使用的独立实心 alpha 遮罩和 `silhouette-manifest.json`。遮罩将原图内部半透明像素及闭合孔洞填实，背景连通区域保留透明，原立绘文件不变。

资源仅在普通部员手册条带和全身详情启用。其他共享胸像保留原有立绘。桌面按可见全身边界统一高度和脚底基线，手机竖屏使用独立头部尺寸校准，展开时保留发饰与头顶留白。

| 视口 | 收起 | 展开 | 全身详情 |
| --- | --- | --- | --- |
| 桌面 1440×1024 | [预览](1440-rest.png) | [预览](1440-expanded.png) | [预览](1440-detail.png) |
| 手机 390×844 | [预览](390-rest.png) | [预览](390-expanded.png) | [预览](390-detail.png) |

2026-10-09 修正：第7张橙发双辫图为西格莉卡，第8张粉发白裙图为达妮娅。桌面全身高度88%，脚底基线95%。上表截图属于10月8日历史预览，不代表本次修正；本轮视觉由用户验收。

[2026-10-09 最新视觉验收及截图](verified-2026-10-09/README.md)。用户重新授权 AI 验收，手机展开几何与姓名位置已修正。
