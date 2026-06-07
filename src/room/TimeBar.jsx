import { formatClock } from "./roomView.js";

export default function TimeBar({ time }) {
  const inMain = time.main > 0;
  const periods = time.periods ?? 0;
  const isFinalByoYomi = !inMain && periods <= 1;
  const isWarningByoYomi = !inMain && (periods === 2 || periods === 3);
  const timerClass = inMain
    ? "main-time"
    : `byo-yomi ${isFinalByoYomi ? "final-byo-yomi" : isWarningByoYomi ? "warning-byo-yomi" : "normal-byo-yomi"}`;
  const displayValue = inMain ? formatClock(time.main) : String(time.periodRemaining ?? time.byoYomi).padStart(2, "0");
  const periodValue = String(Math.max(0, periods)).padStart(2, "0");
  const progress = inMain
    ? Math.max(0, Math.min(100, (time.main / (5 * 60)) * 100))
    : Math.max(0, Math.min(100, ((time.periodRemaining ?? time.byoYomi) / time.byoYomi) * 100));
  return (
    <div className={`timer digital-timer ${timerClass}`}>
      <div className="timer-label">{inMain ? "主时间" : "读秒"}</div>
      <div className="timer-digits">
        <span className="timer-primary">{displayValue}</span>
        {!inMain && <span className="timer-periods" title={`还剩${time.periods}次读秒`}>{periodValue}</span>}
      </div>
      <div className="timer-track"><span style={{ width: `${progress}%` }} /></div>
    </div>
  );
}
