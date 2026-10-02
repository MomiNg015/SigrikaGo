from pathlib import Path

p = Path('docs/system-design.md')
s = p.read_text(encoding='utf-8')
paragraph = '准时宝普通陪练与吃子挑战赛的新对局统一由玩家浏览器计算：入门使用 Worker 内的共享启发式，中级／高级及挑战赛使用 GNU Go 3.8 WASM level 5／10。服务端发放绑定当前连接和局面的计算任务，校验回包并负责正式落子、100 手挑战赛结算和排名；切后台、计算失败或断线不会伪造机器人认输。旧房保留原后端，黑化西格莉卡专属引擎保持独立。引擎按需下载，附带源码、许可证与可复现构建脚本；详见[本地陪练引擎](./system-design/03-backend-realtime-api.md#本地陪练引擎)。\n\n'
s = s.replace('# SigrikaGo 系统设计\n\n', '# SigrikaGo 系统设计\n\n' + paragraph, 1)
p.write_text(s, encoding='utf-8')

p = Path('docs/system-design/03-backend-realtime-api.md')
s = p.read_text(encoding='utf-8')
lines = s.splitlines()
for i, line in enumerate(lines):
    if line.startswith('- `server/socketPracticeEvents.js` owns `practice:start`'):
        lines[i] = '- `server/socketPracticeEvents.js` owns `practice:start`：参数为 `{ difficulty: "beginner" | "intermediate" | "advanced", playerColor: "black" | "white" | "random", engineVersion: "gnugo-3.8-v1", challenge?: "capture-challenge" }`，ack 为 `{ ok, roomCode?, error?, code? }`。前端先完成本地引擎初始化，服务端刷新认证用户、执行容量与活跃房检查，并校验版本；旧客户端返回 `local_practice_version`，三档新房均不探测服务器 GNU Go。创建 Spark / unrated / practice / recordPolicy=none 房间，持久化并安全投影 `practice.engineBackend="browser"`，保留难度、执色及提子阈值；虚拟准时宝已 ready、无正式角色／技能／socket／社交身份，内部 bot actor id 不投影。`practice:compute` 与 `practice:computed` 只接受房主当前连接，具体见本地陪练引擎。'
    elif line.startswith('练习房继续使用同一 `match:found`'):
        lines[i] = '''练习房继续使用同一 `match:found`、资源 ready、opening、权威 action ack、技能演出、数子和 `room:resume` 通路。新房的搜索在玩家设备运行，`practiceRoomAutomation` 跳过其 `play` 调度，仍处理提满阈值认输、求和、数子、死子确认和结果复核。三档新普通房都显式持久化普通提子阈值 22；旧 `beginner` 快照缺字段时保持 11，旧 `basic` 缺字段时为 22，`skillRemovals` 从不计入。吃子挑战赛使用自己的 100 手边界。

### 本地陪练引擎

`src/practice/` 负责模块 Worker、WASM 调用与对局控制器。入门复用 `src/shared/practiceBotDecision.js`；中级和高级／吃子挑战赛执行 GNU Go 3.8 level 5／10。浏览器先初始化再申请房间；中高级按需加载 `/engines/gnugo-3.8/gnugo.js` 与 `gnugo.wasm`，每手使用新实例但复用已编译模块，保持原生每手新进程的状态隔离。引擎 cache 8 MB，WASM 初始内存 64 MB、上限 256 MB；主线程看门狗在初始化 60 秒或单次搜索 30 秒后终止 Worker。计算异常重建后再试一次，仍失败则提示暂停／刷新；不降低难度、不自动转云端，也不通过机器人认输制造挑战成绩。入门最低出手间隔 1200 ms，中高级 650 ms，服务端同时检查。

`server/localPracticeEngine.js` 发放 60 秒计算租约：绑定用户、当前 socket、房间、随机 jobId 和完整 `game` 状态哈希，不能只依赖手数。服务端用 `gameViewForColor(botColor)` 生成可见 SGF 与正式 `playMove` 合法点白名单；入门另发机器人视角规则状态。SGF 保持 `SZ[13]`、`KM[2.75]`、`RU[Chinese]`，中高级经 `restricted_genmove` 出招；无合法点直接 pass。隐藏手、色彩幻象、中立点和技能禁入按原投影／合法性契约处理。客户端只回 `{ jobId, positionVersion, action }`，服务器拒绝旧连接、旧局面、错误阶段、非法动作，以自身 bot 身份调用 `handleGameAction` 并广播。已接受 job 的重复回包只补成功 ACK，不再落子；客户端丢 ACK 时重发同一结果，不重新搜索。客户端成绩、计分或 bot 身份不可信；不做引擎防篡改或服务器重新搜索，这是本项目当前明确接受的取舍。

控制器前台联网时每 1.5 秒请求／续报当前状态。隐藏页主动报告 `active:false` 并终止 Worker，服务器撤销任务、暂停棋钟；心跳失联 10 秒也暂停，浏览器恢复后按当前状态重新计算。机器人思考不消耗棋钟；人类正常前台回合仍计时。连接尚在但连续 15 分钟未恢复时中性结束，不产生挑战赛成绩；断线房继续受原有空房回收约束。后台状态、租约和成功回执只存运行时；持久化仅保留执行后端，刷新、重新连接或服务重启均重新派工。

`scripts/build-practice-wasm.py --emsdk <path>` 固定 Emscripten 4.0.10 与 GNU Go 源码 SHA-256，从上游完整模式库构建，修正旧源码的重复 tentative definitions 及空数组排序指针下溢；不修改搜索算法。`public/engines/gnugo-3.8/` 随站点发布二进制、GPL 许可证、对应源码、构建脚本和摘要 manifest。Nginx 为引擎路径返回真实 404、正确 WASM MIME、gzip 和缓存再验证；CSP 增加 `wasm-unsafe-eval`，构建禁用动态 JS 求值。引擎变更须同步重建产物并提升 `LOCAL_PRACTICE_VERSION`。`npm run verify:practice-wasm` 校验产物并运行代表局面，`npm run test:e2e:practice` 验证生产 Worker／CSP、真实服务端落子、刷新恢复与下载失败。

历史快照缺少 `engineBackend` 时继续按 `server` 恢复：入门服务器启发式，GNU Go level 5／10／旧 basic level 1 仍有全局一个子进程、8 MB cache、3.5／5／2 秒超时与 busy 重试；连续三次非 busy 失败仍走旧局的明确认输策略。这些限制不再约束新本地房。原生 GNU Go 与生产路径预检仍为旧房恢复和黑化西格莉卡后备引擎保留。'''
p.write_text('\n'.join(lines) + '\n', encoding='utf-8')

task = Path('.trellis/tasks/09-26-practice-local-engine')
for name in ['implement.jsonl', 'check.jsonl']:
    (task / name).write_text('{"file":".trellis/spec/backend/local-practice-engine-contract.md","reason":"Owner-bound browser jobs, timing, recovery and authoritative challenge scoring"}\n{"file":".trellis/spec/backend/practice-room-contract.md","reason":"Preserve ordinary practice and legacy/special boundaries"}\n', encoding='utf-8')
