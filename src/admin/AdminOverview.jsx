import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Gamepad2,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRoundCheck,
  UsersRound
} from "lucide-react";
import { AdminStatusPill } from "./adminComponents.jsx";

const STATUS_TONES = {
  正常: "green",
  需要关注: "blue",
  需要处理: "red",
  待接入: "neutral"
};

const ONLINE_GROUP_LABELS = {
  admin: "管理员",
  playing: "对局中",
  matching: "匹配中",
  watching: "观战中",
  lobby: "大厅在线"
};

export default function AdminOverview({ data, loading = false, onRefresh, onNavigate }) {
  const [onlineQuery, setOnlineQuery] = useState("");
  const filteredOnlineUsers = useMemo(() => filterOnlineUsers(data?.realtime?.onlineUsers ?? [], onlineQuery), [data, onlineQuery]);
  if (loading) return <AdminLoading title="正在读取今日简报" />;
  if (!data) return <AdminEmpty title="暂无概况数据" actionLabel="刷新" onAction={onRefresh} />;

  const brief = data.brief ?? {};
  const today = data.today ?? {};
  const status = brief.status ?? "正常";

  return (
    <div className="admin-analytics-page">
      <section className={`admin-brief-card ${statusClass(status)}`}>
        <div className="admin-brief-main">
          <span className="admin-kicker">今日简报</span>
          <h2>今日状态：{status}</h2>
          <p>{brief.reasons?.[0] ?? "核心指标暂无异常。"}</p>
          <div className="admin-brief-reasons">
            {(brief.reasons ?? []).slice(0, 5).map((reason) => <span key={reason}>{reason}</span>)}
          </div>
        </div>
        <div className="admin-brief-actions">
          <button type="button" className="primary-action" onClick={onRefresh}>
            <RefreshCw size={16} />刷新
          </button>
          <small>最后更新 {formatDateTime(data.generatedAt)}</small>
        </div>
      </section>

      <section className="admin-answer-grid">
        <AnswerCard icon={UsersRound} label="现在在线" value={`${data.realtime?.onlineCount ?? 0} 人`} detail={`${data.realtime?.activeRooms ?? 0} 个活跃房间 · ${data.realtime?.matchmakingCount ?? 0} 人匹配中`} />
        <AnswerCard icon={UserRoundCheck} label="今日来访" value={`${today.logins?.uniqueUsers ?? 0} 人登录`} detail={`${today.registrations?.users ?? 0} 人注册 · 首局转化 ${formatPercent(today.registrations?.firstGameConversionRate)}`} />
        <AnswerCard icon={Gamepad2} label="今日对局" value={`${today.games?.completed ?? 0} 局完成`} detail={(today.games?.byMode ?? []).map((mode) => `${mode.label} ${mode.completed}`).join(" · ")} />
        <AnswerCard icon={ShieldAlert} label="必须处理" value={`${data.alerts?.reportsPending ?? 0} 条举报`} detail={`${data.alerts?.feedbackPending ?? 0} 条反馈 · 异常事件见下方`} tone={(data.alerts?.reportsPending ?? 0) > 0 ? "danger" : "normal"} />
      </section>

      <InsightSection title="需要处理" icon={AlertTriangle} items={brief.sections?.needsAction ?? []} empty="当前没有必须立刻处理的事项。" tone="danger" onNavigate={onNavigate} />
      <InsightSection title="值得关注" icon={Activity} items={brief.sections?.watch ?? []} empty="趋势没有明显异常。" tone="watch" onNavigate={onNavigate} />
      <InsightSection title="正常记录" icon={BarChart3} items={brief.sections?.normal ?? []} empty="暂无健康摘要。" tone="normal" onNavigate={onNavigate} />

      <section className="admin-analytics-layout">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h3>在线用户名单</h3>
              <p>默认按当前连接状态展示，详细设备/IP 风控字段后续接入。</p>
            </div>
            <label className="admin-search-box">
              <Search size={16} />
              <input value={onlineQuery} onChange={(event) => setOnlineQuery(event.target.value)} placeholder="搜索用户名" />
            </label>
          </div>
          <OnlineGroups users={filteredOnlineUsers} />
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h3>今日时长榜</h3>
              <p>第一版由登录会话估算，后续可替换为活跃操作时长。</p>
            </div>
          </div>
          <DurationList rows={today.durationLeaders ?? []} />
        </div>
      </section>

      <section className="admin-analytics-layout">
        <ModeBreakdown modes={today.games?.byMode ?? []} />
        <ServiceHealth health={data.serviceHealth} />
      </section>
    </div>
  );
}

function AnswerCard({ icon: Icon, label, value, detail, tone = "normal" }) {
  return (
    <article className={`admin-answer-card ${tone}`}>
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail || "暂无补充信息"}</p>
    </article>
  );
}

function InsightSection({ title, icon: Icon, items, empty, tone, onNavigate }) {
  return (
    <section className={`admin-insight-section ${tone}`}>
      <div className="admin-section-inline-title">
        <Icon size={18} />
        <h3>{title}</h3>
      </div>
      {items.length ? (
        <div className="admin-insight-list">
          {items.map((item, index) => (
            <article className="admin-insight-card" key={`${item.title}-${index}`}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
              {item.actionLabel && (
                <button type="button" onClick={() => item.actionTab && onNavigate?.(item.actionTab)}>
                  {item.actionLabel}
                </button>
              )}
            </article>
          ))}
        </div>
      ) : <p className="admin-readable-empty">{empty}</p>}
    </section>
  );
}

function OnlineGroups({ users }) {
  const groups = groupUsers(users);
  return (
    <div className="admin-online-groups">
      {Object.entries(ONLINE_GROUP_LABELS).map(([key, label]) => (
        <div className="admin-online-group" key={key}>
          <div className="admin-online-group-head">
            <strong>{label}</strong>
            <span>{groups[key].length}</span>
          </div>
          {groups[key].length ? groups[key].slice(0, 8).map((user) => (
            <div className="admin-online-row" key={`${key}-${user.userId}`}>
              <div>
                <strong>{user.username || user.userId}</strong>
                <small>{user.socketCount ?? 1} 个连接 · {formatDateTime(user.connectedAt)}</small>
              </div>
              <AdminStatusPill tone={user.status === "playing" ? "blue" : user.role === "admin" ? "red" : "green"}>
                {statusLabel(user)}
              </AdminStatusPill>
            </div>
          )) : <p className="admin-readable-empty">暂无用户</p>}
        </div>
      ))}
    </div>
  );
}

function DurationList({ rows }) {
  if (!rows.length) return <p className="admin-readable-empty">暂无今日会话时长数据。</p>;
  return (
    <div className="admin-duration-list">
      {rows.map((row, index) => (
        <div className="admin-duration-row" key={row.userId}>
          <b>{index + 1}</b>
          <span>{row.username}</span>
          <strong>{formatDuration(row.activeSeconds)}</strong>
          <small>{row.dataStatus}</small>
        </div>
      ))}
    </div>
  );
}

function ModeBreakdown({ modes }) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h3>今日分模式对局</h3>
          <p>完成数是真实棋谱；创建/中断深度事件后续接入。</p>
        </div>
      </div>
      <div className="admin-mode-grid">
        {modes.map((mode) => (
          <article key={mode.mode} className="admin-mode-card">
            <span>{mode.label}</span>
            <strong>{mode.completed}</strong>
            <small>平均 {mode.averageMoveCount || 0} 手 · 无效 {mode.invalid}</small>
            <AdminStatusPill tone={mode.interruptedStatus ? "blue" : "green"}>{mode.interruptedStatus ?? "可用"}</AdminStatusPill>
          </article>
        ))}
      </div>
    </section>
  );
}

function ServiceHealth({ health = {} }) {
  const rows = [
    ["Socket 连接", health.socketConnections ?? 0],
    ["活跃房间", health.activeRooms ?? 0],
    ["匹配队列", health.matchingQueue ?? 0],
    ["持久化活跃房间", health.persistedActiveRooms ?? 0],
    ["事件状态", health.dataStatus ?? "可用"]
  ];
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h3>服务健康</h3>
          <p>聚焦玩家能否连接、匹配、进入房间。</p>
        </div>
      </div>
      <div className="admin-health-list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminLoading({ title }) {
  return <div className="admin-readable-state"><Clock size={20} /><strong>{title}</strong><p>请稍等，正在生成管理员可读摘要。</p></div>;
}

export function AdminEmpty({ title, actionLabel, onAction }) {
  return (
    <div className="admin-readable-state">
      <strong>{title}</strong>
      <p>数据暂时不可用，可以手动刷新重试。</p>
      {actionLabel && <button type="button" className="primary-action" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

function filterOnlineUsers(users, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return users;
  return users.filter((user) => String(user.username ?? user.userId).toLowerCase().includes(normalized));
}

function groupUsers(users) {
  const groups = { admin: [], playing: [], matching: [], watching: [], lobby: [] };
  for (const user of users) {
    if (user.role === "admin") groups.admin.push(user);
    else if (user.status === "playing") groups.playing.push(user);
    else groups.lobby.push(user);
  }
  return groups;
}

function statusClass(status) {
  return STATUS_TONES[status] ?? "green";
}

function statusLabel(user) {
  if (user.role === "admin") return "管理员";
  if (user.status === "playing") return "对局中";
  if (user.status === "online") return "在线";
  return user.status ?? "在线";
}

function formatPercent(value) {
  return `${Math.round(Number(value ?? 0) * 100)}%`;
}

function formatDuration(seconds) {
  const value = Number(seconds ?? 0);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  if (hours) return `${hours}小时${minutes}分`;
  return `${minutes}分`;
}

function formatDateTime(value) {
  if (!value) return "暂无";
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
