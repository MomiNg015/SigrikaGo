import { useEffect } from "react";
import { api } from "../api/client.js";

export function useReplayRecords({ enabled, showHouse, showToast, token, setReplayRecords }) {
  useEffect(() => {
    const shouldLoad = enabled ?? showHouse;
    if (!shouldLoad || !token) return;
    api("/api/replays", { token })
      .then((data) => setReplayRecords(data.records))
      .catch((error) => showToast(error.message));
  }, [enabled, showHouse, showToast, token, setReplayRecords]);
}
