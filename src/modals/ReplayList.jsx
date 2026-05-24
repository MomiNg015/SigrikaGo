import { findCharacter } from "../shared/characterDisplay.js";

export function ReplayList({ records = [], characters, onOpenReplay, compact = false }) {
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
      {records.map((record) => (
        <button className="replay-table-row" key={record.id} type="button" onClick={() => onOpenReplay?.(record.id)}>
          <span>{formatReplayTime(record.createdAt)}</span>
          <ReplayPlayer name={record.blackName} characterId={record.blackCharacter} characters={characters} />
          <ReplayPlayer name={record.whiteName} characterId={record.whiteCharacter} characters={characters} />
          <span>{record.resultText}</span>
          <span>{record.moveCount}手</span>
        </button>
      ))}
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
