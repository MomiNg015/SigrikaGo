# 2 核 2GB 容量压测与并发评估

## Goal
在本机隔离环境测量在线连接和同时对局的参考容量，给出可复跑证据和目标云验证边界。

## Requirements
- 用户已选择先做本机参考测试。
- 保护 MuMu 模拟器：不修改其进程/优先级/亲和性；压测服务和发压端单独限核、低优先级、串行阶梯，监测内存余量并有界停止。
- 独立 SQLite、端口；不连接生产服务或开发数据库。
- 区分真实普通落子、观战、闲置连接、重连和重启；旧随机棋盘诊断不可当真实对局容量。
- Windows 通过 Job Object 限制测试服务两个逻辑处理器及 1536 MiB committed memory；仅为本机近似，不能称完整 2GB Linux 虚机。
- 保存环境、负载、延迟、错误、内存、事件循环证据，结果不改生产软上限。

## Acceptance Criteria
- [x] 完成小规模验证、在线和对局阶梯，记录停止原因。
- [x] 错误/断线/指标缺失不能被判成通过。
- [x] 报告给出已测边界、建议参考值及未测范围。
- [x] 同步系统设计并生成 HTML，相关脚本测试和 lint 通过。

## Out of Scope
生产压测、修改游戏运行行为、优化服务、修改 MuMu、安装系统虚拟化软件、提交已有 WIP。

## Technical Notes
现有 scripts/verify-capacity.mjs、capacityVerification.mjs 可复用隔离与测量。默认 500/100 是保护阈值，不是实测容量。现有动作 test-random-layout，需增加 move 场景。Windows Job Memory 限制 committed memory，非整机物理 RAM；Microsoft JOBOBJECT_EXTENDED_LIMIT_INFORMATION 文档为依据。

## Outcome
500 在线/50 盘/100 观战，3 分钟 2950 次真实落子、100 次重连，所有门槛通过；500/100 的 5 分钟档有 23 次持久化错误；1000 纯在线零连接错误但事件循环 p95 51.28ms 略超门槛。报告 docs/testing-capacity-2026-11-05.md，原始 JSON 在 artifacts/capacity/2026-11-05/。保守规划 300 在线/50 盘，目标云复核仍必需。没有调整生产阈值或修复数据库瓶颈，未提交已有 WIP。
