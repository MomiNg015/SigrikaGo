import { useEffect, useState } from "react";

export default function ConnectionNotice({ socket, startupError, onRetry }) {
  const [connected, setConnected] = useState(false);
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    setConnected(Boolean(socket?.connected));
    const online = () => setConnected(true);
    const offline = () => setConnected(false);
    socket?.on?.("connect", online);
    socket?.on?.("disconnect", offline);
    socket?.on?.("connect_error", offline);
    return () => {
      socket?.off?.("connect", online);
      socket?.off?.("disconnect", offline);
      socket?.off?.("connect_error", offline);
    };
  }, [socket]);
  if (!startupError && (!socket || connected)) return null;
  async function retry() {
    setRetrying(true);
    try { await onRetry?.(); } finally { setRetrying(false); }
  }
  return (
    <aside className="connection-notice" role="status" aria-live="polite">
      <span>{startupError?.message || "连接已断开，正在重连…"}</span>
      {startupError && <button type="button" disabled={retrying} onClick={retry}>{retrying ? "重试中…" : "重试"}</button>}
    </aside>
  );
}
