import { COLORS, formatStones } from "../shared/game.js";
import { signedStoneTerm } from "./roomView.js";

export default function ScoringBreakdown({ result, compact = false }) {
  if (!result?.formula) return null;
  const black = result.formula.black;
  const white = result.formula.white;
  const winner = result.winnerColor === COLORS.black ? "黑" : "白";
  const rows = [
    ["黑棋", black],
    ["白棋", white]
  ];

  return (
    <div className={`scoring-breakdown ${compact ? "compact" : ""}`}>
      {rows.map(([label, item]) => (
        <div className="scoring-line" key={label}>
          <strong>{label}</strong>
          <span>
            棋子 {formatStones(item.stones)} + 目数 {formatStones(item.territory)} {signedStoneTerm(item.komi, "贴目")} {signedStoneTerm(item.ownSkillCost, "己方代价")} {signedStoneTerm(item.opponentSkillCost, "对方代价")}
          </span>
          <b>{formatStones(item.total)}</b>
        </div>
      ))}
      <div className="scoring-line result">
        <strong>差值</strong>
        <span>黑棋结果 - 白棋结果</span>
        <b>{winner}胜{formatStones(result.margin)}子</b>
      </div>
    </div>
  );
}
