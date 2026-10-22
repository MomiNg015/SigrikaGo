import { useState } from "react";
import { DoorOpen, Menu, MessageSquareText, PanelRight, Settings } from "lucide-react";
import TestTools from "../actionBar/TestTools.jsx";
import { isCaptureChallenge } from "../../shared/captureChallenge.js";
import { gameModeById } from "../../shared/gameModes.js";
import { roomMatchClassification } from "../../shared/matchClassification.js";

export default function RoomHeader({
  room,
  roomGameInfo,
  showCoords,
  onOpenMessageBoard,
  onOpenSettings,
  onBack,
  exitLabel = "退出房间",
  showUtilityControls = true,
  showTestTools = false,
  testToolsDisabled = false,
  onGameAction,
  onToggleCoords
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showScoreboard = Boolean(roomGameInfo) && !room.sigrikaCandyDuel;
  const moveCount = String(roomGameInfo?.moves ?? "").replace(/^第\s*/, "").replace(/\s*手$/, "").trim();
  const turnColor = ["black", "white"].includes(room.game?.turn) ? room.game.turn : undefined;
  const matchClassification = roomMatchClassification(room);
  const modeLabel = isCaptureChallenge(room)
    ? "吃子赛"
    : room.matchSource === "practice"
      ? "人机"
      : gameModeById(room.game?.mode).shortTitle;
  const closeMobileMenu = (action) => () => {
    setMobileMenuOpen(false);
    action?.();
  };

  return (
    <header className={`room-header${showScoreboard ? " room-header-scoreboard" : ""}`}>
      <div className="room-title-stack">
        {showScoreboard ? <div className="room-scoreboard-identity">
          <div className={`room-move-placard${moveCount.length > 2 ? " is-long-count" : ""}`} data-turn={turnColor} aria-label={`${moveCount}手${turnColor ? `，轮${turnColor === "black" ? "黑" : "白"}方行棋` : ""}`}>
            <strong>{moveCount}</strong><span>手</span>
          </div>
          <div className="room-scoreboard-details">
            <div className="room-scoreboard-meta">
              <span title={matchClassification?.label} aria-label={matchClassification ? `${matchClassification.label} ${modeLabel} ${room.code}` : undefined}>{modeLabel} {room.code}</span>
              {room.team && <span>Round {room.team.round}</span>}
            </div>
            <div className="room-scoreboard-players">
              {roomGameInfo.players?.map(({ color, username, rank }) => (
                <span key={color} className={`room-scoreboard-player ${color}-side`} title={`${color === "black" ? "黑" : "白"}方：${roomGameInfo[color]}`} aria-label={`${color === "black" ? "黑" : "白"}方：${roomGameInfo[color]}`}>
                  <span aria-hidden="true">{color === "black" ? "黑" : "白"}</span>
                  <span className="room-scoreboard-name">{username}</span>
                  <span className="room-scoreboard-rank">{rank}</span>
                </span>
              ))}
            </div>
          </div>
        </div> : <p className="room-title-line">
          <span className={`room-code-label${matchClassification ? ` match-classification-tag is-${matchClassification.id}` : ""}`} title={matchClassification?.label} aria-label={matchClassification ? `${matchClassification.label} ${modeLabel} ${room.code}` : undefined}>{modeLabel}{" "}{room.sigrikaCandyDuel ? "ERROR" : room.code}</span>
          {room.team && <span className="room-info-tag">Round {room.team.round}</span>}
          {roomGameInfo && (
            <>
              <span className="room-info-tag black-side">黑方：{roomGameInfo.black}</span>
              <span className="room-info-tag white-side">白方：{roomGameInfo.white}</span>
              <span className="room-info-tag move-count">{roomGameInfo.moves}</span>
            </>
          )}
        </p>}
      </div>
      {showTestTools && !isCaptureChallenge(room) && <TestTools disabled={testToolsDisabled} onGameAction={onGameAction} />}
      {showUtilityControls && <div className="room-toggles">
        <button className="toggle" onClick={onOpenMessageBoard} title="留言板"><MessageSquareText size={16} /></button>
        <button className="toggle" onClick={onOpenSettings} title="设置"><Settings size={16} /></button>
        <button className="toggle coordinate-toggle" aria-pressed={showCoords} onClick={onToggleCoords} title="显示坐标"><PanelRight size={16} /></button>
      </div>}
      {(showUtilityControls || onBack) && <div className="room-header-quick-actions">
        {showUtilityControls && <button
          className="toggle coordinate-toggle room-mobile-coordinate"
          data-button-role="secondary"
          type="button"
          aria-label="显示坐标"
          aria-pressed={showCoords}
          title="显示坐标"
          onClick={onToggleCoords}
        ><PanelRight size={18} /></button>}
        {onBack && (
          <button
            className="toggle room-mobile-exit"
            data-button-role="danger"
            type="button"
            aria-label={exitLabel}
            title={exitLabel}
            onClick={onBack}
          >
            <DoorOpen size={18} />
          </button>
        )}
      </div>}
      {showUtilityControls && <div className={`room-mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <button
          className="toggle room-mobile-menu-toggle"
          data-button-role="secondary"
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-controls="room-mobile-menu-panel"
          aria-label="选项"
          title="选项"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <Menu size={18} />
        </button>
        <div className="room-mobile-menu-panel" id="room-mobile-menu-panel" aria-hidden={!mobileMenuOpen}>
          <button type="button" onClick={closeMobileMenu(onOpenMessageBoard)}>
            <MessageSquareText size={17} />
            <span>留言</span>
          </button>
          <button type="button" onClick={closeMobileMenu(onOpenSettings)}>
            <Settings size={17} />
            <span>设置</span>
          </button>
        </div>
      </div>}
    </header>
  );
}
