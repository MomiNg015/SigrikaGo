# 完善邮件发件人字段与展示

## Goal

为邮箱系统增加独立的文本型“发件人”字段。管理员发送邮件时必须填写发件人；玩家在邮件列表和邮件正文中都能清楚看到该邮件由谁发出。

## What I already know

* 邮件由后台 `AdminMailbox` 表单创建，通过服务端邮箱领域校验后生成 `MailboxBatch`，再为收件用户生成 `MailboxMessage`。
* `MailboxBatch` 与 `MailboxMessage` 当前都会保存标题、正文和附件快照；面向未来用户的全体邮件会稍后从批次生成消息。
* 玩家邮箱使用共享 `InformationCenterLayout`：桌面为列表/正文双栏，移动端为列表进入正文。
* 后台管理界面不需要适配移动端；玩家邮箱需继续以竖屏移动端为主要移动场景。
* 项目要求行为与数据模型更新同步到系统设计文档，并重新生成 `docs/system-design.html`。

## Assumptions

* 发件人是管理员填写的展示文本，不自动绑定管理员账号名。
* 发件人应作为发送时快照同时保存在批次和用户邮件中，确保历史邮件与未来补发保持一致。
* 新邮件在前端使用原生 `required` 提示作为第一层校验，服务端仍执行去空格、非空和长度校验。

## Requirements (evolving)

* `MailboxBatch` 与 `MailboxMessage` 增加文本型 `sender` 字段。
* 后台发送表单增加“发件人”输入框，并在每次发送新邮件时强制填写。
* 服务端拒绝缺失、仅包含空白或超过 40 个字符的发件人，防止绕过后台界面直接调用接口。
* 批次投递给当前用户或未来用户时，将批次的发件人快照复制到用户邮件。
* 管理员最近发送历史展示发件人。
* 玩家邮件列表展示发件人；邮件正文标题区域展示发件人。
* 保持现有已读、附件、删除、排序及移动端列表/正文导航行为不变。
* 升级前没有发件人数据的历史邮件统一显示“系统”，不暴露后台管理员账号名。

## Acceptance Criteria (evolving)

* [ ] 后台未填写发件人时不能发送，并获得明确错误提示。
* [ ] 直接请求发送接口但缺少发件人时返回 400。
* [ ] 新邮件批次和投递消息均持久化同一个发件人文本。
* [ ] 面向未来用户的邮件在之后生成消息时仍保留原发件人。
* [ ] 玩家在桌面和竖屏移动端的邮件列表、正文中都能看到发件人。
* [ ] 管理员发送历史中能看到发件人。
* [ ] 升级前的历史邮件在列表和正文中稳定显示发件人“系统”。
* [ ] 现有邮箱领域、路由和前端组件测试补充发件人覆盖并通过。

## Definition of Done (team quality bar)

* Tests added/updated (unit/integration where appropriate)
* Lint / typecheck / CI green
* `docs/system-design.md` 邮箱摘要已更新
* 已运行 `npm run docs:system-design` 生成 `docs/system-design.html`
* 旧数据库启动升级路径和历史数据展示已验证

## Out of Scope (explicit)

* 不增加发件人头像、账号关联、可点击资料或自动签名。
* 不增加玩家回复邮件能力。
* 不重新设计邮箱布局、状态色或附件交互。
* 不为后台管理界面增加移动端适配。

## Decision (ADR-lite)

**Context**: 旧数据库中的邮件批次与用户邮件没有显式发件人；现有 `adminUsername` 是内部操作账号，并不等同于管理员希望展示给玩家的发件人名称。

**Decision**: 新邮件要求管理员填写展示型发件人并同时快照到批次和消息；旧邮件缺少该字段时统一按“系统”展示。

**Consequences**: 不会误把内部管理员账号暴露为对外发件人；历史邮件保持可读。旧邮件无法恢复原本未记录的展示名称，这是可接受的兼容限制。

## Technical Approach

* 为 `MailboxBatch` 和 `MailboxMessage` 增加非空文本字段，数据库兼容默认值为 `""`；运行期 payload 对空值归一化为“系统”。
* 发送接口对新请求的 `sender` 执行去空格、必填和最多 40 字符校验，批次投递时复制到每条用户邮件。
* 后台表单增加原生必填输入，并在发送历史表增加发件人列。
* 玩家列表在标题之外增加发件人次级信息，正文标题区域增加明确的“发件人：…”元信息；沿用现有响应式结构与样式层级。
* 更新 Prisma migration、启动期旧库补列逻辑、领域/API payload、前端组件、测试和系统设计文档。

## Technical Notes

* 数据模型：`prisma/schema.prisma` 的 `MailboxBatch`、`MailboxMessage`。
* 运行期旧库兼容：`server/mailbox.js` 的 `ensureMailboxSchema`。
* 发送、投递与 API payload：`server/mailbox.js`。
* 后台表单与历史：`src/admin/AdminMailbox.jsx`、`src/styles/admin/mailbox.css`。
* 玩家列表与正文：`src/modals/MailboxModal.jsx`、`src/styles/modals/mailbox/`。
* 测试：`server/mailbox.test.js`、`server/mailboxRoutes.test.js`、`src/admin/AdminMailbox.test.jsx`、`src/modals/MailboxModal.test.jsx`。
* UI 延续 PRODUCT.md 的 product register：后台保持安静、密集、任务导向；玩家端只新增清晰的信息层级，不增加装饰性动效或额外弹窗。
