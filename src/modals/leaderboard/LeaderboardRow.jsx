import { resolveCandyPortrait } from "../../shared/candyPortraits.js";
import { findCharacter } from "../../shared/characterDisplay.js";

export function leaderboardRankClass(rank) {
  return rank >= 1 && rank <= 3 ? `top-rank rank-${rank}` : "";
}

export default function LeaderboardRow({ player, rank, characters, highlight = false, pinned = false }) {
  const character = findCharacter(characters, player.commonCharacter);
  const winRate = player.totalGames > 0 ? `${((player.wins / player.totalGames) * 100).toFixed(1)}%` : "0.0%";
  return (
    <article className={`leaderboard-row ${leaderboardRankClass(rank)} ${highlight ? "current-user" : ""} ${pinned ? "pinned" : ""}`} data-rank={rank}>
      <strong className="leaderboard-rank">#{rank}</strong>
      <img src={resolveCandyPortrait(character, player.itemEffects)} alt={`${player.username}头像`} />
      <div className="leaderboard-player">
        <strong>{player.username}</strong>
        <span>{player.rank}</span>
      </div>
      <span>{player.rank}</span>
      <b>{player.rating}</b>
      <span>{player.totalGames}</span>
      <span>{player.wins}</span>
      <span>{player.losses}</span>
      <span>{winRate}</span>
    </article>
  );
}
