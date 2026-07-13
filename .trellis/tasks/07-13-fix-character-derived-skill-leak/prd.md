# 建立可扩展派生技能模型并修复跨角色污染

## Goal

从数据模型、后台编辑、服务端校验和运行时读取四个边界根治派生技能跨角色污染，使每个基础技能显式拥有自己的派生技能定义，并为未来其他角色增加派生技提供通用扩展路径。

## What I already know

* 当前 bug 表现为后台保存千咲技能描述后，千咲详情多出爱弥斯“远航星”。
* `derivedSkillDraftsFromParams()` 会给任何没有派生技能参数的角色创建默认“远航星”草稿，`characterDraftToBody()` 又会无条件把它写回角色参数。
* `normalizeDerivedSkillDefinition()` 以 `DEFAULT_VOYAGE_STAR_DERIVED_SKILL` 为所有派生技的通用底板，未来新增其他派生技也可能误继承爱弥斯名称、描述、超频和音乐。
* 后台派生技能编辑器只在 `hidden-hand` 基础技能下出现，并且只能编辑固定“远航星”的少数字段。
* 公共模型已经使用 `skill.params.derivedSkills[]`，不需要新增数据库列；问题在于默认值、校验和编辑器仍是爱弥斯特化实现。
* 实际玩法效果由 `effectType` 注册代码执行；数据配置负责描述一个派生技，不能自动创造新的棋盘规则。
* 对局技能 BGM 还有一个同源边界错误：普通技能预览也会携带 `flip-stone`、`liberty-purge` 等玩法 `effectType`，旧解析器把任何非空 `effectType` 都当成派生音乐槽位，导致普通技能无法读取玩家选择的角色技能 BGM；远航星恰好是派生技所以表现正常。

## Requirements

* `skill.params.derivedSkills[]` 成为角色自身拥有的通用派生技能定义，未声明时严格为空，不从其他角色或效果注入默认值。
* 通用规范化使用中性默认值，并依据技能效果目录推导目标规则；不得引用任何具体角色的名称、描述、超频或音乐作为通用默认。
* 爱弥斯“远航星”作为爱弥斯默认角色数据中的显式配置存在，而不是共享解析器的隐式回退。
* 后台角色编辑器是内容编辑器，不是技能设计器：基础技能和既有派生技能只允许修改技能名称、技能描述和超频内容。
* 后台不得新增或删除基础技能、派生技能，也不得修改 `effectType`、目标规则、使用次数、是否消耗回合、超频类别、音乐标识、技能参数、启用状态或系统消息等技能逻辑。
* 技能结构和逻辑由代码、效果目录与角色默认数据显式定义；未来新增角色派生技时通过代码数据增加定义，后台随后自动获得该定义的三个内容编辑字段。
* 后台草稿只覆盖可编辑内容；服务端更新边界必须保留现有技能结构并拒绝新增、删除或篡改技能逻辑的请求，不能只依赖隐藏表单控件。
* 角色详情、音乐槽位和对局共享读取同一个规范化结果，且只读取当前角色基础技能自身的定义。
* 对本次旧 bug 产生的历史污染做精确兼容清理：只识别非爱弥斯角色上与旧默认“远航星”签名一致的错误数据，不永久禁止其他角色合法配置同类派生技。
* 现有爱弥斯“远航星”的生成、详情、音乐和对局行为保持不变。
* 玩法 `effectType` 与音乐槽位 `musicEffectType` 分离：普通技能的音乐类型为空，派生技能使用自身效果类型；pending preview 和最新技能历史保持该语义，旧派生历史通过音轨元数据兼容。
* 不做无关视觉改版；后台删去逻辑控件后仍保持现有表单层级、清晰标签和保存反馈。
* 同步更新 `docs/system-design.md` 和相关分篇，并运行 `npm run docs:system-design`。

## Acceptance Criteria

* [x] 编辑并保存没有派生技能的千咲时，提交和持久化数据不会新增任何派生技能。
* [x] 千咲现有的旧默认“远航星”污染数据会被识别并清理，角色详情不再展示。
* [x] 新建角色默认 `derivedSkills` 为空。
* [x] 后台基础技能只显示名称、描述、超频三个可编辑内容字段；不显示任何技能逻辑控件。
* [x] 后台按代码中已有的派生技能定义显示固定编辑项，每项只显示名称、描述、超频，且没有新增或删除操作。
* [x] 直接请求尝试修改基础技能或派生技能逻辑、增删派生技能时，服务端不会持久化该变更并返回明确错误。
* [x] 一个在代码数据中显式拥有派生技能的非爱弥斯测试角色可以往返更新三个内容字段，且不会继承“远航星”字段。
* [x] 爱弥斯默认“远航星”仍可往返保存，并保持现有对局、详情和音乐行为。
* [x] 千咲、达妮娅等普通技能在携带真实玩法 `effectType` 时仍读取 `musicSelections.skill[characterId]`，爱弥斯远航星继续读取独立派生槽位。
* [x] pending skill 与最新技能历史能区分普通/派生音乐槽位，且旧远航星历史无需数据迁移即可继续解析。
* [x] 管理草稿、服务端角色校验、共享派生技能解析和角色详情回归测试通过。
* [x] `npm run docs:system-design` 与项目质量检查通过，或明确记录与本次改动无关的既有失败。

## Definition of Done

* Tests cover empty, fixed one/multi-item content edits, rejected add/delete or logic mutation, legacy polluted data, and Aemeath compatibility cases.
* Relevant focused tests, docs generation, and broad project checks are run.
* Existing unrelated shop/theme working-tree changes remain untouched.

## Technical Approach

1. 将通用派生技能 schema/规范化/校验集中到共享模块；通用默认只包含中性语义。
2. 从后台草稿工具和共享运行时解析中移除爱弥斯专属自动注入。
3. 将爱弥斯“远航星”写入爱弥斯 fallback/default snapshot 的显式 `params.derivedSkills` 数据。
4. 将后台技能区域收束为内容编辑器：基础技能与代码中已有的每条派生技能只暴露名称、描述、超频，不提供结构或逻辑控件。
5. 服务端角色更新先以现有记录为权威结构，只合并基础技能和既有派生技能的三个内容字段；结构数量、身份或逻辑字段变化均拒绝。
6. 增加窄范围 legacy sanitizer，清除本次 bug 写入普通角色的旧默认对象；它只负责兼容历史错误，不作为未来角色归属规则。
7. 现有 `hidden-hand` 处理器改为按目标 `effectType` 从当前基础技能定义中取配置；未来其他基础技能处理器复用同一查询函数。
8. 对局技能预览新增独立 `musicEffectType`，音乐解析器不再从玩法 `effectType` 判断槽位；派生历史持久化该字段，旧历史从 `musicTrackId` 元数据兼容推断。

## Decision (ADR-lite)

**Context**: 现有实现把一个角色的派生技默认值放进通用草稿和通用解析器，导致保存污染，并让未来派生技能天然带有爱弥斯耦合。

**Decision**: 采用“代码显式定义技能结构与逻辑，后台仅覆盖内容字段”的模型。基础技能拥有固定派生技能定义，玩法继续通过 `effectType` 注册；后台不能改变结构或规则。

**Consequences**: 未来给其他角色添加派生技时，在代码数据中增加显式定义并实现/注册效果；后台自动显示该技能的名称、描述、超频编辑项，但不能创建或改变玩法。这样既消除角色耦合，也避免运营配置破坏对局、回放和客户端一致性。

## Out of Scope

* 不修改角色详情视觉设计或音乐播放器交互。
* 不允许后台输入任意未注册脚本或执行代码。
* 不实现技能新增/删除、效果类型选择或任意棋盘规则的无代码编排。

## Technical Notes

* Shared model: `src/shared/derivedSkills.js`, `src/shared/skillEffectCatalog.js`.
* Admin draft/UI: `src/shared/adminDrafts.js`, `src/admin/AdminCharacters.jsx`.
* Server authority: `server/characters.js` and startup/default synchronization path.
* Default data: `src/shared/characterFallback.js`, `server/adminDefaultSnapshot.js`.
* Consumers/tests: `src/modals/house/HouseNestedDialogs.jsx`, `src/shared/adminDrafts.test.js`, `src/modals/HouseModal.test.js`, `server/characters.test.js`, derived-skill game tests.
* Existing unrelated shop/theme work is present and must be preserved.

## Verification

* `npm run lint` passed.
* 14 focused files passed with 267 tests, covering admin drafts/UI/routes, shared derived skills, character seed/startup cleanup, character detail/music, rooms, and game behavior；新增 BGM 根因修复的 3 个聚焦文件 83 个测试也全部通过。
* Full `npm test` passed all 271 test files and 1923 tests, including the previously parallel-edited CSS contract suites.
* `npm run lint`, `npm run build`, production configuration validation, and `npm run docs:system-design` passed.

## Research References

* [`research/generic-derived-skill-model.md`](research/generic-derived-skill-model.md) — repo-backed model boundaries and migration strategy.
