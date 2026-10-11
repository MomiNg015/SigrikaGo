import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UserRound } from "lucide-react";
import { reconcileSpectatorSeats, spectatorAppearance, spectatorUsers } from "./spectatorPresence.js";
import { placeSpectators, spectatorFreeRects, spectatorHitPolygon } from "./spectatorLayout.js";

export function useSpectatorPresence(room) {
  const users = spectatorUsers(room);
  const idsKey = JSON.stringify(users.map((user) => user.id));
  const [state, setState] = useState(() => reconcileSpectatorSeats(null, room.code, users.map((user) => user.id)));
  useLayoutEffect(() => {
    setState((previous) => reconcileSpectatorSeats(previous, room.code, JSON.parse(idsKey)));
  }, [room.code, idsKey]);
  return users.flatMap((user) => state.roomKey === room.code && state.seats[user.id]
    ? [{ user, ...state.seats[user.id] }] : []);
}

const CONTROL_SURFACES = ".action-bar, .room-direct-actions";
const SOLID_SURFACES = `.room-header, .board-stage, ${CONTROL_SURFACES}, .room-story-log-entry, .replay-controls`;
const OCCUPIED_SURFACES = `.player-info, ${SOLID_SURFACES}`;

export default function SpectatorGallery({ entries, characters, onOpenUser }) {
  const anchorRef = useRef(null);
  const positionsRef = useRef({});
  const gesture = useRef(null);
  const maskId = `spectator-space-${useId().replaceAll(":", "")}`;
  const [layout, setLayout] = useState(null);
  useLayoutEffect(() => {
    const root = anchorRef.current.closest(".room-screen");
    if (!root) return undefined;
    // Keep the layer inside the room scroll owner so dragging/wheeling on a
    // portrait still scrolls short phone screens naturally.
    const host = root;
    let frame = 0;
    const measure = () => {
      const width = window.innerWidth, height = window.innerHeight;
      const rectangles = (selector) => [...root.querySelectorAll(selector)].map((element) => element.getBoundingClientRect())
        .filter((rect) => rect.width && rect.height)
        .map((rect) => ({ x: rect.x - 3, y: rect.y - 3, width: rect.width + 6, height: rect.height + 6 }));
      const blockers = rectangles(OCCUPIED_SURFACES);
      const free = spectatorFreeRects(width, height, blockers);
      // Transparent desktop player columns reserve centers, but their empty
      // pixels must not punch rectangular holes in the spectator artwork.
      const paint = root.matches(".desktop-room-screen:not(.sigrika-candy-duel-room)")
        ? spectatorFreeRects(width, height, rectangles(SOLID_SURFACES)) : free;
      const controls = [...root.querySelectorAll(CONTROL_SURFACES)].map((element) => element.getBoundingClientRect())
        .filter((rect) => rect.width && rect.height)
        .map(({ x, y, width: controlWidth, height: controlHeight }) => ({ x, y, width: controlWidth, height: controlHeight }));
      const key = JSON.stringify([width, height, free, paint]);
      setLayout((previous) => previous?.key === key ? previous : { key, width, height, free, paint, controls, host });
    };
    const schedule = () => {
      if (gesture.current) gesture.current.moved = true;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    root.querySelectorAll(OCCUPIED_SURFACES).forEach((element) => observer.observe(element));
    const mutations = new MutationObserver((records) => {
      if (records.some((record) => !record.target.closest?.(".spectator-gallery"))) schedule();
    });
    mutations.observe(root, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    window.visualViewport?.addEventListener("resize", schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, []);
  const entriesKey = JSON.stringify(entries.map(({ user, slot, seed }) => ({ user: { id: user.id, username: user.username }, slot, seed })));
  const positions = useMemo(() => layout ? placeSpectators(JSON.parse(entriesKey), layout.free, positionsRef.current, layout) : {}, [entriesKey, layout]);
  useLayoutEffect(() => {
    const cache = { ...positionsRef.current };
    for (const entry of entries) {
      for (const id of Object.keys(cache)) {
        if (id !== entry.user.id && cache[id].slot === entry.slot) delete cache[id];
      }
      if (positions[entry.user.id]) cache[entry.user.id] = { ...positions[entry.user.id], slot: entry.slot };
    }
    positionsRef.current = cache;
  });
  const points = Object.values(positions);
  return <>
    <span ref={anchorRef} hidden />
    {layout && createPortal(<section className="spectator-gallery" aria-label={`观战者，共${entries.length}人`} data-spectator-count={entries.length}
      style={{ clipPath: `url(#${maskId})` }}>
      <svg className="spectator-mask" width="0" height="0" aria-hidden="true"><defs>
        <clipPath id={maskId} clipPathUnits="userSpaceOnUse">{layout.paint.map((rect, index) => <rect key={index} {...rect} />)}</clipPath>
      </defs></svg>
      {entries.map(({ user, animate }) => {
        const point = positions[user.id];
        if (!point) return null;
        const { width, height } = point;
        return <div key={user.id} className={`spectator-entry${animate ? " spectator-arriving" : ""}`}>
          <button type="button" className="spectator-hit" data-spectator-id={user.id} data-ui-sound="none"
            data-center-x={point.x} data-center-y={point.y} data-rotation={point.rotation}
            aria-label={`查看${user.username}的详细信息`} title={user.username}
            style={{ "--spectator-hit-area": spectatorHitPolygon(point, points, Math.max(point.art.width, point.name.width), height * 1.4) }}
            onPointerDown={(event) => { gesture.current = { x: event.clientX, y: event.clientY, moved: false }; }}
            onPointerMove={(event) => {
              if (gesture.current && Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y) > 8) gesture.current.moved = true;
            }}
            onClick={(event) => { if (event.detail === 0 || !gesture.current?.moved) onOpenUser(user); }} />
          <div className="spectator-figure" style={{ left: point.x - width / 2, top: point.y - height / 2, width, height, "--spectator-angle": `${point.rotation}deg` }}>
            <SpectatorPortrait user={user} characters={characters} />
            <button type="button" tabIndex={-1} className="spectator-username" data-ui-sound="none"
              style={{ top: point.name.y - point.y + height / 2, left: point.name.x + point.name.width / 2 - point.x + width / 2, "--spectator-name-width": `${point.name.width}px` }}
              onPointerDown={(event) => { gesture.current = { x: event.clientX, y: event.clientY, moved: false }; }}
              onPointerMove={(event) => {
                if (gesture.current && Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y) > 8) gesture.current.moved = true;
              }}
              onClick={(event) => { if (event.detail === 0 || !gesture.current?.moved) onOpenUser(user); }}>{user.username}</button>
          </div>
        </div>;
      })}
    </section>, layout.host)}
  </>;
}

function SpectatorPortrait({ user, characters }) {
  const { src, fallback } = spectatorAppearance(user, characters);
  return <RecoveringPortrait key={`${src}:${fallback}`} src={src} fallback={fallback} />;
}

function RecoveringPortrait({ src, fallback }) {
  const [failed, setFailed] = useState([]);
  const source = [src, fallback].find((candidate) => candidate && !failed.includes(candidate));
  return <span className="spectator-art" aria-hidden="true">
    {source ? <img src={source} alt="" draggable="false" decoding="async" onError={() => setFailed((values) => [...values, source])} /> : <UserRound className="spectator-placeholder" />}
  </span>;
}
