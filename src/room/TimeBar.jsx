import { formatClock } from "./roomView.js";

export default function TimeBar({ time }) {
  const inMain = time.main > 0;
  const isFinalByoYomi = !inMain && time.periods <= 1;
  const displayValue = inMain ? formatClock(time.main) : String(time.periodRemaining ?? time.byoYomi).padStart(2, "0");
  const periodValue = String(Math.max(0, time.periods ?? 0)).padStart(2, "0");
  const progress = inMain
    ? Math.max(0, Math.min(100, (time.main / (5 * 60)) * 100))
    : Math.max(0, Math.min(100, ((time.periodRemaining ?? time.byoYomi) / time.byoYomi) * 100));
  return (
    <div className={`timer digital-timer ${inMain ? "main-time" : isFinalByoYomi ? "final-byo-yomi" : "byo-yomi"}`}>
      <div className="timer-label">{inMain ? "主时间" : "读秒"}</div>
      <div className="timer-digits">
        <span className="timer-primary">{displayValue}</span>
        {!inMain && <span className="timer-periods" title={`还剩${time.periods}次读秒`}>{periodValue}</span>}
      </div>
      <div className="timer-track"><span style={{ width: `${progress}%` }} /></div>
    </div>
  );
}
