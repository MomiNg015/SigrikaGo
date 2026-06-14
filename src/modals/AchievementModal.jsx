import { useEffect, useMemo, useState } from "react";
import { Award, X } from "lucide-react";
import { api } from "../api/client.js";

const FILTERS = [
  { id: "unachieved", label: "未完成" },
  { id: "achieved", label: "已达成" },
  { id: "all", label: "全部" }
];

export default function AchievementModal({ token, onClose, onNotice }) {
  const [filter, setFilter] = useState("unachieved");
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api("/api/achievements", { token })
      .then((data) => {
        if (cancelled) return;
        setAchievements(data.achievements ?? []);
        for (const unlock of data.unlocks ?? []) {
          onNotice?.(`达成成就：${unlock.name}`, "achievement");
        }
      })
      .catch((error) => onNotice?.(error.message))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, onNotice]);

  const filtered = useMemo(() => achievements.filter((achievement) => {
    if (filter === "achieved") return achievement.achieved;
    if (filter === "unachieved") return !achievement.achieved;
    return true;
  }), [achievements, filter]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="house-modal achievement-modal" onClick={(event) => event.stopPropagation()}>
        <header className="house-header achievement-header">
          <h2>成就</h2>
          <button className="close-button" type="button" onClick={onClose} aria-label="关闭成就窗口"><X size={20} /></button>
        </header>
        <div className="achievement-tabs" role="tablist" aria-label="成就筛选">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={filter === item.id ? "active" : ""}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="achievement-list" aria-busy={loading}>
          <div className="achievement-row achievement-heading" aria-hidden="true">
            <span>成就名</span>
            <span>成就内容</span>
            <span>成就奖励</span>
            <span>达成时间</span>
          </div>
          {loading && <p className="achievement-empty">读取成就中...</p>}
          {!loading && filtered.length === 0 && <p className="achievement-empty">这里暂时没有成就。</p>}
          {!loading && filtered.map((achievement) => (
            <article key={achievement.id} className={`achievement-row ${achievement.achieved ? "achieved" : "unachieved"}`}>
              <strong>{achievement.name}</strong>
              <p>{achievement.content}</p>
              <RewardCell reward={achievement.reward} />
              <time>{achievement.achievedAt ? formatDateTime(achievement.achievedAt) : ""}</time>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function RewardCell({ reward }) {
  if (!reward) return <span className="achievement-reward-text">无奖励</span>;
  return (
    <span className="achievement-reward-cell">
      {reward.imageUrl ? <img src={reward.imageUrl} alt="" /> : <Award size={18} />}
      <b>{reward.text || reward.name || rewardLabel(reward)}</b>
    </span>
  );
}

function rewardLabel(reward) {
  if (reward.type === "currency") return `${reward.amount}${reward.targetType === "blueGems" ? "蓝宝石" : "金币"}`;
  return reward.name;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
