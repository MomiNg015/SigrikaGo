import { useState } from "react";
import { Eye, Sparkles } from "lucide-react";
import { COLORS } from "../shared/game.js";
import { findCharacter } from "../shared/characterDisplay.js";
import TimeBar from "./TimeBar.jsx";

export default function PlayerInfo({
  player,
  game,
  characters,
  align,
  viewColor = COLORS.black,
  canSwitchView = false,
  onViewColor,
  isWinner = false,
  isActiveTurn = false,
  isDrawResult = false,
  isSkillTargeting = false
}) {
  const [skillDetailOpen, setSkillDetailOpen] = useState(false);
  if (!player) return <aside className="player-info empty" />;
  const character = findCharacter(characters, player.character ?? player.characterId);
  const skillUses = game.skillUses[player.color] ?? 0;
  const skillCost = game.skillCosts?.[player.color] ?? 0;
  const skillRemovals = player.skillRemovals ?? game.skillRemovals?.[player.color] ?? 0;
  const resultBadge = isDrawResult ? null : isWinner ? "胜" : game.phase === "finished" ? "负" : null;
  return (
    <aside className={`player-info ${align} ${isWinner ? "winner" : ""} ${isActiveTurn ? "active-turn" : ""} ${isDrawResult ? "draw-result" : ""}`}>
      <div className="portrait-wrap">
        {canSwitchView && (
          <button
            className={`viewpoint-button ${viewColor === player.color ? "active" : ""}`}
            type="button"
            title={`切换到${player.color === COLORS.black ? "黑方" : "白方"}视角`}
            onClick={() => onViewColor?.(player.color)}
          >
            <Eye size={18} />
          </button>
        )}
        <img src={character.portrait} alt={character.name} />
        {resultBadge && <span className={`result-badge ${resultBadge === "胜" ? "win" : "loss"}`}>{resultBadge}</span>}
      </div>
      <div className="player-meta">
        <button className="name-button">{player.user.username}</button>
        <span className="meta-tag rank-tag">{player.user.rank}</span>
        <span className={`color-badge ${player.color}`} title={player.color === COLORS.black ? "执黑" : "执白"} />
        <span className="meta-tag rating-tag">{player.user.rating}分</span>
      </div>
      <TimeBar time={player.time} />
      <div className="captures">
        <span><strong>提子</strong>{player.captures}</span>
        <span><strong>除子</strong>{skillRemovals}</span>
        <span className="cost-stat"><strong>代价</strong>{skillCost}</span>
      </div>
      <div
        className={`skill-chip-wrap ${skillDetailOpen ? "open" : ""}`}
        onMouseLeave={() => setSkillDetailOpen(false)}
      >
        <button
          className={`skill-chip ${skillUses <= 0 ? "spent" : ""} ${isSkillTargeting ? "targeting" : ""}`}
          type="button"
          onClick={() => setSkillDetailOpen((open) => !open)}
          onFocus={() => setSkillDetailOpen(true)}
          onMouseEnter={() => setSkillDetailOpen(true)}
        >
          <Sparkles size={16} />
          {character.skill.name} · {skillUses}
        </button>
        <div className="skill-detail-panel" aria-hidden={!skillDetailOpen}>
          {character.skill.description || "暂无技能说明。"}
        </div>
      </div>
    </aside>
  );
}
