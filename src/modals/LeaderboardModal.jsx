import WindowLoadingState from "./WindowLoadingState.jsx";
import WindowEmptyState from "./WindowEmptyState.jsx";
import WindowBookmarkTabs from "./WindowBookmarkTabs.jsx";
import WindowTitleSticker from "./WindowTitleSticker.jsx";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "../api/client.js";
import LeaderboardStandings from "./leaderboard/LeaderboardStandings.jsx";
import { modeOrderedEntries } from "../shared/gameModes.js";
import { CAPTURE_CHALLENGE_MODE } from "../shared/captureChallenge.js";
import { ModalDialog } from "./modalComponents.jsx";

export default function LeaderboardModal({ token, user, characters, onClose, captureOnly = false }) {
  const [selectedMode, setMode] = useState("spark");
  const mode = captureOnly ? CAPTURE_CHALLENGE_MODE : selectedMode;
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isCapture = mode === CAPTURE_CHALLENGE_MODE;

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
    <div className="modal-backdrop" onClick={(event) => { event.stopPropagation(); if (event.target === event.currentTarget) onClose(); }}>
      <ModalDialog className="leaderboard-modal leaderboard-podium-modal window-sticker-host window-bookmark-host" ariaLabel={captureOnly ? "吃子挑战赛排行榜" : undefined} ariaLabelledBy={captureOnly ? undefined : "leaderboard-modal-title"} onClose={onClose} onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" aria-label="关闭排行榜" onClick={onClose}><X size={20} /></button>
        <header className="leaderboard-header window-sticker-header">
          <WindowTitleSticker titleKey="leaderboard" id="leaderboard-modal-title" />
        </header>
        {captureOnly ? <p className="capture-leaderboard-label">吃子挑战赛</p> : <ModeTabs mode={mode} onModeChange={setMode} />}
        {loading && <WindowLoadingState>加载中...</WindowLoadingState>}
        {error && <p className="form-error admin-action-error">{error}</p>}
        {!loading && !error && players.length === 0 && <WindowEmptyState>暂无排行</WindowEmptyState>}
        {!loading && !error && players.length > 0 && (
          <LeaderboardStandings players={players} characters={characters} capture={isCapture} isCurrentUser={player => isLeaderboardCurrentUser(player, user)}/>
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
      {modeOrderedEntries().map((entry) => (
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
