import WindowLoadingState from "./WindowLoadingState.jsx";
import WindowEmptyState from "./WindowEmptyState.jsx";
import WindowBookmarkTabs from "./WindowBookmarkTabs.jsx";
import WindowTitleSticker from "./WindowTitleSticker.jsx";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "../api/client.js";
import LeaderboardRow from "./leaderboard/LeaderboardRow.jsx";
import { modeOrderedEntries } from "../shared/gameModes.js";
import { CAPTURE_CHALLENGE_MODE } from "../shared/captureChallenge.js";
import { ModalDialog } from "./modalComponents.jsx";

export default function LeaderboardModal({ token, user, characters, onClose }) {
  const [mode, setMode] = useState("spark");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isCapture = mode === CAPTURE_CHALLENGE_MODE;
  const currentUserIndex = players.findIndex((player) => isLeaderboardCurrentUser(player, user));
  const currentUserPlayer = currentUserIndex >= 0 ? players[currentUserIndex] : null;
  const currentUserRank = currentUserPlayer ? (isCapture ? currentUserPlayer.ranking : currentUserIndex + 1) : null;

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
      <ModalDialog className="leaderboard-modal window-sticker-host window-bookmark-host" ariaLabelledBy="leaderboard-modal-title" onClose={onClose} onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" aria-label="关闭排行榜" onClick={onClose}><X size={20} /></button>
        <header className="leaderboard-header window-sticker-header">
          <WindowTitleSticker titleKey="leaderboard" id="leaderboard-modal-title" />
        </header>
        <ModeTabs mode={mode} onModeChange={setMode} />
        {loading && <WindowLoadingState>加载中...</WindowLoadingState>}
        {error && <p className="form-error admin-action-error">{error}</p>}
        {!loading && !error && players.length === 0 && <WindowEmptyState>暂无上榜用户。</WindowEmptyState>}
        {!loading && !error && players.length > 0 && (
          <div className={`leaderboard-table${isCapture ? " capture-leaderboard" : ""}`}>
            <div className="leaderboard-heading">
              <span>排名</span>
              <span>{isCapture ? "纪录角色" : "常用角色"}</span>
              <span>用户名</span>
              <span>段位</span>
              <span>{isCapture ? "提子数" : "积分"}</span>
              {!isCapture && <>
              <span>总对局数</span>
              <span>胜局数</span>
              <span>负局数</span>
              <span>胜率</span>
              </>}
            </div>
            <div className="leaderboard-list">
              {players.map((player, index) => (
                <LeaderboardRow
                  key={player.id}
                  player={player}
                  rank={isCapture ? player.ranking : index + 1}
                  captureChallenge={isCapture}
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
                  captureChallenge={isCapture}
                  characters={characters}
                  highlight
                  pinned
                />
              </div>
            )}
          </div>
        )}
      </ModalDialog>
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
    <WindowBookmarkTabs className="mode-tabs" role="tablist" aria-label="对弈模式">
      {[...modeOrderedEntries(), { id: CAPTURE_CHALLENGE_MODE, shortTitle: "吃子赛" }].map((entry) => (
        <button
          key={entry.id}
          type="button"
          role="tab"
          aria-selected={mode === entry.id}
          className={mode === entry.id ? "active" : ""}
          onClick={() => onModeChange(entry.id)}
        >
          {entry.shortTitle}
        </button>
      ))}
    </WindowBookmarkTabs>
  );
}
