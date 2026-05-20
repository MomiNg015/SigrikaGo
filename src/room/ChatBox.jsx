import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { formatMessageTime } from "./roomView.js";

export default function ChatBox({ room, onChat, readonly = false }) {
  const [text, setText] = useState("");
  const logRef = useRef(null);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [room.chat.length]);

  return (
    <section className="chat-box">
      <header><MessageCircle size={18} />对局聊天</header>
      <div className="chat-log" ref={logRef}>
        {room.chat.map((message) => (
          <p key={message.id} className={`${message.type} ${message.kind ?? ""}`}>
            <span>[{message.moveNumber}手 {formatMessageTime(message.createdAt)}]</span>
            {message.type === "chat" && <strong>{message.username}：</strong>}
            {message.text}
          </p>
        ))}
      </div>
      {!readonly && (
        <form onSubmit={(event) => {
          event.preventDefault();
          onChat(text);
          setText("");
        }}>
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder="输入聊天内容" />
          <button><Send size={18} /></button>
        </form>
      )}
    </section>
  );
}
