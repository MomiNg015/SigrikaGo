import { characterPortraitImageProps } from "../../shared/characterPortraits.js";
import { findCharacter } from "../../shared/characterDisplay.js";
import UserIdentity from "../../shared/UserIdentity.jsx";

export function leaderboardRankClass(rank) {
  return rank >= 1 && rank <= 3 ? `top-rank rank-${rank}` : "";
}

export default function LeaderboardRow({ player, rank, characters, highlight = false, pinned = false }) {
  const character = findCharacter(characters, player.commonCharacter);
  const characterId = character?.id ?? player.commonCharacter ?? "";
  const winRate = player.totalGames > 0 ? `${((player.wins / player.totalGames) * 100).toFixed(1)}%` : "0.0%";
  const draws = player.draws ?? Math.max(0, (player.totalGames ?? 0) - (player.wins ?? 0) - (player.losses ?? 0));
  return (
    <article className={`leaderboard-row ${leaderboardRankClass(rank)} ${highlight ? "current-user" : ""} ${pinned ? "pinned" : ""}`} data-rank={rank}>
      <strong className="leaderboard-rank">#{rank}</strong>
      <div className="leaderboard-avatar" data-character-id={characterId}>
        <img {...characterPortraitImageProps(character, { itemEffects: player.itemEffects, user: player })} alt={`${player.username}头像`} />
      </div>
      <div className="leaderboard-player">
        <strong>
          <UserIdentity user={player} compact />
        </strong>
        <span>{player.rank}</span>
      </div>
      <span>{player.rank}</span>
      <b className="text-rating-value">{player.rating}</b>
      <div className="leaderboard-mobile-record" aria-label={`战绩 胜${player.wins} 负${player.losses} 和${draws}`}>
        <span><strong>胜</strong>{player.wins}</span>
        <span><strong>负</strong>{player.losses}</span>
        <span><strong>和</strong>{draws}</span>
      </div>
      <span>{player.totalGames}</span>
      <span>{player.wins}</span>
      <span>{player.losses}</span>
      <span>{winRate}</span>
    </article>
  );
}
