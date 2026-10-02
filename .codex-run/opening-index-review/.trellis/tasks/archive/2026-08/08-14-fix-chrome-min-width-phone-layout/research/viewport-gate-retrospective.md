# Bug Analysis: Chrome 最窄窗口仍被桌面门禁拦截

## 1. Root Cause Category

- **Category**: E - Implicit Assumption
- **Specific Cause**: 旧实现把布局选择与设备身份耦合，并假设桌面模拟必须落入真实手机的完整双轴范围。实际产品要求是相同当前视口得到相同布局，不应由 UA、触控或物理屏幕改变结果。

## 2. Why Fixes Failed

1. 第一版只按真实设备证据和设备屏幕判定，完全禁止桌面窄窗模拟。
2. 第二版允许桌面窄窗，但继续复用真实手机范围，漏掉 `496 x 1047`。
3. 第三版分离桌面模拟与手机范围，却仍保留平板/手机身份分支；最终需求明确为纯尺寸契约。

## 3. Prevention Mechanisms

| Priority | Mechanism | Specific Action | Status |
|---|---|---|---|
| P0 | Architecture | 删除设备分类，集中为纯视口 `isCompactViewport` 几何契约 | DONE |
| P0 | Test Coverage | 将截图实测 `496 x 1047` 与 `520/521px`、`567/568px` 边界加入回归测试 | DONE |
| P1 | Documentation | 在前端质量规范和系统设计中记录两套契约及其先后顺序 | DONE |
| P1 | Browser QA | 可连接 Chrome 时用实测最小窗口复核；不可连接时明确说明，不以模拟结果冒充真实浏览器验证 | DONE |

## 4. Systematic Expansion

- **Similar Issues**: 任何用设备尺寸断点直接约束桌面响应式预览的逻辑，都可能受浏览器最小外窗宽度、工具栏和系统缩放影响。
- **Design Improvement**: UA、触控和物理屏幕不再参与入口布局选择；当前 CSS 视口是唯一输入。
- **Process Improvement**: 用户提交可复现截图时，先读取图片像素或实际视口数值，再选择回归样本，不再只用常见设备预设尺寸。

## 5. Knowledge Capture

- [x] 更新 `.trellis/spec/frontend/quality-guidelines.md`。
- [x] 更新 `docs/system-design.md` 并生成 HTML。
- [x] 添加精确截图尺寸和上下边界回归测试。
- [x] 仓库不存在 `src/templates/markdown/spec/`，无需同步模板。
