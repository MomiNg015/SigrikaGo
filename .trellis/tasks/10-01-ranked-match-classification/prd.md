# 匹配段位范围、并列排名与对局类型标识

## Requirements
- 对弈信息区仅显示段位名称，不显示星数或九段积分。
- 排行榜依次比较段位、星数/九段积分、未舍入胜率、胜场数；完全相同采用竞争排名（1、1、3）。
- 普通三模式按各自段位优先匹配最近玩家；双方等待满 15 秒后允许超过两个等级的对手，仍优先最近段位。
- 建房时段位差不超过 2 则 rated=true，否则 rated=false；等级跨 1级/1段按相邻等级计算。
- 等待 15 秒显示用户指定文案；取消/断线取消重试，自动重试保留原等待起点并重新验证黑名单与服务器准入。
- 猜先结果上方新增浅红升降级/浅绿友谊标签；房间号使用一致语义颜色，带可访问类型说明。
- 私人/好友沿用友谊类型；练习、特殊剧情、吃子赛和队际赛独立规则不改。

## Pending clarification
- 跨段友谊对局是否完整沿用现有友谊统计与奖励：用户确认完整沿用现有友谊规则，不计排位统计并沿用友谊金币奖励。

## Validation
- 段差边界、模式隔离、15秒自动匹配、取消/断线、黑名单、排序与并列名次、前端提示与标签测试。
- 同步 rank spec、系统设计并生成 HTML；lint 与相关测试。

## Verification completed
- 18 targeted test files / 221 tests passed (match queue/socket lifecycle, frozen classification, friendly settlement, leaderboard ties and pinned row, opening/header UI, room regressions, CSS inventory).
- Full lint, production build, built CSS contract checks and system-design HTML generation passed.
- Headless Edge with production CSS at 1280/390/360px verified matching rated/friendly colors and no tag overflow. Existing build asset/chunk warnings remain.

## Follow-up display corrections
- 成员行仅段位且右对齐；模式与房间号空格分隔；手机信息区黑白棋标识置于用户名前。

- Final member-row revision: unequal stone/name/rank columns, all left aligned; supersedes the prior rank-right alignment. Verified a 284px member panel including the full 高级陪练 label and spectator column alignment.
