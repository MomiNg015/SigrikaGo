# 瑝珑纹章来源核验

- 页面：<https://www.wegame.com.cn/act/wegame/mcOrder/>，《鸣潮》×WeGame 定制预约活动。
- 原始素材：<https://wegame.gtimg.com/tgp_act/release/wegame/mcOrder/images/updata/role_logo2.png>。
- 页面自身的 `roleArr.huanglong` 中所有瑝珑角色引用 `logo:"role_logo2.png"`；官网联动页面与其素材 CDN 直接对应。
- PNG 原尺寸 422×344，RGBA，32994 bytes；非截图裁切或缩略图放大。版权归原游戏素材权利人 KURO GAMES；不将公开下载等同于开放许可。
- 对照用户第一张参考：正面龙首、两侧角须和横向环绕曲线一致。先 view_image 检查原文件，再用深色背景的临时预览检查低 alpha 轮廓（原文件本身保持字节不变）。
- 原文件 alpha 最大为 51/255，其内部 RGB 为淡灰色；这是网页自带的背景水印版本。展示 mask 通过 CSS 强度倍率 5 补偿原素材 alpha，保持透明空白，不生成或重绘纹章。
- 最终采用同图的鸣潮官网本源版本：<https://wutheringwaves.kurogames.com/static4.0/assets/logo-hl-big-b7dfb835.png>。官网 <https://wutheringwaves.kurogames.com/en/main/> 的 `index-3a7e0d27.js` 引用此资源；PNG 422×344，18906 bytes，alpha 最大仍为51。再次 view_image 对照同一龙首轮廓，使用原文件字节不变。官网另一 `logo-hl-big1-d1a2da46.png` 为相同纹章的渐隐背景版本，未采用。
- 生产路径 `public/assets/factions/huanglong.png`。SHA256 `b7dfb83599b4cbe256fd5bcb12c35bb904aa3a841e57d1edaef97376b8389d11`，与最终统一 manifest 一致。

寻找过程：先通过可读的官方联动页面核对瑝珑用途，后来并行学院研究找到当前鸣潮官方完整 logo 包，因此三枚最终素材统一使用当前官网资源。Fandom 页面与 BWIKI API 当前访问有限，未使用其素材。
