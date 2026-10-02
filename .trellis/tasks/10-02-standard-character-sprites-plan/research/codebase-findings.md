# 立绘接入调查摘要

2026-10-02。三条独立只读调查已完成，未修改运行代码。完整场景方案与源码依据集中于 `docs/character-sprite-integration-plan.md`。

## 已核对的核心事实

- canonical IDs 是 `sigrika / denia / aemeath`；来源 `amis` 需要显式映射，当前 aliases 为空。
- 内置旧立绘合同是 900×900 WebP、可见最长边 792px、底部留白 54px，不适用于 832×1216 原图。
- 同一 `portraitUrl` 被大展示、紧凑列表、玩家卡、开场、技能与结算复用；同时还有直接读取资源 URL 的旁路。
- 角色外观解析包括西格莉卡侵蚀、达妮娅动画彩虹光、时装与 costumeSnapshot。新三套仅覆盖默认外观。
- 手机玩家卡约 94px 高、图片约 88px 宽；队际斜切头像采用 cover center，必须提供专门半身或头像裁切。
- 履历主图区桌面 164×152px、手机 108×96px，详情图区 220×210px；全身图直接替换不会形成可辨识的大展示。
- `SkillBanner` 已有施放事件、effectType 与语音，`ResultModal` 已有 win/loss/draw/challenge/spectator 分类；表情选择尚未接入。
- 自动猜先没有独立 Nigiri 交互组件；现有开场视觉路径是 `OpeningModal → OpeningDuelPresentation`。
- 剧情节点当前无表情、造型集合、背景、多角色舞台和节点语音合同。普通与教学剧情复用 StoryPlayerModal；教学气泡单独直接读 character.portrait。
- storyScripts 白名单规范化、后台节点构造、Excel 列白名单与导入重建都需要同步新增字段；JSON 归档不是 Excel 导入来源。
- draftNodesJson/publishedNodesJson 可容纳可选字段，静态美术 manifest 首期无需 Character 模型迁移。
- 预加载已支持图片 decode，但当前收集的是单图 portrait；新资源应按用途与实际引用加载。
- 静态 /assets 当前 no-cache；新套组仍应使用稳定版本引用并保留旧资源。
- 历史房间和回放显式保存部分角色、时装和 framing 字段，不会自动保存新的套组、版本或演出 cue。

## 外部技术依据

- Ren'Py 图像显示：以角色 tag 与属性选图，同角色换图可保持变换。仅借鉴展示结构，不引入其引擎。
  https://www.renpy.org/doc/html/displaying_images.html
- MDN HTMLImageElement.decode：等待图像准备好再换入 DOM。
  https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode
