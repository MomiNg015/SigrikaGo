import { useEffect, useState } from "react";

export const MOBILE_ROOM_MEDIA_QUERY = "(max-width: 900px), (pointer: coarse)";

export function DesktopRoomLayout({ children }) {
  return <main className="room-screen desktop-room-screen">{children}</main>;
}

export function MobileRoomLayout({ children }) {
  return <main className="room-screen mobile-room-screen">{children}</main>;
}

export function useMobileRoomLayout() {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(MOBILE_ROOM_MEDIA_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia(MOBILE_ROOM_MEDIA_QUERY);
    const update = () => setMatches(media.matches);
    update();
    if (typeof media.addEventListener === "function") media.addEventListener("change", update);
    else media.addListener?.(update);
    return () => {
      if (typeof media.removeEventListener === "function") media.removeEventListener("change", update);
      else media.removeListener?.(update);
    };
  }, []);

  return matches;
}
