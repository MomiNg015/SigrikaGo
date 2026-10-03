# 换电脑开发交接说明

## Goal

将当前项目状态和换机接续步骤保存为仓库内文档，让另一台电脑上的 Codex 在获取代码及本地数据后可以接着开发。

## Requirements

- 创建 `docs/development-handoff.md`，记录分支、HEAD、近期工作、未提交改动边界和已有验证来源。
- 给出首次 clone、已有仓库 pull、依赖安装、本地数据库和上传资源迁移的步骤。
- 记录项目约定、Trellis 入口、个人技能与记忆的迁移边界，以及新聊天可直接使用的接续提示。
- 在 `docs/system-design.md` 添加入口，并重新生成 HTML。
- 区分历史测试记录和本次文档验证，不把历史结果当作当前工作树的全面验证。

## Acceptance Criteria

- [x] 交接文档内容来自当前仓库检查，链接和脚本名称准确。
- [x] 未将 `.env`、数据库、凭据或个人配置值写入文档。
- [x] 文档包含具体接续步骤和最近工作的完成边界。
- [x] 系统设计入口与 HTML 同步，相关本地链接有效。
- [x] 未修改业务代码，未提交或推送原有工作。

## Technical Approach

只读检查 Git、运行脚本、文档和最近的 Trellis 记录；对最近工作与迁移步骤并行核对后，编写一个稳定路径的 Markdown 交接文件，系统设计入口只增加文档导航。

## Out of Scope

业务功能修改、完整项目复测、数据库初始化或迁移执行、Git 提交与推送、迁移包制作。

## Technical Notes

- 当前主目录 `C:/codex/SigrikaGo`，分支 `codex/battle-paper-panels`。
- 工作树已有大量并行改动，保留其边界。
- 当前 `.trellis`、`.agents`、`.codex` 和 `AGENTS.md` 已被 Git 跟踪；个人用户目录中的技能、记忆和配置仍需另行迁移。
- 复制现有可运行数据库与迁移数据库版本是不同操作，不对所有旧库无条件执行 Prisma migration 或 db push。

## Validation

- `npm run docs:system-design` 通过。
- `npm test -- docs/systemDesignHtml.test.js`：4 项通过。
- 交接文档 18 个本地链接、代码围栏、UTF-8 和 HTML 入口核对通过。
- 文档范围 `git diff --check` 通过。
- 未复跑业务全量测试；历史结果已明确归属阶段和验证边界。
- 本任务归档与会话记录使用 `--no-commit`，交接文档和已有工作由用户后续统一决定提交范围。
