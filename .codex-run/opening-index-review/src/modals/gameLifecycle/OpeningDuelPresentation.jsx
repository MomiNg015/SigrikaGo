import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { playerCandyPortraitProps, playerCharacterForDisplay } from "../../room/PlayerInfo.jsx";

const ENTRY_MS = 500;
const EXIT_MS = 400;
const ASSET_GRACE_MS = 200;

function openingPortraits(room, characters) {
  return ["black", "white"].map((color) => {
    const player = room.players?.find((candidate) => candidate.color === color);
    const username = player?.user?.username ?? player?.botProfile?.name ?? "";
    if ((player?.isBot || player?.user?.isBot) && player.botProfile?.portraitUrl) {
      return { color, username, name: player.botProfile.name ?? player.user?.username ?? "准时宝", src: player.botProfile.portraitUrl };
    }
    if (!player?.characterId && !player?.character?.id) return null;
    const character = playerCharacterForDisplay(characters, player);
    const image = playerCandyPortraitProps(character, player);
    return image.src ? { color, username, name: character.name, ...image } : null;
  });
}

export default function OpeningDuelPresentation({ room, player, characters, deadline, fallback, children }) {
  const [portraits] = useState(() => openingPortraits(room, characters));
  const [timeline, setTimeline] = useState(null);
  const [failed, setFailed] = useState(false);
  const eligible = room.__openingPresentation === true && room.role === "player"
    && Boolean(player) && portraits.every(Boolean);
  const endsAt = Number(deadline ?? room.openingEndsAt);
  const blackSrc = portraits[0]?.src;
  const whiteSrc = portraits[1]?.src;

  useEffect(() => {
    if (!eligible || !Number.isFinite(endsAt) || endsAt - Date.now() < ENTRY_MS + EXIT_MS) return undefined;
    let disposed = false;
    const images = [blackSrc, whiteSrc].map(() => new Image());
    const timeout = setTimeout(() => {
      disposed = true;
      setFailed(true);
    }, ASSET_GRACE_MS);
    const ready = () => {
      if (disposed || !images.every((image) => image.complete && image.naturalWidth > 0)) return;
      clearTimeout(timeout);
      disposed = true;
      const remaining = endsAt - Date.now();
      if (remaining >= ENTRY_MS + EXIT_MS) setTimeline({ holdMs: remaining - EXIT_MS });
    };
    images.forEach((image, index) => {
      image.onload = ready;
      image.onerror = () => {
        if (!disposed) setFailed(true);
        disposed = true;
        clearTimeout(timeout);
      };
      image.src = [blackSrc, whiteSrc][index];
    });
    ready();
    return () => {
      disposed = true;
      clearTimeout(timeout);
      images.forEach((image) => { image.onload = null; image.onerror = null; });
    };
  }, [eligible, endsAt, blackSrc, whiteSrc]);

  const [ended, setEnded] = useState(() => Number.isFinite(endsAt) && Date.now() >= endsAt);
  useEffect(() => {
    if (!Number.isFinite(endsAt)) return undefined;
    const timeout = setTimeout(() => setEnded(true), Math.max(0, endsAt - Date.now()));
    return () => clearTimeout(timeout);
  }, [endsAt]);

  if (ended) return null;
  if (!eligible || !timeline || failed) return fallback;
  const content = (
    <div className="opening-duel" style={{ "--opening-hold": `${timeline.holdMs}ms`, "--opening-exit": `${EXIT_MS}ms` }}>
      {portraits.map(({ color, name, username, src, style }) => (
        <div key={color} className={`opening-duel-panel opening-duel-${color} opening-duel-${color === player.color ? "self" : "opponent"}`}>
          <div className="opening-duel-portrait">
            <img src={src} style={style} alt={`${color === "black" ? "黑" : "白"}方：${name}`} draggable="false" onError={() => setFailed(true)} />
            <OpeningUsername name={username} />
          </div>
        </div>
      ))}
      <div className="opening-duel-copy" role="status">{children}</div>
    </div>
  );
  return typeof document === "undefined" ? content : createPortal(content, document.body);
}

function OpeningUsername({ name }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  useLayoutEffect(() => {
    let active = true;
    const fit = () => {
      if (!active) return;
      const container = containerRef.current;
      const text = textRef.current;
      text.style.fontSize = "";
      const available = container.clientWidth;
      const natural = text.scrollWidth;
      if (available > 0 && natural > available) {
        text.style.fontSize = `${parseFloat(getComputedStyle(text).fontSize) * (available - 2) / natural}px`;
      }
    };
    fit();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    observer?.observe(containerRef.current);
    document.fonts?.ready.then(fit);
    return () => { active = false; observer?.disconnect(); };
  }, [name]);
  return <div className="opening-duel-username" ref={containerRef}><span ref={textRef}>{name}</span></div>;
}
