import { Children, isValidElement, useEffect, useState } from "react";
import ActionBar from "../ActionBar.jsx";
import ChatBox from "../ChatBox.jsx";
import PlayerInfo from "../PlayerInfo.jsx";
import RoomPeopleList from "../RoomPeopleList.jsx";

export const MOBILE_ROOM_MEDIA_QUERY = "(max-width: 900px), (pointer: coarse)";

export function DesktopRoomLayout({ children }) {
  return <main className="room-screen desktop-room-screen">{children}</main>;
}

export function MobileRoomLayout({ children }) {
  const [activeMobilePanel, setActiveMobilePanel] = useState("actions");
  const childList = Children.toArray(children);
  const header = childList.find((child) => isElementWithClass(child, "room-header"));
  const battle = childList.find((child) => isElementWithClass(child, "mobile-battle-layout"));
  const overlays = childList.filter((child) => child !== header && child !== battle);
  const battleChildren = Children.toArray(battle?.props?.children);
  const opponentSide = battleChildren.find((child) => isElementWithClass(child, "opponent-side"));
  const boardColumn = battleChildren.find((child) => isElementWithClass(child, "board-column"));
  const roomSide = battleChildren.find((child) => isElementWithClass(child, "room-side"));
  const opponentChildren = Children.toArray(opponentSide?.props?.children).filter(Boolean);
  const boardChildren = Children.toArray(boardColumn?.props?.children).filter(Boolean);
  const roomChildren = Children.toArray(roomSide?.props?.children).filter(Boolean);
  const opponentInfo = opponentChildren.find((child) => isComponentElement(child, PlayerInfo));
  const membersPanel = opponentChildren.find((child) => isComponentElement(child, RoomPeopleList));
  const boardPanel = boardChildren.filter((child) => !isComponentElement(child, ActionBar));
  const actionPanel = boardChildren.find((child) => isComponentElement(child, ActionBar));
  const selfInfo = roomChildren.find((child) => isComponentElement(child, PlayerInfo));
  const chatPanel = roomChildren.find((child) => isComponentElement(child, ChatBox));
  const panels = [
    actionPanel && { id: "actions", label: "操作", content: <div className="mobile-action-panel">{actionPanel}</div> },
    membersPanel && { id: "members", label: "成员", content: membersPanel },
    chatPanel && { id: "chat", label: "聊天", content: chatPanel }
  ].filter(Boolean);
  const selectedPanel = panels.find((panel) => panel.id === activeMobilePanel) ?? panels[0];

  return (
    <main className="room-screen mobile-room-screen">
      {header}
      <section className="mobile-room-viewport mobile-battle-layout">
        <div className="mobile-player-slot mobile-opponent-slot opponent-side">{opponentInfo}</div>
        <div className="mobile-board-viewport mobile-board-slot board-column">{boardPanel}</div>
        <div className="mobile-player-slot mobile-self-slot room-side">{selfInfo}</div>
        {selectedPanel && (
          <section className="mobile-room-dock mobile-room-tabs" aria-label="对局功能">
            <div className="mobile-tab-list" role="tablist">
              {panels.map((panel) => (
                <button
                  key={panel.id}
                  type="button"
                  className={panel.id === selectedPanel.id ? "mobile-tab-button active" : "mobile-tab-button"}
                  role="tab"
                  aria-selected={panel.id === selectedPanel.id}
                  aria-controls={`mobile-room-panel-${panel.id}`}
                  id={`mobile-room-tab-${panel.id}`}
                  onClick={() => setActiveMobilePanel(panel.id)}
                >
                  {panel.label}
                </button>
              ))}
            </div>
            <div
              className="mobile-tab-panel"
              role="tabpanel"
              id={`mobile-room-panel-${selectedPanel.id}`}
              aria-labelledby={`mobile-room-tab-${selectedPanel.id}`}
            >
              {selectedPanel.content}
            </div>
          </section>
        )}
      </section>
      {overlays}
    </main>
  );
}

export function useMobileRoomLayout() {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(MOBILE_ROOM_MEDIA_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia(MOBILE_ROOM_MEDIA_QUERY);
    const update = () => setMatches(media.matches);
    update();
    if (typeof media.addEventListener === "function") media.addEventListener("change", update);
    else media.addListener?.(update);
    return () => {
      if (typeof media.removeEventListener === "function") media.removeEventListener("change", update);
      else media.removeListener?.(update);
    };
  }, []);

  return matches;
}

function isElementWithClass(element, className) {
  return isValidElement(element) && String(element.props?.className ?? "").split(/\s+/).includes(className);
}

function isComponentElement(element, component) {
  return isValidElement(element) && element.type === component;
}
