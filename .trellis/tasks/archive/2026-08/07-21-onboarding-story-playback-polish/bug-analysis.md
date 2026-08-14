## Bug Analysis: 新手剧情台词与立绘不同步

### 1. Root Cause Category

- **Category**: D - Test Coverage Gap，兼有 E - Implicit Assumption。
- **Specific Cause**: 普通剧情把节点 ID 当成立绘身份，教学对弈则假定旧气泡可以在新节点开始后继续退场；两处都没有验证“当前节点、说话人、立绘必须同帧一致”。剧情数据同时把有完整语义的台词配置成打字结束后仅停留 0.35–0.5 秒的自动推进。

### 2. Why Fixes Failed

1. 之前只给图片增加 eager/sync 加载提示：这只能缩短资源解析时间，不能消除节点 ID 强制 remount，也不能修复教学气泡延迟替换。
2. 原有静态测试只检查了图片属性和动画代码存在：没有从用户交互验证窗口任意区域完成打字，也没有断言新 NPC 节点立即拥有自己的立绘。

### 3. Prevention Mechanisms

| Priority | Mechanism | Specific Action | Status |
| --- | --- | --- | --- |
| P0 | Architecture | 普通剧情以角色 ID + 资源 URL 作为立绘身份；教学气泡保存已解析 portrait 并随节点原子替换 | DONE |
| P0 | Test Coverage | 增加窗口非文本区域点击的 jsdom 测试，以及 NPC 气泡即时替换与预加载断言 | DONE |
| P0 | Data Contract | 快照测试锁定所有有阅读意义的入门台词为手动继续，自动节点只保留三条短反应 | DONE |
| P1 | Documentation | 更新 Story Player 和 Story Tutorial Battle 组件契约及系统设计摘要 | DONE |

### 4. Systematic Expansion

- **Similar Issues**: 任何“节点先切换、视觉资源后切换”的剧情 surface 都可能产生身份错配；后续新增气泡或角色动画时应复用同一原子更新契约。
- **Design Improvement**: 区分“替换当前说话人”和“隐藏当前气泡”。只有隐藏可以播放完整退场，替换必须让内容与身份同步。
- **Process Improvement**: 剧情节奏修改除校验字段互斥外，还要枚举所有自动台词，确认它们确实只是短反应或动作过渡。

### 5. Knowledge Capture

- [x] 更新 `.trellis/spec/frontend/component-guidelines.md` 的普通剧情与教学对弈合同。
- [x] 更新 `docs/system-design.md` 和 `docs/system-design/06-ui-theme-mobile.md`。
- [x] 添加组件、DOM 交互和默认剧情快照回归测试。
- [x] 项目没有 `src/templates/markdown/spec/`，无可同步的规范模板。
