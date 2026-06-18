import { useEffect, useRef, useState } from "react";
import { timedRoomRequestSnapshot, timedRoomRequestToastForPlayer, timedRoomResponseToast } from "./timedRoomRequests.js";

export function useTimedRoomRequestToast({
  room,
  userId,
  isReplay,
  role,
  onCountingRespond,
  onDrawRespond,
  onScoringAction
}) {
  const [roomRequestToast, setRoomRequestToast] = useState(null);
  const shownTimedRequestKeyRef = useRef("");
  const timedRequestSnapshotRef = useRef(null);

  useEffect(() => {
    shownTimedRequestKeyRef.current = "";
    timedRequestSnapshotRef.current = null;
    setRoomRequestToast(null);
  }, [room?.code]);

  useEffect(() => {
    if (!room || !userId || isReplay || role !== "player") {
      timedRequestSnapshotRef.current = null;
      setRoomRequestToast(null);
      return;
    }

    const currentSnapshot = timedRoomRequestSnapshot(room, userId);
    const previousSnapshot = timedRequestSnapshotRef.current;
    if (previousSnapshot && !currentSnapshot) {
      const responseToast = timedRoomResponseToast(previousSnapshot, room);
      if (responseToast) setRoomRequestToast(responseToast);
    }
    timedRequestSnapshotRef.current = currentSnapshot;

    const nextToast = timedRoomRequestToastForPlayer(room, userId);
    if (nextToast && shownTimedRequestKeyRef.current !== nextToast.key) {
      shownTimedRequestKeyRef.current = nextToast.key;
      setRoomRequestToast(nextToast);
    }
  }, [room, userId, isReplay, role]);

  useEffect(() => {
    if (!roomRequestToast?.autoDismiss) return undefined;
    const timerId = setTimeout(() => {
      setRoomRequestToast((current) => current?.key === roomRequestToast.key ? null : current);
    }, 3800);
    return () => clearTimeout(timerId);
  }, [roomRequestToast?.key, roomRequestToast?.autoDismiss]);

  function handleTimedRequestAction(action) {
    setRoomRequestToast((current) => current ? { ...current, pendingAction: action } : current);
    if (action === "draw:accept") onDrawRespond?.(true);
    if (action === "draw:reject") onDrawRespond?.(false);
    if (action === "counting:accept") onCountingRespond?.(true);
    if (action === "counting:reject") onCountingRespond?.(false);
    if (action === "result:accept") onScoringAction?.({ type: "accept-result" });
    if (action === "result:reject") onScoringAction?.({ type: "reject-result" });
  }

  return {
    roomRequestToast,
    handleTimedRequestAction
  };
}
