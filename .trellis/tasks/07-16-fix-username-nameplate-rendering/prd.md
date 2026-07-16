# 修复用户名铭牌真实主题渲染

## Goal

修复“点亮语义”用户名背景在真实 Bright School 首页中呈现为扁小、发虚、深色文字的问题，使其恢复为高对比、占满 120×32 槽位、具有清晰核心/名条/尾迹层次和完整常驻动效的游戏铭牌。

## Requirements

- 保留资产 ID、URL、UserIdentity 公共接口和 120×32 基础槽位。
- 重制 `/assets/achievements/semantic-nameplate.png`，维持 900×240 RGBA 与 3.75:1；可见主体高度至少占画布 82%，四角保持透明。
- 左侧核心保持圆形，名字条加厚，右侧能量尾清晰；不得烘焙用户名。
- 在所有主题与最终移动层之后提供精确资产 ID owner，恢复浅色文字、深紫描影、高对比度和固定槽位。
- 精确 owner 恢复效果层溢出且不改变外层页面布局；普通铭牌继续保持原样。
- 真实 Bright School 首页 computed style 必须显示浅色文字、非空 text-shadow、120×32×场景 scale 尺寸、运行中的四组动画和不被 tag 自身裁切的效果层。
- 同步测试、CSS inventory、系统设计和 Trellis 规范。

## Acceptance Criteria

- [x] 900×240 PNG 四角透明，可见 Alpha 边界高度 ≥197px。
- [x] Bright School 首页用户名为浅色，text-shadow 不为 none。
- [x] 该资产的 name tag 使用固定 `--user-nameplate-width/height`，tag 和 effect overflow 为 visible。
- [x] 最长合法英文与 4 个中日韩字符完整显示；历史超长名仍省略。
- [x] 普通图片铭牌无专属样式变化。
- [x] 真实 Bright School 页面在 1440×900、1024×768、375×812 下无横向溢出或统计区覆盖。
- [x] focused tests、`npm run check` 与对局回归门禁通过。

## Technical Approach

- 使用 image generation 对当前橙紫铭牌做比例修订，明确核心直径、名条厚度和最低垂直占用，再走纯色键抠图与 900×240 Alpha 校验。
- 新增最终加载的 exact-asset owner，避免早期 HUD owner 再次被 Bright School 和 mobile-adaptive 的广域 `!important` 重置覆盖。
- 用真实主题壳/已装备测试页面检查 computed style winner 和截图，不以共享 CSS 独立页面代替最终验收。

## Out of Scope

- 不修改数据库、成就条件、奖励发放和后台配置。
- 不重做其他铭牌、称号、徽章或首页学生证布局。
