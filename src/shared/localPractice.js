// Increment when the worker/job contract or the shipped engine changes.
export const LOCAL_PRACTICE_VERSION = "gnugo-3.8-v1";
export const LOCAL_PRACTICE_BACKEND = "browser";
export const LOCAL_PRACTICE_SEARCH_MS = 30_000;
export const LOCAL_PRACTICE_LEASE_MS = 60_000;
export const LOCAL_PRACTICE_PRESENCE_MS = 10_000;
export const LOCAL_PRACTICE_IDLE_MS = 15 * 60_000;

export function isLocalPractice(room) {
  return room?.matchSource === "practice" && room?.practice?.engineBackend === LOCAL_PRACTICE_BACKEND;
}
