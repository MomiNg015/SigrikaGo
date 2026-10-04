# 星炬学院官方纹章素材

## 已选原图

- 文件：`research/assets/startorch-official-original.webp`，下载后未重采样、未绘制、未改像素。
- 原图 URL：https://wutheringwaves.kurogames.com/static4.0/assets/logo-xjxy-big-ddbed192.webp
- 官方页面：https://wutheringwaves.kurogames.com/en/main
- 官方页面引用的 JS：https://wutheringwaves.kurogames.com/static4.0/assets/index-3a7e0d27.js
- JS 变量：`logoXjxyBig`；资源原名：`../assets/images/desktop/role/logo-xjxy-big.webp`。
- 原始规格：WebP，422 × 344，RGBA（4 通道），15,032 bytes，有透明背景。
- Alpha 实测范围：0–106。官网原图自带淡水印透明度，最终显示强度不能按全不透明图再叠加过低的 CSS opacity。
- SHA-256：`ddbed192889361bf65a7c77882dd6f2ff273c71ed465e9a51418c8d45c71d60d`。

## 核对结论

已使用本地 `view_image` 查看原图，与用户参考 `codex-clipboard-7ccf975a-56e8-466f-ae9a-7cb404039f78.png` 对照。中央 DNA 双螺旋与外围断开的三角轮廓一致，没有文字、背景矩形或其他校徽元素。来源为当前库洛官方鸣潮角色页面资源，不采用二创商店徽章或推测纹章。

保留原生尺寸即可用于背景淡纹样；无需放大到 2048px。原图透明边距可在最终实现时按现有背景几何处理。本调查未编辑生产代码、最终资产，未启动浏览器或运行测试。

## 其它调查记录

- 英文学院专题站 `startorch.kurogames-global.com` 与中文 `scsa.kurogames-global.com` 当前发生 TLS EOF；未采用失效页面。
- Fandom 仅搜索索引可读、页面受 robots 限制；Bwiki 图像查询受安全策略拦截，未绕过限制。
- 官方主站 HTML 与上述 JS 正常公开可读，最终从其明确列出的资源 URL 下载。
