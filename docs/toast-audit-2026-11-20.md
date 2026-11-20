# Toast 触发清单（2026-11-20）

范围：正式前端入口及其后端 Socket 事件，包含管理后台与另行标注的开发／未开放功能。按触发场景归并相同的 API 错误分支；不把独立样板、测试、普通表单错误和弹窗当作全局 Toast。

## 全局 Toast

入口是 [useToastQueue](../src/app/useToastQueue.js)，经 [AppOverlays](../src/app/AppOverlays.jsx) 的 [ToastStack](../src/modals/FeedbackModals.jsx) 显示。最多同时保留五条；未指定类型的提示默认按错误样式处理。通过 `onNotice`、`onToast` 传递的回调，只有最终接到该队列才计入下表。

| 场景 | 什么时候出现 | 主要入口 |
| --- | --- | --- |
| 登录、账号和连接 | 会话恢复的非静默错误；Socket 登录失效；账号异地登录；服务维护、限流；原房间不存在 | [useAuthSession](../src/app/useAuthSession.js)、[socketHandlers](../src/app/socketHandlers.js)、[resumeSession](../src/app/resumeSession.js)、[socketGuards](../server/socketGuards.js) |
| 主页、匹配、观战 | 角色资料请求失败、角色或队际赛阵容未选齐；连接未就绪、匹配请求超时或拒绝、阵容／角色失效、匹配预载超时；房间号码错误、房间不可用、观战加入失败；普通房间关闭（正常已结算关闭例外） | [HomeScreen](../src/home/HomeScreen.jsx)、[useMatchActions](../src/app/useMatchActions.js)、[WatchModal](../src/modals/WatchModal.jsx)、[socketHandlers](../src/app/socketHandlers.js)、[socketRoomEvents](../server/socketRoomEvents.js)、[socketMatchEvents](../server/socketMatchEvents.js) |
| 陪练与对局 | 陪练引擎加载或计算失败、版本变更、连接变化、启动失败；落子／技能等操作被服务器拒绝；操作确认超时并同步；对局同步中尝试操作；短局无效结算提醒；长离额外落子进度 | [localPracticeController](../src/practice/localPracticeController.js)、[useMatchActions](../src/app/useMatchActions.js)、[roomActionConnection](../src/app/roomActionConnection.js)、[socketGameEvents](../server/socketGameEvents.js)、[roomGameActions](../server/roomGameActions.js)、[roomClockLifecycle](../server/roomClockLifecycle.js)、[roomScoringFlow](../server/roomScoringFlow.js)、[RoomScreen](../src/room/RoomScreen.jsx) |
| 好友、玩家资料与约战 | 用户名无效／找不到用户；添加好友、加入黑名单；举报已提交；列表、关系或举报请求失败；约战发出、被拒绝、对方不在线或对局中；自己约战自己、队际赛不支持或准入失败 | [FriendsModal](../src/modals/FriendsModal.jsx)、[UserProfileCard](../src/modals/UserProfileCard.jsx)、[socketHandlers](../src/app/socketHandlers.js)、[socketDuelEvents](../server/socketDuelEvents.js)、[duelRequests](../server/duelRequests.js) |
| 仓库 | 库存加载及道具使用请求失败；所有道具使用结果均不弹 Toast；没有拒绝剧情时用现有道具效果窗口说明。黑化相关剧情加载／触发／恢复的真实错误仍提示；开发模式取消糖果效果或跳转失败也仍提示 | [useWarehouseInventory](../src/modals/warehouse/useWarehouseInventory.js)、[App](../src/app/App.jsx)、[useCandyEffectCancellation](../src/home/useCandyEffectCancellation.js) |
| 商店、招募、扭蛋、手册 | 商店未登录；商品／服装购买成功、服装装备成功，或目录、购买及装备请求失败；招募加载、启动、领取或加速请求失败；魔法时钟加速成功仅更新加速演出和倒计时；扭蛋池、历史记录加载或抽取失败；手册装备服装成功及相关请求失败。扭蛋成功主要由结果面板呈现 | [useShopCatalog](../src/modals/shop/useShopCatalog.js)、[useCostumeCatalog](../src/modals/shop/useCostumeCatalog.js)、[useRecruitmentCatalog](../src/modals/recruitment/useRecruitmentCatalog.js)、[useGachaCatalog](../src/modals/gacha/useGachaCatalog.js)、[HouseModal](../src/modals/HouseModal.jsx) |
| 信箱、公告、反馈、设置 | 新手剧情／主页引导奖励发放后的新邮件提醒；附件已领取、邮件删除成功、信箱和公告请求失败；反馈提交成功；点未开放主题或未开放的个人资料自定义入口 | [useOnboardingStory](../src/app/useOnboardingStory.js)、[useHomeOnboarding](../src/home/onboarding/useHomeOnboarding.js)、[MailboxModal](../src/modals/MailboxModal.jsx)、[AnnouncementModal](../src/modals/AnnouncementModal.jsx)、[appShellProps](../src/app/appShellProps.js)、[SettingsModal](../src/modals/SettingsModal.jsx)、[AppOverlays](../src/app/AppOverlays.jsx) |
| 教学和特殊剧情 | 手动打开教学时缺脚本或请求失败；棋盘教学给出落点提示、错误落子、技能条件或步骤无效等提示；特殊决战开局、观战、剧情转换请求失败 | [useOnboardingStory](../src/app/useOnboardingStory.js)、[TutorialBattleScreen](../src/tutorial/TutorialBattleScreen.jsx)、[useMatchActions](../src/app/useMatchActions.js)、[useSigrikaCandyDuelAvailability](../src/home/useSigrikaCandyDuelAvailability.js)、[App](../src/app/App.jsx) |
| 成就与个性化（功能开关） | 主页刷新或商店、扭蛋、道具使用等返回的新成就，以及成就页加载、装备更新成功／失败。当前 `PROFILE_CUSTOMIZATION_ENABLED` 为关闭，成就 Toast 会被队列过滤，装备页面也不开放 | [功能开关](../src/shared/profileFeatures.js)、[队列](../src/app/useToastQueue.js)、[AchievementModal](../src/modals/AchievementModal.jsx)、[PersonalizationModal](../src/modals/PersonalizationModal.jsx) |
| 管理后台 | 管理页数据加载失败；用户编辑／封禁校验和操作；角色与图片上传、特性词、商品／道具、服装、装饰、音乐、扭蛋池、招募配置、公告、邮件、成就及奖励资产、看板娘、系统设置的校验、保存、删除／下线或请求失败；剧情编辑的保存/发布/撤回/删除、Excel 校验／导入／导出和预览异常 | [后台入口](../src/admin/AdminConsole.jsx)、[用户编辑](../src/admin/AdminUsers.jsx)、[剧情编辑](../src/admin/AdminOnboardingStory.jsx) |

## 不走全局队列的提示

- [对局内计时 Toast](../src/room/requestToasts/timedRoomRequests.js)：和棋申请、进入数子申请、数子结果确认。申请者等待，接收者可同意或拒绝；回应结束后短暂显示结果，观战者不显示这组提示。
- [好友来战横幅](../src/modals/FeedbackModals.jsx) 是带倒计时和接受／拒绝的独立横幅；发出、被拒绝和失败反馈才是全局 Toast。
- [后台剧情编辑](../src/admin/AdminOnboardingStory.jsx) 有局部短提示，同一操作也可能向全局队列发送提示。登录表单、断线横幅、商店气泡、技能演出和结算弹窗均是各自的界面，不属于全局 Toast。
