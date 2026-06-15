import { useEffect, useState } from "react";
import { Trophy, X } from "lucide-react";
import { api } from "../api/client.js";
import LeaderboardRow, { leaderboardRankClass } from "./leaderboard/LeaderboardRow.jsx";
import { modeOrderedEntries } from "../shared/gameModes.js";

export default function LeaderboardModal({ token, user, characters, onClose }) {
  const [mode, setMode] = useState("spark");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUserIndex = players.findIndex((player) => isLeaderboardCurrentUser(player, user));
  const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : null;
  const currentUserPlayer = currentUserRank ? players[currentUserIndex] : null;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    api(`/api/leaderboard?mode=${encodeURIComponent(mode)}`, { token })
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
  }, [token, mode]);

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
        <ModeTabs mode={mode} onModeChange={setMode} />
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
                  highlight={isLeaderboardCurrentUser(player, user)}
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

export { leaderboardRankClass } from "./leaderboard/LeaderboardRow.jsx";

export function isLeaderboardCurrentUser(player, user) {
  if (!player || !user) return false;
  if (player.id != null && user.id != null && String(player.id) === String(user.id)) return true;
  return Boolean(player.username && user.username && player.username === user.username);
}

function ModeTabs({ mode, onModeChange }) {
  return (
    <div className="mode-tabs" role="tablist" aria-label="对弈模式">
      {modeOrderedEntries().map((entry) => (
        <button
          key={entry.id}
          type="button"
          role="tab"
          aria-selected={mode === entry.id}
          className={mode === entry.id ? "active" : ""}
          onClick={() => onModeChange(entry.id)}
        >
          {entry.title}
        </button>
      ))}
    </div>
  );
}
