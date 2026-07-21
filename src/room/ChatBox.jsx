import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Send, X } from "lucide-react";
import { CHARACTERS } from "../shared/characters.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { formatMessageTime } from "./roomView.js";

function ChatBox({
  room,
  onChat,
  readonly = false,
  disabledInputMessage = "",
  compactMessages = false,
  label = "对局聊天",
  mobileDockPopup = false,
  trailingAction = null,
  floatingLayerZ,
  onFloatingLayerRequest
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const panelId = useId();
  const widgetRef = useRef(null);
  const toggleRef = useRef(null);
  const panelRef = useRef(null);
  const logRef = useRef(null);
  const [popupAnchor, setPopupAnchor] = useState(null);
  const chatCount = playerChatCount(room.chat);

  const positionPopupAboveTrigger = useCallback(() => {
    if (!mobileDockPopup || !toggleRef.current || typeof window === "undefined") return;
    const rect = toggleRef.current.getBoundingClientRect();
    const viewportWidth = Math.max(1, window.innerWidth);
    const viewportHeight = Math.max(1, window.innerHeight);
    const edgeInset = 10;
    const triggerGap = 8;
    const width = Math.max(1, Math.min(360, viewportWidth - (edgeInset * 2)));
    const left = Math.min(
      Math.max(rect.left, edgeInset),
      Math.max(edgeInset, viewportWidth - edgeInset - width)
    );
    const maxHeight = Math.max(1, rect.top - edgeInset - triggerGap);
    const originX = Math.min(
      Math.max((rect.left + (rect.width / 2)) - left, 24),
      Math.max(24, width - 24)
    );
    setPopupAnchor({
      left,
      bottom: Math.max(edgeInset, viewportHeight - rect.top + triggerGap),
      width,
      height: Math.min(460, maxHeight),
      maxHeight,
      originX
    });
  }, [mobileDockPopup]);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [chatCount, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (widgetRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) return;
      setIsOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !mobileDockPopup) return undefined;
    positionPopupAboveTrigger();
    window.addEventListener("resize", positionPopupAboveTrigger);
    window.visualViewport?.addEventListener("resize", positionPopupAboveTrigger);
    return () => {
      window.removeEventListener("resize", positionPopupAboveTrigger);
      window.visualViewport?.removeEventListener("resize", positionPopupAboveTrigger);
    };
  }, [isOpen, mobileDockPopup, positionPopupAboveTrigger]);

  function submitChat(event) {
    event.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText) return;
    onChat(trimmedText);
    setText("");
  }

  const popupStyle = mobileDockPopup && popupAnchor
    ? {
      "--chat-popup-origin-x": `${popupAnchor.originX}px`,
      "--room-floating-z": floatingLayerZ,
      position: "fixed",
      zIndex: floatingLayerZ ?? 141,
      display: "grid",
      left: popupAnchor.left,
      right: "auto",
      bottom: popupAnchor.bottom,
      width: popupAnchor.width,
      height: popupAnchor.height,
      maxHeight: popupAnchor.maxHeight,
      pointerEvents: "auto"
    }
    : floatingLayerZ
      ? { "--room-floating-z": floatingLayerZ }
      : undefined;
  const popup = isOpen && (
    <section
      className={mobileDockPopup ? "chat-box chat-popover tutorial-story-log-popover" : "chat-box chat-popover"}
      id={panelId}
      ref={panelRef}
      role={mobileDockPopup ? "tabpanel" : undefined}
      aria-labelledby={mobileDockPopup ? `${panelId}-trigger` : undefined}
      style={popupStyle}
      onPointerDownCapture={onFloatingLayerRequest}
    >
      <header>
        <span><MessageCircle size={18} aria-hidden="true" />{label}</span>
        <button type="button" className="chat-close-button" aria-label={`关闭${label}`} onClick={() => setIsOpen(false)}>
          <X size={17} aria-hidden="true" />
        </button>
      </header>
      <div className="chat-log" ref={logRef}>
        {room.chat.map((message) => (
          <p key={message.id} className={`${message.type} ${message.kind ?? ""}`}>
            {chatMessageMetaLabel(message, { compactMessages }) && (
              <span>{chatMessageMetaLabel(message, { compactMessages })}</span>
            )}
            {message.type === "chat" && <strong>{chatDisplayName(message, room, { compactMessages })}：</strong>}
            {message.text}
          </p>
        ))}
      </div>
      {!readonly && (
        <form onSubmit={submitChat}>
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder="输入聊天内容" />
          <button type="submit" aria-label="发送聊天消息"><Send size={18} aria-hidden="true" /></button>
        </form>
      )}
      {readonly && disabledInputMessage && (
        <form className="chat-form-disabled" aria-label={disabledInputMessage}>
          <input value={disabledInputMessage} disabled readOnly />
          <button type="button" disabled aria-label={disabledInputMessage}><Send size={18} aria-hidden="true" /></button>
        </form>
      )}
    </section>
  );
  const popupLayer = mobileDockPopup && popup && typeof document !== "undefined" && document.body
    ? createPortal(popup, widgetRef.current?.closest?.(".app-shell") ?? document.body)
    : popup;
  const widgetStyle = mobileDockPopup
    ? {
      "--room-floating-z": floatingLayerZ,
      width: "100%",
      minWidth: 0,
      maxWidth: "none",
      alignSelf: "stretch",
      display: "block"
    }
    : floatingLayerZ
      ? { "--room-floating-z": floatingLayerZ }
      : undefined;

  return (
    <div
      className={`${isOpen ? "chat-widget open" : "chat-widget"}${mobileDockPopup ? " tutorial-mobile-story-log" : ""}`}
      ref={widgetRef}
      role={mobileDockPopup ? "presentation" : undefined}
      style={widgetStyle}
      onPointerDownCapture={() => {
        if (isOpen) onFloatingLayerRequest?.();
      }}
    >
      <button
        type="button"
        className={`chat-toggle-button${mobileDockPopup ? " mobile-tab-button" : ""}${mobileDockPopup && isOpen ? " active" : ""}`}
        id={mobileDockPopup ? `${panelId}-trigger` : undefined}
        ref={toggleRef}
        role={mobileDockPopup ? "tab" : undefined}
        aria-expanded={isOpen}
        aria-selected={mobileDockPopup ? isOpen : undefined}
        aria-controls={panelId}
        style={mobileDockPopup ? { width: "100%", minWidth: 0 } : undefined}
        onClick={() => {
          onFloatingLayerRequest?.();
          if (!isOpen) positionPopupAboveTrigger();
          setIsOpen((current) => !current);
        }}
      >
        <MessageCircle size={18} aria-hidden="true" />
        <span>{label}</span>
        <strong>{chatCount}</strong>
      </button>
      {trailingAction}
      {popupLayer}
    </div>
  );
}

export function areChatBoxPropsEqual(previous, next) {
  return previous.room?.code === next.room?.code
    && previous.room?.chat === next.room?.chat
    && sameChatPlayers(previous.room?.players, next.room?.players)
    && previous.onChat === next.onChat
    && previous.readonly === next.readonly
    && previous.disabledInputMessage === next.disabledInputMessage
    && previous.compactMessages === next.compactMessages
    && previous.label === next.label
    && previous.mobileDockPopup === next.mobileDockPopup
    && previous.trailingAction === next.trailingAction
    && previous.floatingLayerZ === next.floatingLayerZ
    && previous.onFloatingLayerRequest === next.onFloatingLayerRequest;
}

export function playerChatCount(messages = []) {
  return messages.filter((message) => message?.type === "chat").length;
}

function sameChatPlayers(previous = [], next = []) {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  return previous.every((player, index) => sameChatPlayer(player, next[index]));
}

function sameChatPlayer(previous, next) {
  return previous?.color === next?.color
    && previous?.character === next?.character
    && previous?.characterId === next?.characterId
    && previous?.user?.id === next?.user?.id;
}

export function chatMessageMetaLabel(message, { compactMessages = false } = {}) {
  if (compactMessages) return "";
  return `[${message.moveNumber}手 ${formatMessageTime(message.createdAt)}]`;
}

export function chatDisplayName(message, room, { compactMessages = false } = {}) {
  const player = room.players?.find((candidate) => candidate.user?.id === message.userId);
  const username = message.username ?? player?.user?.username ?? "玩家";
  if (compactMessages) return username;
  if (!player) return username;
  const character = findCharacter(CHARACTERS, player.character ?? player.characterId);
  return `${username}[${character.name}]`;
}

export default memo(ChatBox, areChatBoxPropsEqual);
