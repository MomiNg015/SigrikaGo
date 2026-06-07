import { useEffect } from "react";
import { api } from "../api/client.js";

export function useReplayRecords({ showHouse, showToast, token, setReplayRecords }) {
  useEffect(() => {
    if (!showHouse || !token) return;
    api("/api/replays", { token })
      .then((data) => setReplayRecords(data.records))
      .catch((error) => showToast(error.message));
  }, [showHouse, showToast, token, setReplayRecords]);
}
