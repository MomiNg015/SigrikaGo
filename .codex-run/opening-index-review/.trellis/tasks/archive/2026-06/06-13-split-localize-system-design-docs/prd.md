# Split and Localize System Design Docs

## Goal

拆分过长的 `docs/system-design.md`，把系统设计文档整理为中文优先、主题清晰、可继续渲染为 HTML 的文档集，同时处理现有工作流里“看起来像乱码”的编码风险。

## What I Already Know

- 用户希望优先处理系统设计文档：拆分、中文化，并解决乱码问题。
- 项目规则要求每次更新同步 `docs/system-design.md`。
- `docs/system-design.md` 当前约 224KB，约 1400 行，已经包含总览、功能、数据模型、API、技术债、音频、移动端、实时性能、Trellis 等多个主题。
- `scripts/render-system-design-html.mjs` 当前只读取 `docs/system-design.md` 并生成 `docs/system-design.html`。
- `docs/systemDesignHtml.test.js` 当前验证 HTML 由 Markdown 生成，并检查 `U+FFFD` 替换字符，但不能发现合法 UTF-8 mojibake。
- Node 以 UTF-8 读取 `docs/system-design.md`、`prisma/schema.prisma`、`src/modals/GachaModal.jsx` 时中文正常；PowerShell/工具输出显示的乱码更像终端输出解码问题，不是源文件已经损坏。
- 当前工作区已有用户/前序任务未提交改动，本任务应避免触碰无关文件。

## Assumptions

- `docs/system-design.md` 应继续作为入口文档，而不是被删除或变成空壳。
- 细分文档可放在 `docs/system-design/` 下，并由入口文档链接。
- `docs/system-design.html` 仍应由脚本生成并提交，因为仓库当前已有该生成物和测试。
- `docs/system-design.pdf` 不是本次必改项，除非现有脚本或测试要求。

## Open Questions

- None.

## Requirements

- 将 `docs/system-design.md` 拆成中文主题文档，降低单文件维护压力。
- 保留 `docs/system-design.md` 作为中文总入口，说明如何阅读各分篇。
- 采用中等粒度拆分，约 6-8 个分篇，优先覆盖概览、前端、后端/API、数据模型、资源音频、UI/移动端、性能与技术债、工作流。
- 保持 `npm run docs:system-design` 可用，并让生成的 `docs/system-design.html` 反映新的文档结构。
- 增强编码/乱码风险检测，至少覆盖 `docs/system-design.md`、分篇 Markdown 和生成 HTML。
- 避免改动与系统设计文档无关的业务代码。
- 不直接修改 `AGENTS.md`，但给出推荐改法。

## Acceptance Criteria

- [ ] `docs/system-design.md` 明显缩短，并链接到分篇文档。
- [ ] 新增的分篇文档均为中文，主题边界清晰。
- [ ] 旧文档中的重要设计信息没有被丢失，至少被迁移或摘要链接。
- [ ] 渲染脚本支持新的入口/分篇结构，或入口文档能完整导向分篇。
- [ ] 编码测试能防止 `Unicode replacement character` 和常见 mojibake 片段进入系统设计文档集。
- [ ] `npm run docs:system-design` 通过并更新 `docs/system-design.html`。
- [ ] 相关测试通过。

## Definition of Done

- Tests added/updated where appropriate.
- `npm run docs:system-design` succeeds.
- Relevant docs are updated in UTF-8 without replacement characters.
- Changes stay scoped to system-design docs, render/test scripts, and task metadata.

## Out of Scope

- 不重写业务架构本身。
- 不重建 PDF 发布流程，除非实现中发现必须同步。
- 不修复 PowerShell/终端本身的输出编码设置。
- 不处理仓库中已有的无关未提交改动。

## Technical Notes

- Relevant files inspected:
  - `docs/system-design.md`
  - `docs/system-design.html`
  - `docs/systemDesignHtml.test.js`
  - `scripts/render-system-design-html.mjs`
  - `scripts/write-utf8-doc.mjs`
  - `package.json`
- Existing quality gate: `package.json` has `docs:system-design` and includes it in `npm run check`.
- Existing renderer uses a small custom Markdown renderer; any split strategy should keep this simple unless there is a clear need for a dependency.

## Decision (ADR-lite)

**Context**: `docs/system-design.md` 已经过长，继续把所有更新集中写入一个文件会降低检索和维护效率；同时仓库规则仍需要一个稳定入口。

**Decision**: 采用中等粒度拆分。`docs/system-design.md` 保留为中文总览入口，详细内容迁移到 `docs/system-design/*.md` 分篇；渲染脚本组合入口和分篇生成 HTML。

**Consequences**: 后续更新可以改对应分篇而不是扩写入口文档；需要更新渲染脚本和编码测试来覆盖分篇文档。
