# 部员手册阵营纹章

2026-10-04，来自正式 `HouseCharacterGrid` 和项目样式的浏览器截图。前一版服饰印花已移除，纸纹、局部主题渐变、人物比例和交互保持。

素材为[鸣潮官网](https://wutheringwaves.kurogames.com/en/main/)公开资源包中的真实原图，均为422×344透明素材，保留原字节。[完整素材来源、哈希及角色映射](../../../public/assets/factions/manifest.json)。没有用参考截图放大或生成替代图。

| 阵营 | 用户指定成员 | 桌面展开 | 手机展开 |
| --- | --- | --- | --- |
| 罗伊族 | 西格莉卡 | [预览](desktop-roya.png) | [预览](mobile-roya.png) |
| 星炬学院 | 达妮娅、爱弥斯、琳奈、莫宁、千咲、娜波摩 | [预览](desktop-startorch.png) | [预览](mobile-startorch.png) |
| 瑝珑 | 长离、仇远 | [预览](desktop-huanglong.png) | [预览](mobile-huanglong.png) |

纹章放在人物对侧的背景留白中，保持完整比例。桌面140px方框，手机常态38px、展开94px；手机展开时纹章位于姓名下方，留出更多可见轮廓。官网原图自带淡alpha，CSS按原图alpha补偿后使用统一的克制墨色。猪小仙及未知成员不推断阵营。未拥有区域没有纹章或名称，保持禁用与静态匿名展示。

[桌面常态](desktop-rest.png) · [手机常态](mobile-rest.png) · [手机部分拥有](mobile-partial.png)。手机瑝珑截图使用键盘聚焦展示展开状态；静止条带触摸仍直接打开详情。

在1440×1024、1440×768、390×844、360×640核对常态、展开、滚动与部分拥有状态，没有横向溢出或页面异常。相关组件／样式检查及15项浏览器回归通过。

本地预览：`http://127.0.0.1:5299/tests/e2e/fixtures/handbook-puzzle.html`，可加 `?owned=partial` 查看未拥有区域；使用真实生产组件的只读测试夹具。
