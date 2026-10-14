import WindowLoadingState from "./WindowLoadingState.jsx";
import WindowEmptyState from "./WindowEmptyState.jsx";
import { Crown, Flag, Handshake } from "lucide-react";
import { findCharacter } from "../shared/characterDisplay.js";
import { COLORS } from "../shared/game.js";
import { recordWinnerColor } from "../shared/gameRecords.js";
import { costumePortraitFrameStyle } from "../shared/costumes.js";
import {
  SIGRIKA_CORRUPTED_PLAYER_PORTRAIT_ASSET,
  SIGRIKA_CORRUPTED_PORTRAIT_ASSET
} from "../shared/characterPortraitAssetCatalog.js";
import { SIGRIKA_CANDY_DUEL } from "../shared/sigrikaCandyArc.js";

export function ReplayList({ records = [], characters, onOpenReplay, compact = false, currentUser = null }) {
  if (records.length === 0) return <WindowEmptyState compact={compact}>暂无对局回放</WindowEmptyState>;

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
        const isSigrikaCandyDuel = record.matchSource === SIGRIKA_CANDY_DUEL.matchSource;
        const specialHumanColor = isSigrikaCandyDuel ? replayColorForUser(record, currentUser) : "";
        return (
        <button className={`replay-table-row ${outcome ? `outcome-${outcome}` : ""} ${isSigrikaCandyDuel ? "is-sigrika-candy-duel-replay" : ""}`} key={record.id} type="button" onClick={() => onOpenReplay?.(record.id)}>
          <span className="replay-time-cell">
            {isSigrikaCandyDuel && (
              <span className="replay-corner-icon sigrika-duel-boss-icon" aria-hidden="true">
                <Crown size={14} />
              </span>
            )}
            {record.mode === "team" && <span className="replay-corner-icon replay-team-icon" role="img" title="队际赛" aria-label="队际赛"><Flag size={16} aria-hidden="true" /></span>}
            {friendly && !isSigrikaCandyDuel && record.mode !== "team" && (
              <span className="replay-corner-icon replay-friendly-icon" role="img" title="友谊对局" aria-label="友谊对局">
                <Handshake size={16} aria-hidden="true" />
              </span>
            )}
            <span>{formatReplayTime(record.createdAt)}</span>
          </span>
          <ReplayPlayer
            side="black"
            name={record.blackName}
            characterId={record.blackCharacter}
            costumePortraitUrl={record.blackCostumePortraitUrl}
            costumeFraming={replayCostumeFraming(record, "black")}
            characters={characters}
            specialPortrait={isSigrikaCandyDuel ? specialReplayPortrait("black", specialHumanColor, record.blackName) : null}
          />
          <ReplayPlayer
            side="white"
            name={record.whiteName}
            characterId={record.whiteCharacter}
            costumePortraitUrl={record.whiteCostumePortraitUrl}
            costumeFraming={replayCostumeFraming(record, "white")}
            characters={characters}
            specialPortrait={isSigrikaCandyDuel ? specialReplayPortrait("white", specialHumanColor, record.whiteName) : null}
          />
          <span className="replay-result-cell">{record.resultText}</span>
          <span className="replay-moves-cell room-header-scoreboard">
            <span className="replay-moves-text">{record.moveCount}手</span>
            <span className="replay-move-placard room-scoreboard-identity" aria-hidden="true">
              <span className={`room-move-placard${record.moveCount >= 1000 ? " is-long-count" : record.moveCount >= 100 ? " is-medium-count" : ""}`}>
                <strong>{record.moveCount}</strong><span>手</span>
              </span>
            </span>
          </span>
        </button>
        );
      })}
    </div>
  );
}

export function PaginatedReplayList({ pagination, characters, currentUser, onOpenReplay, compact = false }) {
  const { records, loading, error, hasMore, retry } = pagination;
  return (
    <>
      {records.length > 0 && (
        <ReplayList
          records={records}
          characters={characters}
          currentUser={currentUser}
          onOpenReplay={onOpenReplay}
          compact={compact}
        />
      )}
      {!loading && !error && records.length === 0 && <ReplayList records={[]} characters={characters} />}
      {loading && <WindowLoadingState compact={records.length > 0}>{records.length > 0 ? "正在加载更早的棋谱..." : "加载中..."}</WindowLoadingState>}
      {error && (
        <div className="replay-pagination-error">
          <p className="room-people-error">{error}</p>
          <button type="button" onClick={retry}>重新加载</button>
        </div>
      )}
    </>
  );
}

function ReplayPlayer({ side, name, characterId, costumePortraitUrl, costumeFraming, characters, specialPortrait = null }) {
  const character = findCharacter(characters, characterId);
  const portraitUrl = specialPortrait?.url || costumePortraitUrl || character?.portrait || "";
  return (
    <span className={`replay-player-cell replay-player-${side}`}>
      <span className={`replay-stone is-${side}`} role="img" aria-label={side === "black" ? "黑方" : "白方"} />
      {portraitUrl && (
        <img
          className={specialPortrait ? `sigrika-duel-replay-portrait is-${specialPortrait.kind}` : undefined}
          src={portraitUrl}
          style={!specialPortrait && costumePortraitUrl ? costumePortraitFrameStyle(costumeFraming) : undefined}
          alt={specialPortrait?.alt ?? character?.name ?? name}
        />
      )}
      <b>{name}</b>
    </span>
  );
}

function specialReplayPortrait(side, humanColor, playerName) {
  const isHuman = humanColor
    ? side === humanColor
    : playerName !== "西格莉卡？";
  return isHuman
    ? { ...SIGRIKA_CORRUPTED_PLAYER_PORTRAIT_ASSET, kind: "player", alt: "玩家" }
    : { ...SIGRIKA_CORRUPTED_PORTRAIT_ASSET, kind: "npc", alt: "西格莉卡？" };
}

function replayCostumeFraming(record, side) {
  const prefix = side === "white" ? "white" : "black";
  return {
    portraitScalePercent: record[`${prefix}CostumePortraitScalePercent`],
    portraitOffsetXPercent: record[`${prefix}CostumePortraitOffsetXPercent`],
    portraitOffsetYPercent: record[`${prefix}CostumePortraitOffsetYPercent`]
  };
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
