# 修复达妮娅糖果动画被静态化

## Goal

恢复达妮娅吃下彩虹豆豆跳跳糖后的动画立绘，并让角色立绘归一化工具能够保留动画 WebP 的全部帧、帧间隔和循环信息，避免以后处理服装糖果特效时再次把动画压成静态首帧。

## What I already know

- 原资源 `public/assets/characters/denia_color.webp` 是 16 帧动画 WebP，每帧 640×640、帧间隔 70ms、无限循环。
- 新资源 `public/assets/characters/portraits/denia-candy.webp` 只有一帧 900×900。
- 回归由 `normalizePortraitBuffer` 使用默认单页读取产生；其余消费者正确引用了新的统一资源路径。
- Sharp 支持以逐帧输入和 `join.animated` 重新编码动画 WebP，并能保留 delay/loop 元数据。

## Requirements

- 达妮娅糖果立绘恢复为动画 WebP，继续使用规范路径 `/assets/characters/portraits/denia-candy.webp`。
- 动画的 16 帧、70ms 帧间隔和无限循环语义必须保留。
- 每一帧使用同一裁边、缩放和底部居中变换，避免动画播放时主体跳动。
- 动画输出继续符合 900×900 单帧画布、792px 安全框和 54px 底部安全边规范。
- 静态角色与服装立绘的现有归一化结果不得改变。
- 校验工具必须识别动画页高而不是把总帧堆叠高度当作单帧高度，并能按资产契约要求动画存在。

## Acceptance Criteria

- [x] `denia-candy.webp` 被识别为 16 帧动画 WebP。
- [x] 输出 delay 全部为 70ms，loop 为 0。
- [x] 动画各帧完整、无拉伸、无逐帧位置漂移。
- [x] `npm run check:portraits` 能验证动画资产且 16 个目录资产全部通过。
- [x] 回归测试证明静态资源保持单帧，动画资源不会被静态化。
- [x] `npm run check` 通过。

## Definition of Done

- [x] Tests cover animated normalization, timing/loop preservation and required-animation validation.
- [x] Generated asset is committed at the existing canonical URL.
- [x] Relevant system design and costume/portrait contract are corrected.
- [x] Lint, tests, portrait validation and build pass.

## Technical Approach

- 读取所有动画帧并计算所有帧 alpha 边界的并集。
- 使用这一份联合边界计算统一缩放和定位，把每帧分别放入相同的 900×900 画布。
- 通过 Sharp animated join 重新编码为无损动画 WebP，并复制源 delay/loop。
- 静态输入继续走原有单帧路径；资产目录为达妮娅基础糖果立绘声明 `requiresAnimation`，让只读校验阻止再次退化为单帧。

## Decision (ADR-lite)

**Context**: 直接回退旧 URL 可以临时恢复动画，但未来的服装糖果动画仍会被归一化脚本静态化。

**Decision**: 修复归一化管线本身，使静态和动画 WebP 共用同一几何规范，同时保留动画元数据。

**Consequences**: 动画处理比静态处理更耗时、文件更大，但写入仅由维护命令触发；CI 只执行校验。

## Out of Scope

- 改动画内容、速度或循环次数。
- 修改糖果剧情、道具概率或效果清除逻辑。
- 改造普通 GIF/视频播放器。

## Technical Notes

- Root cause and Sharp behavior: [`research/animated-webp-normalization.md`](research/animated-webp-normalization.md).
- Runtime catalog: `src/shared/characterPortraitAssetCatalog.js`.
- Normalizer: `scripts/characterPortraitNormalization.mjs`.
- Catalog CLI: `scripts/normalize-character-portraits.mjs`.
