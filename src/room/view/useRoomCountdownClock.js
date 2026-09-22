import { useEffect, useState } from "react";
import { countdownClockFrame, reconcileCountdownClock } from "./countdownClock.js";

export function useRoomCountdownClock(room, enabled) {
  const [clock, setClock] = useState(null);
  const [tick, refresh] = useState(0);
  const player = room.players.find((candidate) => candidate.color === room.game.turn);
  const time = player?.time;
  const seconds = time?.periodRemaining;
  const running = enabled && room.game.phase === "playing" && !room.unlimitedTime
    && !time?.unlimited && time?.main <= 0 && time?.periods > 0
    && Number.isInteger(seconds) && seconds >= 1 && seconds <= 10
    && room.players.some((candidate) => candidate.connected !== false);
  const key = running
    ? `${room.code}:${room.game.turn}:${room.game.history.length}:${time.periods}`
    : "";
  const now = performance.now();
  const nextClock = reconcileCountdownClock(clock, key, seconds, now);
  if (nextClock !== clock) setClock(nextClock);
  const frame = nextClock ? countdownClockFrame(nextClock, now) : null;
  const nextAt = frame?.nextAt;

  useEffect(() => {
    if (nextAt == null) return;
    const timer = setTimeout(() => refresh((value) => value + 1), Math.max(1, Math.ceil(nextAt - performance.now())));
    return () => clearTimeout(timer);
  }, [nextAt, tick]);

  if (!frame || frame.seconds === seconds) return room;
  return {
    ...room,
    players: room.players.map((candidate) => candidate === player
      ? { ...candidate, time: { ...time, periodRemaining: frame.seconds } }
      : candidate)
  };
}
