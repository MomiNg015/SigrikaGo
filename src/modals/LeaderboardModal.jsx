import { useEffect, useState } from "react";
import { Trophy, X } from "lucide-react";
import { api } from "../api/client.js";
import { resolveCandyPortrait } from "../shared/candyPortraits.js";
import { findCharacter } from "../shared/characterDisplay.js";

export default function LeaderboardModal({ token, user, characters, onClose }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUserIndex = players.findIndex((player) => player.id === user?.id);
  const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : null;
  const currentUserPlayer = currentUserRank ? players[currentUserIndex] : null;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    api("/api/leaderboard", { token })
      .then((data) => {
        if (alive) setPlayers(data.players ?? []);
      })
      .catch((apiError) => {
        if (alive) setError(apiError.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="leaderboard-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <header className="leaderboard-header">
          <Trophy size={26} />
          <div>
            <h2>排行榜</h2>
            <p className="quiet-text">至少完成一盘对局的注册用户</p>
          </div>
        </header>
        {loading && <p className="quiet-text">加载中...</p>}
        {error && <p className="form-error admin-action-error">{error}</p>}
        {!loading && !error && players.length === 0 && <p className="quiet-text">暂无上榜用户。</p>}
        {!loading && !error && players.length > 0 && (
          <div className="leaderboard-table">
            <div className="leaderboard-heading">
              <span>排名</span>
              <span>常用角色</span>
              <span>用户名</span>
              <span>段位</span>
              <span>积分</span>
              <span>总对局数</span>
              <span>胜局数</span>
              <span>负局数</span>
              <span>胜率</span>
            </div>
            <div className="leaderboard-list">
              {players.map((player, index) => (
                <LeaderboardRow
                  key={player.id}
                  player={player}
                  rank={index + 1}
                  characters={characters}
                  highlight={player.id === user?.id}
                />
              ))}
            </div>
            {currentUserPlayer && (
              <div className="leaderboard-current">
                <span className="leaderboard-current-label">我的排名</span>
                <LeaderboardRow
                  player={currentUserPlayer}
                  rank={currentUserRank}
                  characters={characters}
                  highlight
                  pinned
                />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function LeaderboardRow({ player, rank, characters, highlight = false, pinned = false }) {
  const character = findCharacter(characters, player.commonCharacter);
  const winRate = player.totalGames > 0 ? `${((player.wins / player.totalGames) * 100).toFixed(1)}%` : "0.0%";
  return (
    <article className={`leaderboard-row ${highlight ? "current-user" : ""} ${pinned ? "pinned" : ""}`}>
      <strong className="leaderboard-rank">#{rank}</strong>
      <img src={resolveCandyPortrait(character, player.itemEffects)} alt={character.name} />
      <div className="leaderboard-player">
        <strong>{player.username}</strong>
        <span>{character.name}</span>
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
