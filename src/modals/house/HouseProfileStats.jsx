import { ChartNoAxesColumn, HelpCircle, Star, Trophy } from "lucide-react";
import RecentResultMarkers from "../../components/RecentResultMarkers.jsx";
import { splitRecordSummary } from "../UserProfileCard.jsx";
import { CharacterRecordsPanel } from "./HouseNestedDialogs.jsx";

export default function HouseProfileStats({ stats, rank, recentResults = [], characterRecords = [], itemEffects = {} }) {
  const recordSummary = splitRecordSummary(`${stats.totalGames}局 · ${stats.wins}胜${stats.losses}负${stats.draws}和`);

  return (
    <div className="profile-grid top-stats-bar">
      <div className="profile-resume-stats">
        <Stat
          label="战绩"
          value={(
            <b className="profile-record-lines">
              <span className="profile-record-total">{recordSummary.total}</span>
              <span className="profile-record-separator"> · </span>
              <span className="profile-record-breakdown">{recordSummary.breakdown}</span>
            </b>
          )}
          icon={<ChartNoAxesColumn size={16} />}
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
          tip="段位：最近10盘胜负中胜7盘升段/级，负8盘降段/级；升降级后重新记录。"
        />
      </div>
      <RecentResultMarkers results={recentResults} className="profile-rank-results" />
      <section className="resume-character-records" aria-label="角色战绩">
        <strong>角色战绩</strong>
        <CharacterRecordsPanel characterRecords={characterRecords} itemEffects={itemEffects} />
      </section>
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
