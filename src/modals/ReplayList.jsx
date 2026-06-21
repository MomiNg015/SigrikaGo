import { Handshake } from "lucide-react";
import { findCharacter } from "../shared/characterDisplay.js";
import { COLORS } from "../shared/game.js";
import { recordWinnerColor } from "../shared/gameRecords.js";

export function ReplayList({ records = [], characters, onOpenReplay, compact = false, currentUser = null }) {
  if (records.length === 0) return <p className="quiet-text">暂无已结束的对局记录。</p>;

  return (
    <div className={`replay-table ${compact ? "compact" : ""}`}>
      <div className="replay-table-heading">
        <span>时间</span>
        <span>黑方</span>
        <span>白方</span>
        <span>结果</span>
        <span>手数</span>
      </div>
      {records.map((record) => {
        const outcome = replayOutcomeForUser(record, currentUser);
        const friendly = record.rated === false;
        return (
        <button className={`replay-table-row ${outcome ? `outcome-${outcome}` : ""}`} key={record.id} type="button" onClick={() => onOpenReplay?.(record.id)}>
          <span className="replay-time-cell">
            {friendly && (
              <span className="replay-friendly-icon" title="友谊对局" aria-label="友谊对局">
                <Handshake size={16} aria-hidden="true" />
              </span>
            )}
            <span>{formatReplayTime(record.createdAt)}</span>
          </span>
          <ReplayPlayer name={record.blackName} characterId={record.blackCharacter} characters={characters} />
          <ReplayPlayer name={record.whiteName} characterId={record.whiteCharacter} characters={characters} />
          <span>{record.resultText}</span>
          <span>{record.moveCount}手</span>
        </button>
        );
      })}
    </div>
  );
}

function ReplayPlayer({ name, characterId, characters }) {
  const character = findCharacter(characters, characterId);
  return (
    <span className="replay-player-cell">
      {character && <img src={character.portrait} alt={character.name} />}
      <b>{name}</b>
    </span>
  );
}

function formatReplayTime(value) {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

export function replayOutcomeForUser(record = {}, user = null) {
  const playerColor = replayColorForUser(record, user);
  if (!playerColor) return "";
  const winnerColor = recordWinnerColor(record);
  if (!winnerColor) return "draw";
  return winnerColor === playerColor ? "win" : "loss";
}

function replayColorForUser(record, user) {
  const userId = user?.id == null ? "" : String(user.id);
  const username = user?.username ?? "";
  if (userId && String(record.blackUserId ?? "") === userId) return COLORS.black;
  if (userId && String(record.whiteUserId ?? "") === userId) return COLORS.white;
  if (username && record.blackName === username) return COLORS.black;
  if (username && record.whiteName === username) return COLORS.white;
  return "";
}
