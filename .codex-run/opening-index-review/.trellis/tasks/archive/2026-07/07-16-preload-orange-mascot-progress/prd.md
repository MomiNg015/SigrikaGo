# 加载进度条橘橘宝滚动动效

## Goal

提高所有共用加载页进度条的可见高度，将已加载进度改为橘色，并让用户提供的橘橘宝图片始终以中心对齐当前加载进度末端，随真实进度从左向右移动并顺时针滚动。

## Requirements

- 共用 `AssetPreloadScreen` 的启动加载、对局资源加载和教学加载入口统一采用新进度表现。
- 进度条高度由当前 8px 提高到 16px。
- 进度填充使用橘色，Bright School 等主题不得把它覆盖回粉色或其他颜色。
- 使用 `C:/codex/image/main/jindutiao.png` 作为橘橘宝资源，保持透明背景，不修改图片内容。
- 橘橘宝高度固定为进度条高度的 3 倍，即 48px；宽度自动，禁止非等比拉伸。
- 橘橘宝中心始终位于“已加载进度”的末端，而不是整个轨道末端。
- 进度增加时，橘橘宝向右移动并顺时针旋转；填充和橘橘宝使用同一真实进度变量，避免视觉脱节。
- 进度填充使用由浅到深的橘色渐变；进度超过 1% 的明显变化时停止跳动，连续 600ms 无明显变化或只变化 1% 时原地上下跳动。
- 进度轨道两侧为橘橘宝预留半个图宽，确保 0% 和 100% 时图片仍完整可见。
- `prefers-reduced-motion: reduce` 下保留准确进度位置，但取消平移动画插值和旋转。

## Acceptance Criteria

- [x] 0%、50%、100% 时，填充比例和橘橘宝中心位置分别对应轨道左端、中点、右端。
- [x] 进度条计算高度为 16px，橘橘宝计算高度为 48px。
- [x] 橘橘宝使用 `height` + `width: auto` / 自然宽高比，不存在独立宽高拉伸。
- [x] 进度填充在默认主题和 Bright School 中均为橘色。
- [x] 橘橘宝随进度增加顺时针旋转，并在减少动态效果模式下停止旋转。
- [x] 橘色渐变正确显示；明显移动时停止跳动，600ms 停滞或近乎停滞时恢复原地跳动。
- [x] 图片具有空 alt（装饰图），加载条保留完整的进度无障碍名称。
- [x] 组件测试、样式契约、完整 `npm run check` 通过。
- [x] 系统设计文档及生成 HTML 同步更新。

## Technical Approach

- `AssetPreloadScreen` 在进度舞台上设置统一的 `--preload-progress` 自定义属性。
- 填充使用 `transform: scaleX(var(--preload-progress))`，从左侧为原点变化。
- 橘橘宝使用绝对定位，`left: calc(var(--preload-progress) * 100%)` 对齐填充末端；旋转角度由同一进度变量计算。
- 使用短线性 transition 平滑真实进度的离散更新；只有停滞/近乎停滞状态启用有界位移的循环跳动，明显进度变化立即停跳。
- 资源落到 `public/assets/preload/orange-mascot.png`，加载页以高优先级、eager 图片方式引用。

## Decision (ADR-lite)

**Context**：图片必须跟随真实进度，而不是播放与加载状态无关的循环动画。

**Decision**：位置、填充比例和旋转角度共享同一个规范化进度值；减少动态效果时只取消动画插值和旋转，不改变最终位置。

**Consequences**：视觉反馈始终与真实加载进度一致；图片在不同视口中只按进度条高度等比缩放。

## Out of Scope

- 不修改预加载资源分组、网络并发、超时或重试逻辑。
- 不改角色立绘、加载提示轮播或加载页整体排版。
- 不编辑、裁切或重新生成用户提供的橘橘宝图片。

## Validation

- 浏览器桌面 1280px 检查：进度条计算高度 16px，橘橘宝 48x48，渐变正确，50% 中心与填充末端完全重合，无横向溢出。
- 动效状态检查：30% 明显移动时 `animation: none`，600ms 后恢复 `hop`，随后 1% 变化继续保持跳动。
- 浏览器端点检查：0% 中心等于轨道左端、100% 中心等于轨道右端，图片两端均完整留在视口内；25% 使用正向 180deg 旋转进度。
- 原图与项目资源 SHA256 均为 `3B234A8282F8BE0A488E5A25435C899AD5D89DEE1BC21822DFDBAA3B2F6D983A`。
- 聚焦测试：`npx vitest run src/app/AssetPreloadScreen.test.jsx src/app/AssetPreloadScreen.dom.test.jsx src/styles/cssLayerInventory.test.js`，33 项通过。
- 完整门禁：`npm run check`，282 个测试文件、1994 项测试、生产构建、生产配置校验及系统设计 HTML 生成全部通过。
- `git diff --check` 通过，仅有工作区既有 LF/CRLF 提示。
