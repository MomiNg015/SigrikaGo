# 制作与核验结果
- 独立交付目录：C:/Users/Moming/.codex/visualizations/2026/10/02/01a0fb2f-41c4-7373-aade-6f8b09c8f56d/amis-sprite-expressions
- 8张832×1216表情PNG和原图；8组×5五官的分层PSD；面部/全身预览。
- 原图SHA256：d93d0cb4492b7ed530cd36c00db2e0d73f9edbbdaddc6cadfe56c7a68cd40d47，附件与工作包源一致。
- PNG画布/Alpha/允许区域外RGBA全部精确一致；身体y≥285和鼻ROI[383,190,399,204]差异0。
- PSD逐组独立渲染实际最大RGB/Alpha差异均1；默认smile、备份及体底三项锁定；没有Photoshop实机复核。
- 两个本包脚本node --check通过；2张试构和最终8张构建/像素验证通过。未改应用源码，应用lint/typecheck/unit tests不适用于本包。
- 嘴净脸边缘恢复54个肤色像素，修正RGB/Alpha不同缩放的尾部错配；鼻区在底图和图层明确冻结。配置/代码/遮罩/修补报告保留包内。
- 完整提示词与全部9张原生候选留档；宿主原生image_gen生成。
- 项目spec和system-design没有新增运行、接口、资源体系或样式事实，本包尚未接入游戏资产。
