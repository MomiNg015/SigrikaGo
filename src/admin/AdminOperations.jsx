import React from "react";
import { BarChart3, RefreshCw, TrendingUp } from "lucide-react";
import { AdminEmpty, AdminLoading } from "./AdminOverview.jsx";

const RANGE_OPTIONS = [
  ["today", "今天"],
  ["yesterday", "昨天"],
  ["7d", "最近7天"],
  ["30d", "最近30天"]
];

export default function AdminOperations({ data, loading = false, range, onRangeChange, onRefresh, onNavigate }) {
  if (loading) return <AdminLoading title="正在生成运营分析" />;
  if (!data) return <AdminEmpty title="暂无运营分析数据" actionLabel="刷新" onAction={onRefresh} />;
  return (
    <div className="admin-analytics-page">
      <section className="admin-operations-toolbar">
        <div>
          <span className="admin-kicker">运营分析</span>
          <h2>先看结论，再看图表</h2>
          <p>这里优先告诉你哪里正常、哪里需要关注，图表只作为辅助。</p>
        </div>
        <div className="admin-toolbar-actions">
          <div className="admin-range-tabs">
            {RANGE_OPTIONS.map(([key, label]) => (
              <button type="button" className={range === key ? "active" : ""} key={key} onClick={() => onRangeChange(key)}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="primary-action" onClick={onRefresh}>
            <RefreshCw size={16} />刷新
          </button>
        </div>
      </section>

      <OperationsInsight title="需要处理" items={data.insights?.needsAction ?? []} empty="当前没有必须处理的运营问题。" tone="danger" onNavigate={onNavigate} />
      <OperationsInsight title="值得关注" items={data.insights?.watch ?? []} empty="当前趋势没有明显异常。" tone="watch" onNavigate={onNavigate} />
      <OperationsInsight title="正常记录" items={data.insights?.normal ?? []} empty="暂无记录。" tone="normal" onNavigate={onNavigate} />

      <section className="admin-chart-grid">
        <SimpleBarChart title="活跃用户" summary="每天至少登录过一次的用户数" rows={data.charts?.activeUsers ?? []} />
        <SimpleBarChart title="新增注册" summary="按注册日期统计" rows={data.charts?.registrations ?? []} />
        <SimpleBarChart title="完成对局" summary="按棋谱创建日期统计" rows={data.charts?.games ?? []} />
      </section>

      <section className="admin-analytics-layout">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h3>玩家分层</h3>
              <p>先用已有登录、注册、棋谱数据粗分层，后续可接更细事件。</p>
            </div>
          </div>
          <div className="admin-segment-grid">
            {(data.segments ?? []).map((segment) => (
              <article key={segment.key}>
                <span>{segment.label}</span>
                <strong>{segment.count}</strong>
              </article>
            ))}
          </div>
        </div>
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h3>经济与玩法</h3>
              <p>当前先展示可解释摘要，深度来源拆分后续接入。</p>
            </div>
          </div>
          <div className="admin-health-list">
            <div><span>金币净变化</span><strong>{formatSigned(data.economy?.coinDelta)}</strong></div>
            <div><span>抽卡次数</span><strong>{data.economy?.gachaDraws ?? 0}</strong></div>
            <div><span>招募任务</span><strong>{data.economy?.recruitmentStarted ?? 0}</strong></div>
            <div><span>数据状态</span><strong>{data.economy?.status ?? "数据有限"}</strong></div>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h3>模式表现</h3>
            <p>完成对局数用于第一版玩法健康判断。</p>
          </div>
        </div>
        <div className="admin-mode-grid">
          {(data.charts?.modeTotals ?? []).map((mode) => (
            <article key={mode.mode} className="admin-mode-card">
              <span>{mode.label}</span>
              <strong>{mode.completed}</strong>
              <small>平均 {mode.averageMoveCount || 0} 手 · 无效 {mode.invalid}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function OperationsInsight({ title, items, empty, tone, onNavigate }) {
  return (
    <section className={`admin-insight-section ${tone}`}>
      <div className="admin-section-inline-title">
        <TrendingUp size={18} />
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
              {item.actionLabel && <button type="button" onClick={() => item.actionTab && onNavigate?.(item.actionTab)}>{item.actionLabel}</button>}
            </article>
          ))}
        </div>
      ) : <p className="admin-readable-empty">{empty}</p>}
    </section>
  );
}

function SimpleBarChart({ title, summary, rows }) {
  const max = Math.max(1, ...rows.map((row) => Number(row.value ?? 0)));
  return (
    <article className="admin-chart-card">
      <div>
        <BarChart3 size={18} />
        <h3>{title}</h3>
      </div>
      <p>{summary}</p>
      <div className="admin-bars" aria-label={title}>
        {rows.map((row) => (
          <div className="admin-bar-row" key={row.key}>
            <span>{row.label}</span>
            <b style={{ width: `${Math.max(4, (Number(row.value ?? 0) / max) * 100)}%` }} />
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function formatSigned(value) {
  const number = Number(value ?? 0);
  return `${number >= 0 ? "+" : ""}${number}`;
}
