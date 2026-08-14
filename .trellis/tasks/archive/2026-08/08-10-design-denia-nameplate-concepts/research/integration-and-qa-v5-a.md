# v5 A 正式接入与验证

## 选择与资源

- 用户选择：v5 A「偏心珠光泡」。
- 源图：`concepts/v5-soft-dream-bubble/source/a-off-center-pearl-bubble.png`。
- 透明候选：`concepts/v5-soft-dream-bubble/candidates/a-off-center-pearl-bubble-1125x240.png`。
- 正式资源：`public/assets/achievements/denia-spark-100-wins-nameplate.png`。
- 精确资产 ID：`reward-denia-spark-100-wins-nameplate`。
- 运行时尺寸与内容区：`150 x 32`，左 `40px`、右 `25px`。

## 资产校验

- 画布：`1125 x 240`，RGBA。
- Alpha bounds：`x=56..1068`、`y=12..227`。
- 透明边距：左/上/右/下 `56/12/56/12`。
- 用户名安全区：`x=300..938`，安全比例 `0.567111`。
- 结果文件：`final-asset-validation.json`，无错误。

## 动效约束

- 珠光膜面、柔和折射与短尾回卷只使用位移和透明度。
- 不使用缩放、旋转、脉冲光球、同心圆环、黑洞核心或贯穿全宽的实体扫光。
- `prefers-reduced-motion` 下冻结动态层，并保留静态层次和文字可读性。

## 预览

- 预览使用真实 `UserIdentity` 和完整 CSS 级联。
- 已检查桌面 `1440 x 900`、窄屏 `1024 x 768`、手机 `375 x 812` 的动态与减少动态效果状态。
- 截图目录：`research/nameplate-preview-v5-a/`。
- 英文、四字中文、超长省略用户名、称号和徽章均未出现裁切或错位。

## Impeccable 检查分类

- 精确检测共 36 条 advisory：35 条颜色、1 条字体。
- 达妮娅精确资产 CSS 的 7 条颜色提示均为与选中插画匹配的局部珠光/折射色，范围仅限精确资产 ID，不属于全局主题色漂移。
- `hudComponents.test.js` 的 29 条提示来自 CSS 字符串断言和反模式回归样本，不会渲染为界面，归类为测试代码误报。
- 未添加忽略规则、全局色板或字体例外。

## 自动验证

- 资产校验：通过。
- 聚焦 Vitest：5 个文件、82 项测试通过。
- `npm run docs:system-design`：通过。
- `npm run build`：通过。
- `npm run check:built-css`：通过。
- `npm run check`：Lint、348 个测试文件/2474 项测试与 18 个角色立绘校验通过；随后被工作区原有的后台默认快照差异阻断，待导出的分类为 `siteSettings`、`shopItems`、`storyScripts`，与本次铭牌修改无关。
