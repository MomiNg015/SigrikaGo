import { useState } from "react";
import { MonitorPlay, X } from "lucide-react";
import { api } from "../api/client.js";
import { CHARACTERS } from "../shared/characters.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { ReplayList } from "./ReplayList.jsx";

export function UserProfileCard({ user, characters, token, onOpenReplay }) {
  const mainCharacter = findCharacter(characters, user.characterId) ?? CHARACTERS.sigrika;
  const characterStats = user.characterStats ?? [];
  const [replays, setReplays] = useState([]);
  const [showReplays, setShowReplays] = useState(false);
  const [loadingReplays, setLoadingReplays] = useState(false);
  const [replayError, setReplayError] = useState("");

  async function openReplays() {
    setShowReplays(true);
    if (replays.length > 0 || loadingReplays) return;
    setLoadingReplays(true);
    setReplayError("");
    try {
      const data = await api(`/api/users/${user.id}/replays`, { token });
      setReplays(data.records ?? []);
    } catch (error) {
      setReplayError(error.message);
    } finally {
      setLoadingReplays(false);
    }
  }

  return (
    <section className="user-profile-card">
      <div className="profile-resume-hero">
        <img src={mainCharacter.portrait} alt={mainCharacter.name} />
        <div>
          <h3>{user.username}</h3>
          <p>{user.rank} · {user.rating}分</p>
        </div>
      </div>
      <div className="profile-resume-stats">
        <span><b>{user.record ?? "0局 · 0胜0负0和"}</b><small>战绩</small></span>
        <span><b>{user.rating}分</b><small>积分</small></span>
        <span><b>{user.rank}</b><small>段位</small></span>
      </div>
      <div className="profile-resume-section">
        <strong>角色战绩</strong>
        <div className="profile-character-list">
          {characterStats.map((item) => {
            const character = findCharacter(characters, item.characterId) ?? CHARACTERS.sigrika;
            return (
              <div className="profile-character-row" key={item.characterId}>
                <img src={character.portrait} alt={character.name} />
                <span>{character.name}</span>
                <span>{item.record}</span>
                <b>{item.winRate}</b>
              </div>
            );
          })}
          {characterStats.length === 0 && <p className="quiet-text">暂无角色战绩。</p>}
        </div>
      </div>
      <div className="profile-resume-section">
        <button className="profile-replay-button" type="button" onClick={openReplays}>
          <MonitorPlay size={18} />
          对局回放
        </button>
      </div>
      {showReplays && (
        <div className="modal-backdrop profile-modal-backdrop" onClick={() => setShowReplays(false)}>
          <section className="room-floating-modal replay-dialog profile-replay-dialog" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setShowReplays(false)}><X size={18} /></button>
            <h3>{user.username} 的对局回放</h3>
            <div className="profile-replay-list-scroll">
              {loadingReplays && <p className="quiet-text">加载中...</p>}
              {replayError && <p className="room-people-error">{replayError}</p>}
              {!loadingReplays && !replayError && (
                <ReplayList records={replays} characters={characters} onOpenReplay={onOpenReplay} />
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export function ConfirmPanel({ message, confirmText = "确定", cancelText = "返回", onConfirm, onCancel }) {
  return (
    <section className="inline-confirm-panel">
      <p>{message}</p>
      <div>
        <button className="danger-action" type="button" onClick={onConfirm}>{confirmText}</button>
        <button type="button" onClick={onCancel}>{cancelText}</button>
      </div>
    </section>
  );
}
