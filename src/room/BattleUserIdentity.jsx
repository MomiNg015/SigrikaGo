import { useLayoutEffect, useRef } from "react";
import UserIdentity from "../shared/UserIdentity.jsx";

// Keep the complete plain battle identity inside its mobile slot.
export default function BattleUserIdentity({ user }) {
  const slotRef = useRef(null);
  useLayoutEffect(() => {
    const slot = slotRef.current;
    const content = slot.firstElementChild;
    const media = window.matchMedia("(max-width: 900px) and (orientation: portrait), (pointer: coarse) and (orientation: portrait)");
    let disposed = false;
    const fit = () => {
      if (disposed) return;
      const name = content.querySelector(".user-identity-name");
      name?.style.removeProperty("font-size");
      if (!media.matches || !slot.closest(".mobile-room-screen:not(.sigrika-candy-duel-room)")) {
        slot.style.removeProperty("--battle-name-scale");
        return;
      }
      const scale = Math.min(1, slot.clientWidth / Math.max(1, content.offsetWidth), slot.clientHeight / Math.max(1, content.offsetHeight));
      slot.style.setProperty("--battle-name-scale", String(scale));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(slot);
    observer.observe(content);
    media.addEventListener("change", fit);
    document.fonts?.ready.then(fit);
    fit();
    return () => { disposed = true; observer.disconnect(); media.removeEventListener("change", fit); };
  }, [user]);
  return <span className="battle-name-fit" ref={slotRef}><span className="battle-name-content"><UserIdentity user={user} compact showNameplate={false} /></span></span>;
}
