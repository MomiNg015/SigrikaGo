import { Hash, MessageSquareText, PanelRight, Settings } from "lucide-react";
import { roomCloseCountdownText } from "../roomState.js";

export default function RoomHeader({
  closeCountdownNow,
  isReplay,
  room,
  roomGameInfo,
  showCloseCountdown,
  showCoords,
  showMoves,
  onOpenMessageBoard,
  onOpenSettings,
  onToggleCoords,
  onToggleMoves
}) {
  return (
    <header className="room-header">
      <div className="room-title-stack">
        <p className="room-title-line">
          <span className="room-code-label">房间号 {room.code}</span>
          {roomGameInfo && (
            <>
              <span className="room-info-tag black-side">黑方：{roomGameInfo.black}</span>
              <span className="room-info-tag white-side">白方：{roomGameInfo.white}</span>
              <span className="room-info-tag move-count">{roomGameInfo.moves}</span>
            </>
          )}
        </p>
        {showCloseCountdown && (
          <span className="room-info-tag close-countdown">
            {roomCloseCountdownText(room.closesAt, closeCountdownNow)}
          </span>
        )}
        {isReplay && <h1>棋谱回放</h1>}
      </div>
      <div className="room-toggles">
        <button className="toggle" onClick={onOpenMessageBoard} title="留言板"><MessageSquareText size={16} /></button>
        <button className="toggle" onClick={onOpenSettings} title="设置"><Settings size={16} /></button>
        <button className={showMoves ? "toggle active" : "toggle"} onClick={onToggleMoves} title="显示手数"><Hash size={16} /></button>
        <button className={showCoords ? "toggle active" : "toggle"} onClick={onToggleCoords} title="显示坐标"><PanelRight size={16} /></button>
      </div>
    </header>
  );
}
