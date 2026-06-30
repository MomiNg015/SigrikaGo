import { memo, useEffect, useId, useRef, useState } from "react";
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
  trailingAction = null,
  floatingLayerZ,
  onFloatingLayerRequest
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const panelId = useId();
  const widgetRef = useRef(null);
  const logRef = useRef(null);
  const chatCount = playerChatCount(room.chat);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [chatCount, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!widgetRef.current || widgetRef.current.contains(event.target)) return;
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

  function submitChat(event) {
    event.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText) return;
    onChat(trimmedText);
    setText("");
  }

  return (
    <div
      className={isOpen ? "chat-widget open" : "chat-widget"}
      ref={widgetRef}
      style={floatingLayerZ ? { "--room-floating-z": floatingLayerZ } : undefined}
      onPointerDownCapture={() => {
        if (isOpen) onFloatingLayerRequest?.();
      }}
    >
      <button
        type="button"
        className="chat-toggle-button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => {
          onFloatingLayerRequest?.();
          setIsOpen((current) => !current);
        }}
      >
        <MessageCircle size={18} />
        <span>对局聊天</span>
        <strong>{chatCount}</strong>
      </button>
      {trailingAction}
      {isOpen && (
        <section className="chat-box chat-popover" id={panelId}>
          <header>
            <span><MessageCircle size={18} />对局聊天</span>
            <button type="button" className="chat-close-button" aria-label="关闭对局聊天" onClick={() => setIsOpen(false)}>
              <X size={17} />
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
              <button type="submit" aria-label="发送聊天消息"><Send size={18} /></button>
            </form>
          )}
          {readonly && disabledInputMessage && (
            <form className="chat-form-disabled" aria-label={disabledInputMessage}>
              <input value={disabledInputMessage} disabled readOnly />
              <button type="button" disabled aria-label={disabledInputMessage}><Send size={18} /></button>
            </form>
          )}
        </section>
      )}
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
