import { useEffect, useState } from "react";
import { useRoomActionsSyncing } from "./useRoomActionsReady.js";

export default function ConnectionNotice({ socket, startupError, onRetry }) {
  const syncing = useRoomActionsSyncing(socket);
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
  if (!startupError && (!socket || (connected && !syncing))) return null;
  async function retry() {
    setRetrying(true);
    try { await onRetry?.(); } finally { setRetrying(false); }
  }
  return (
    <aside className="connection-notice" role="status" aria-live="polite">
      <span>{startupError?.message || (connected && syncing ? "连接已恢复，正在同步对局…" : "连接已断开，正在重连…")}</span>
      {startupError && <button type="button" disabled={retrying} onClick={retry}>{retrying ? "重试中…" : "重试"}</button>}
    </aside>
  );
}
