# 手册裁切与原版角色卡修正

## Confirmed requirements
- 用户明确要求裁净背景中的左侧书页，窗口只显示右页。
- 删除翻书动画及对应封面节点。
- 恢复原版紧凑角色卡片形态，只显示立绘、姓名和出战按钮；删除学院和学生证文案。
- 在原版卡片上增加角色主题色的手绘背景图，不继续使用大型横版证件布局。
- 保留左侧角色/装饰书签与既有业务功能。
- 用户后续明确：桌面每行三个，手机每行两个。

## Implementation
- 精确约束原图右页可见范围，逐一检查左上和左下裁切。
- 沿用原版卡片结构和多列布局，背景复用已生成纸张素材，减少尺寸与覆写。
- 不改动工作区其他既有改动；更新文档和受影响测试。

## Acceptance
- [x] 桌面与手机无左页残留、无翻书动画。
- [x] 卡片紧凑，只保留三个常规信息元素，主题背景可见。
- [x] 书签、详情、出战与保密规则正常；测试和文档生成通过。

## Validation
- Inspected desktop 1440x1000 and portrait 360x640, 390x844, 412x915. Desktop is exactly three columns; phones are two. Name and portrait bounds stay inside cards, no overlap or horizontal overflow, last card reachable.
- Book visible source begins past x=811px; center binding and both left-page corners are excluded. Cover node and keyframes are deleted.
- 85 focused DOM/CSS/generated-document checks pass. Lint and production build/built CSS validation pass. Existing unrelated full-suite failures from the prior iteration were not expanded into this scope.
- Reused Trellis/impeccable guidelines already loaded in this session. New art and full generation prompt recorded in public/assets/handbook/ASSETS.md.
