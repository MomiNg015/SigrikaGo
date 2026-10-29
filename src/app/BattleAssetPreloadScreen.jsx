import { useEffect, useMemo, useRef, useState } from "react";
import { CHARACTERS } from "../shared/characters.js";
import { battlePreloadAssets, preloadLoginAssets } from "../shared/preloadAssets.js";
import { preloadPlayableReady } from "./playableReadyPreload.js";
import { canonicalCharacterId } from "../shared/characterAliases.js";
import AssetPreloadScreen from "./AssetPreloadScreen.jsx";

export const PRELOAD_READY_RETRY_DELAYS_MS = Object.freeze([1200, 2400, 5000, 5000]);

export default function BattleAssetPreloadScreen({
  characters = CHARACTERS,
  matchSuccess,
  musicTracks,
  siteSettings,
  socket,
  user
}) {
  const room = matchSuccess?.room;
  const [localProgress, setLocalProgress] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const acknowledgedRoomRef = useRef("");
  const roomCode = room?.code ?? "";
  const roomAssetKey = useMemo(() => (room?.players ?? [])
    .map((player) => canonicalCharacterId(player.character?.id ?? player.characterId))
    .join("|"), [room?.players]);
  const readyCount = Number(room?.preload?.readyCount ?? 0);
  const requiredCount = Math.max(1, Number(room?.preload?.requiredCount ?? room?.players?.length ?? 2));
  const progress = localProgress;
  const character = useMemo(() => ownPreloadCharacter({ characters, room, user }), [characters, room, user]);

  useEffect(() => {
    if (!roomCode || !socket || acknowledgedRoomRef.current === roomCode) return undefined;
    let cancelled = false;
    let cancelReadyReporter = () => {};
    setLocalProgress(0);
    setLoadError(false);
    const assets = battlePreloadAssets({ room, characters, tracks: musicTracks, user });
    Promise.all([preloadPlayableReady({ includePixi: true, mode: room?.mode ?? room?.game?.mode }).then((result) => {
      if (!result.coreOk || !result.pixiOk) throw new Error("Battle modules unavailable");
    }), preloadLoginAssets(assets, {
      concurrency: 4,
      taskTimeoutMs: 20000,
      requireComplete: true,
      onProgress: (nextProgress) => {
        if (!cancelled) setLocalProgress(Math.min(0.99, nextProgress));
      }
    })]).then(() => {
      if (cancelled) return;
      setLocalProgress(1);
      cancelReadyReporter = createPreloadReadyReporter({
        socket,
        roomCode,
        onAcknowledged: () => {
          acknowledgedRoomRef.current = roomCode;
        }
      });
    }).catch(() => { if (!cancelled) setLoadError(true); });
    return () => {
      cancelled = true;
      cancelReadyReporter();
    };
  }, [characters, musicTracks, roomAssetKey, roomCode, socket, user, retryKey]);

  return (
    <>
      <AssetPreloadScreen
        character={character}
        loadingLinesText={siteSettings?.characterLoadingLines}
        progress={progress}
        user={user}
        statusText={loadError ? "资源加载失败，请重试" : `资源加载中 ${readyCount}/${requiredCount}`}
        tipsText={siteSettings?.preloadTips}
      />
      {loadError && <button className="asset-preload-retry" type="button" onClick={() => setRetryKey((key) => key + 1)}>重新加载</button>}
    </>
  );
}

export function ownPreloadCharacter({ characters = CHARACTERS, room, user } = {}) {
  const player = (room?.players ?? []).find((candidate) => candidate.user?.id === user?.id)
    ?? (room?.players ?? [])[0]
    ?? null;
  const characterId = canonicalCharacterId(player?.character?.id ?? player?.characterId ?? user?.selectedCharacter);
  const character = player?.character ?? characters?.[characterId] ?? CHARACTERS[characterId] ?? CHARACTERS.sigrika;
  return { ...character, costumeSnapshot: player?.costumeSnapshot ?? null };
}

export function createPreloadReadyReporter({
  socket,
  roomCode,
  onAcknowledged = () => {},
  retryDelaysMs = PRELOAD_READY_RETRY_DELAYS_MS,
  setTimeoutFn = (callback, delay) => globalThis.setTimeout(callback, delay),
  clearTimeoutFn = (timerId) => globalThis.clearTimeout(timerId)
} = {}) {
  if (!socket || !roomCode) return () => {};

  let stopped = false;
  let acknowledged = false;
  let retryIndex = 0;
  let timerId = null;

  const clearRetryTimer = () => {
    if (timerId === null) return;
    clearTimeoutFn(timerId);
    timerId = null;
  };

  const acknowledge = (response = {}) => {
    if (stopped || acknowledged || !response?.ok) return;
    acknowledged = true;
    clearRetryTimer();
    onAcknowledged(response);
  };

  const scheduleRetry = () => {
    if (stopped || acknowledged || timerId !== null) return;
    const delay = retryDelaysMs[Math.min(retryIndex, retryDelaysMs.length - 1)] ?? 5000;
    retryIndex += 1;
    timerId = setTimeoutFn(() => {
      timerId = null;
      reportReady();
    }, delay);
  };

  const reportReady = () => {
    if (stopped || acknowledged) return;
    try {
      socket.emit("room:preload-ready", { roomCode }, acknowledge);
    } catch {
      // Socket.IO can throw when a stale client instance is torn down during navigation.
    }
    scheduleRetry();
  };

  const handleConnect = () => {
    clearRetryTimer();
    reportReady();
  };

  socket.on?.("connect", handleConnect);
  reportReady();

  return () => {
    stopped = true;
    clearRetryTimer();
    socket.off?.("connect", handleConnect);
  };
}
