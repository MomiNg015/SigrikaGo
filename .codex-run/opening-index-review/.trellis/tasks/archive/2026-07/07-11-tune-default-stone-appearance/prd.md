# 调整默认棋子尺寸与白棋色调

## Goal

让对局棋盘上的默认黑白棋子更轻巧、耐看：缩小当前偏大的普通棋子，并降低白棋纯白高光带来的刺眼感，同时保持棋子在棋盘上的辨识度与现有 Bright School 视觉语言。

## What I already know

- 用户认为当前默认棋子偏大，且白棋过白、不够美观。
- 普通棋子的共享尺寸由 `src/styles/room/board/stones-skill-effects/stone-base.css` 的 `.stone` 控制，当前为格点的 `92%`。
- Bright School 默认主题在 `src/styles/themes/bright-school/quality-base/refinement-board/stone-position.css` 再次将棋子尺寸强制为 `92%`。
- Bright School 的默认白棋在 `src/styles/themes/bright-school/component-repairs/notebook-polish/tape-rings-stones.css` 使用从纯白到暖黄的径向渐变。
- 装饰棋子通过 `.decorated-stone` 使用独立图片资源，不应被默认棋子配色改动影响。

## Confirmed Decisions

- 将普通棋子直径从 `92%` 调整到 `84%`，在保留落点辨识度的同时增加棋盘留白。
- 白棋改为偏暖的象牙灰渐变，避免大面积纯白高光，但仍与黑棋形成明确区分。
- 本次仅调整普通默认棋子的尺寸与白棋配色，不改棋盘、落子动效、技能特效或装饰棋子资源。

## Open Questions

- None.

## Requirements (evolving)

- 缩小默认普通棋子在棋盘格点中的占比。
- 降低默认白棋的纯白感，保留立体感和黑白辨识度。
- Bright School 默认主题与共享基础样式的尺寸事实保持一致。
- 不影响装饰棋子、技能棋子、棋盘交互和落点位置。

## Acceptance Criteria (evolving)

- [x] 默认普通棋子直径从当前 `92%` 降至 `84%`。
- [x] Bright School 白棋不再以纯白作为大面积高光主色，呈现柔和的象牙灰层次。
- [x] 黑棋外观保持原有视觉方向。
- [x] 装饰棋子图片渲染不受默认棋子渐变影响。
- [x] 相关 CSS 契约测试覆盖尺寸与白棋色调。

## Definition of Done (team quality bar)

- Tests added or updated for the touched CSS contract.
- Relevant focused tests and repository quality checks pass.
- `docs/system-design.md` is synchronized per project instructions; if an existing design fact is affected, update its corresponding system-design section and regenerate HTML.
- Unrelated dirty worktree changes remain untouched.

## Out of Scope (explicit)

- 棋盘尺寸、网格、坐标和落点交互改版。
- 装饰棋子资源或商城预览改版。
- 技能棋子和技能特效视觉调整。
- 黑棋整体风格重做。

## Technical Notes

- Shared stone base: `src/styles/room/board/stones-skill-effects/stone-base.css`
- Bright School stone size override: `src/styles/themes/bright-school/quality-base/refinement-board/stone-position.css`
- Bright School default stone colors: `src/styles/themes/bright-school/component-repairs/notebook-polish/tape-rings-stones.css`
- Existing contract coverage: `src/styles/themeContract.test.js`
- Relevant specs: `.trellis/spec/frontend/css-architecture.md`, `.trellis/spec/frontend/quality-guidelines.md`
