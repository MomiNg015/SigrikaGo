import { useEffect, useMemo, useRef, useState } from "react";
import { CHARACTERS } from "../shared/characters.js";
import { battlePreloadAssets, preloadLoginAssets } from "../shared/preloadAssets.js";
import { canonicalCharacterId } from "../shared/characterAliases.js";
import AssetPreloadScreen from "./AssetPreloadScreen.jsx";

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
  const reportedRoomRef = useRef("");
  const roomCode = room?.code ?? "";
  const roomAssetKey = useMemo(() => (room?.players ?? [])
    .map((player) => canonicalCharacterId(player.character?.id ?? player.characterId))
    .join("|"), [room?.players]);
  const readyCount = Number(room?.preload?.readyCount ?? 0);
  const requiredCount = Math.max(1, Number(room?.preload?.requiredCount ?? room?.players?.length ?? 2));
  const progress = Math.max(localProgress, readyCount / requiredCount);
  const character = useMemo(() => ownPreloadCharacter({ characters, room, user }), [characters, room, user]);

  useEffect(() => {
    if (!roomCode || !socket || reportedRoomRef.current === roomCode) return undefined;
    let cancelled = false;
    setLocalProgress(0);
    const assets = battlePreloadAssets({ room, characters, tracks: musicTracks });
    preloadLoginAssets(assets, {
      taskTimeoutMs: 12000,
      onProgress: (nextProgress) => {
        if (!cancelled) setLocalProgress(nextProgress);
      }
    }).then(() => {
      if (cancelled) return;
      reportedRoomRef.current = roomCode;
      socket.emit("room:preload-ready", { roomCode });
    });
    return () => {
      cancelled = true;
    };
  }, [characters, musicTracks, roomAssetKey, roomCode, socket]);

  return (
    <AssetPreloadScreen
      character={character}
      loadingLinesText={siteSettings?.characterLoadingLines}
      progress={progress}
      statusText={`资源加载中 ${readyCount}/${requiredCount}`}
      tipsText={siteSettings?.preloadTips}
    />
  );
}

export function ownPreloadCharacter({ characters = CHARACTERS, room, user } = {}) {
  const player = (room?.players ?? []).find((candidate) => candidate.user?.id === user?.id)
    ?? (room?.players ?? [])[0]
    ?? null;
  const characterId = canonicalCharacterId(player?.character?.id ?? player?.characterId ?? user?.selectedCharacter);
  return player?.character ?? characters?.[characterId] ?? CHARACTERS[characterId] ?? CHARACTERS.sigrika;
}
