import { ChartNoAxesColumn, CircleDollarSign, HelpCircle, Star, Trophy } from "lucide-react";

export default function HouseProfileStats({ coins, stats, rank, onOpenCharacterRecords }) {
  return (
    <div className="profile-grid top-stats-bar">
      <Stat
        label="战绩"
        value={`${stats.totalGames}局 · ${stats.wins}胜${stats.losses}负${stats.draws}和`}
        icon={<ChartNoAxesColumn size={16} />}
        onClick={onOpenCharacterRecords}
      />
      <Stat
        label="积分"
        value={stats.rating}
        icon={<Star size={16} />}
        tip="积分：每胜一局+20，负一局-20，和棋或无效对局不增减积分。"
      />
      <Stat
        label="段位"
        value={rank}
        icon={<Trophy size={16} />}
        tip="段位由积分决定。积分1000分为1段，每+/-100分升/降一段，最高为9段。"
      />
      <Stat
        label="金币"
        value={coins}
        icon={<CircleDollarSign size={16} />}
        tip="金币：每胜一局+50，负一局+20，和棋或无效对局不获得金币。"
      />
    </div>
  );
}

function Stat({ label, value, icon = null, tip = "", onClick = null }) {
  const Component = onClick ? "button" : "div";
  return (
    <Component className={`stat ${onClick ? "stat-button" : ""}`} type={onClick ? "button" : undefined} onClick={onClick}>
      <span>
        {icon}
        {label}
        {tip && (
          <span className="stat-tip-wrap">
            <HelpCircle size={14} />
            <span className="stat-tip" role="tooltip">{tip}</span>
          </span>
        )}
      </span>
      <strong>{value}</strong>
    </Component>
  );
}
