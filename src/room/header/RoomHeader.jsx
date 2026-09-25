import { useState } from "react";
import { DoorOpen, Menu, MessageSquareText, PanelRight, Settings } from "lucide-react";
import TestTools from "../actionBar/TestTools.jsx";
import { isCaptureChallenge, CAPTURE_CHALLENGE_MOVE_LIMIT } from "../../shared/captureChallenge.js";

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
  const closeMobileMenu = (action) => () => {
    setMobileMenuOpen(false);
    action?.();
  };

  return (
    <header className="room-header">
      <div className="room-title-stack">
        <p className="room-title-line">
          <span className="room-code-label">房间号{room.sigrikaCandyDuel ? "ERROR" : room.code}</span>
          {room.team && <span className="room-info-tag">Round {room.team.round}</span>}
          {roomGameInfo && (
            <>
              <span className="room-info-tag black-side">黑方：{roomGameInfo.black}</span>
              <span className="room-info-tag white-side">白方：{roomGameInfo.white}</span>
              <span className="room-info-tag move-count">{isCaptureChallenge(room)
                ? `吃子赛 ${room.game.moveNumber} / ${CAPTURE_CHALLENGE_MOVE_LIMIT}手 · 提子${room.game.captures?.[room.practice.humanColor] ?? 0}`
                : roomGameInfo.moves}</span>
            </>
          )}
        </p>
      </div>
      {showTestTools && !isCaptureChallenge(room) && <TestTools disabled={testToolsDisabled} onGameAction={onGameAction} />}
      {showUtilityControls && <div className="room-toggles">
        <button className="toggle" onClick={onOpenMessageBoard} title="留言板"><MessageSquareText size={16} /></button>
        <button className="toggle" onClick={onOpenSettings} title="设置"><Settings size={16} /></button>
        <button className="toggle coordinate-toggle" aria-pressed={showCoords} onClick={onToggleCoords} title="显示坐标"><PanelRight size={16} /></button>
      </div>}
      {onBack && (
        <button
          className="toggle room-mobile-exit"
          type="button"
          aria-label={exitLabel}
          title={exitLabel}
          onClick={onBack}
        >
          <DoorOpen size={18} />
        </button>
      )}
      {showUtilityControls && <div className={`room-mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <button
          className="toggle room-mobile-menu-toggle"
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
          <button className="coordinate-toggle" aria-pressed={showCoords} type="button" onClick={closeMobileMenu(onToggleCoords)}>
            <PanelRight size={17} />
            <span>坐标</span>
          </button>
        </div>
      </div>}
    </header>
  );
}
