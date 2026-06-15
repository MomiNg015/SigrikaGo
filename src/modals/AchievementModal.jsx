import { useEffect, useMemo, useState } from "react";
import { Award, X } from "lucide-react";
import { api } from "../api/client.js";

const FILTERS = [
  { id: "unachieved", label: "未完成" },
  { id: "achieved", label: "已达成" },
  { id: "all", label: "全部" }
];

const ACHIEVEMENT_POPOVER_MAX_WIDTH = 260;
const ACHIEVEMENT_POPOVER_MARGIN = 14;
const ACHIEVEMENT_POPOVER_MIN_TOP = 58;

export function achievementTimePopoverPosition({
  clientX,
  clientY,
  viewportWidth = globalThis.window?.innerWidth ?? 0,
  viewportHeight = globalThis.window?.innerHeight ?? 0
}) {
  const safeWidth = Math.max(0, viewportWidth);
  const safeHeight = Math.max(0, viewportHeight);
  const halfWidth = Math.min(
    ACHIEVEMENT_POPOVER_MAX_WIDTH / 2,
    Math.max(0, (safeWidth - ACHIEVEMENT_POPOVER_MARGIN * 2) / 2)
  );
  const minLeft = ACHIEVEMENT_POPOVER_MARGIN + halfWidth;
  const maxLeft = Math.max(minLeft, safeWidth - ACHIEVEMENT_POPOVER_MARGIN - halfWidth);
  const minTop = Math.min(ACHIEVEMENT_POPOVER_MIN_TOP, Math.max(ACHIEVEMENT_POPOVER_MARGIN, safeHeight - ACHIEVEMENT_POPOVER_MARGIN));
  const maxTop = Math.max(minTop, safeHeight - ACHIEVEMENT_POPOVER_MARGIN);

  return {
    left: clamp(clientX, minLeft, maxLeft),
    top: clamp(clientY, minTop, maxTop)
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function AchievementModal({ token, onClose, onNotice }) {
  const [filter, setFilter] = useState("unachieved");
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timePopover, setTimePopover] = useState(null);

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

  function selectFilter(nextFilter) {
    setFilter(nextFilter);
    setTimePopover(null);
  }

  function showAchievementTime(event, achievement) {
    if (!achievement.achieved || !achievement.achievedAt) {
      setTimePopover(null);
      return;
    }
    const { left, top } = achievementTimePopoverPosition({
      clientX: event.clientX,
      clientY: event.clientY
    });
    setTimePopover({
      id: achievement.id,
      left,
      top,
      value: formatDateTime(achievement.achievedAt)
    });
  }

  function showAchievementTimeFromKeyboard(event, achievement) {
    if ((event.key !== "Enter" && event.key !== " ") || !achievement.achieved || !achievement.achievedAt) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const { left, top } = achievementTimePopoverPosition({
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    });
    setTimePopover({
      id: achievement.id,
      left,
      top,
      value: formatDateTime(achievement.achievedAt)
    });
  }

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
              onClick={() => selectFilter(item.id)}
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
          </div>
          {loading && <p className="achievement-empty">读取成就中...</p>}
          {!loading && filtered.length === 0 && <p className="achievement-empty">这里暂时没有成就。</p>}
          {!loading && filtered.map((achievement) => (
            <article
              key={achievement.id}
              className={`achievement-row ${achievement.achieved ? "achieved" : "unachieved"}`}
              onClick={(event) => showAchievementTime(event, achievement)}
              role={achievement.achieved && achievement.achievedAt ? "button" : undefined}
              tabIndex={achievement.achieved && achievement.achievedAt ? 0 : undefined}
              onKeyDown={(event) => showAchievementTimeFromKeyboard(event, achievement)}
            >
              <strong>{achievement.name}</strong>
              <p>{achievement.content}</p>
              <RewardCell reward={achievement.reward} />
            </article>
          ))}
        </div>
        {timePopover && (
          <div
            className="achievement-time-popover"
            role="status"
            style={{
              left: `${timePopover.left}px`,
              top: `${timePopover.top}px`
            }}
          >
            <span>达成时间</span>
            <time>{timePopover.value}</time>
          </div>
        )}
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
