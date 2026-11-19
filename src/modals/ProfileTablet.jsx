import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Power } from "lucide-react";
import { playUiResumeOpenSound } from "../audio/effectPlayback.js";
import { loadAudioSettings } from "../audio/audioSettings.js";
import { ModalDialog } from "./modalComponents.jsx";
import { PaginatedReplayList } from "./ReplayList.jsx";

const LOAD_DURATION = 1500;
const SWING_DURATION = 410;

export default function ProfileTablet({
  className, title, titleId, closeLabel, onClose, actions, children, overlays,
  replay, onCloseReplay, studentEntry = false
}) {
  const shellRef = useRef(null);
  const returnsToProfile = useRef(false);
  const backRef = useRef(null);
  const profileRef = useRef(null);
  const [phase, setPhase] = useState("off");
  const showingReplay = Boolean(replay);

  useLayoutEffect(() => {
    const shell = shellRef.current?.parentElement;
    if (!shell || typeof shell.animate !== "function" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const portrait = studentEntry && document.querySelector(".home-student-id-portrait");
    const trigger = portrait || (document.activeElement?.closest("button, a"));
    const target = shell.getBoundingClientRect();
    const origin = trigger?.getBoundingClientRect();
    const x = origin ? origin.left + origin.width / 2 - target.left - target.width / 2 : 0;
    const y = origin ? origin.top + origin.height / 2 - target.top - target.height / 2 : 28;
    const motion = shell.animate([
      { transform: `translate(${x}px, ${y}px) rotate(-24deg) scale(.16)`, opacity: .35 },
      { transform: "none", opacity: 1 }
    ], { duration: SWING_DURATION, easing: "cubic-bezier(.19,.88,.27,1)" });
    return () => motion.cancel();
  }, [studentEntry]);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let revealTimer;
    const bootTimer = window.setTimeout(() => {
      setPhase("loading");
      playUiResumeOpenSound(loadAudioSettings());
      revealTimer = window.setTimeout(() => setPhase("ready"), LOAD_DURATION);
    }, reduced ? 80 : SWING_DURATION + 105);
    return () => {
      window.clearTimeout(bootTimer);
      window.clearTimeout(revealTimer);
    };
  }, []);

  useLayoutEffect(() => {
    if (showingReplay) {
      returnsToProfile.current = true;
      backRef.current?.focus();
    } else if (returnsToProfile.current) {
      profileRef.current?.querySelector(".profile-replay-button")?.focus({ preventScroll: true });
    }
  }, [showingReplay]);

  return (
    <ModalDialog
      className={`profile-tablet ${className}`}
      ariaLabel={title}
      onClose={showingReplay ? onCloseReplay : onClose}
      onClick={(event) => event.stopPropagation()}
    >
      <header className="profile-tablet-hardware" ref={shellRef} data-phase={phase}>
        <span className="profile-tablet-led" aria-hidden="true" />
        <span aria-hidden="true">IRIS / EDU–01</span>
        <div className="profile-tablet-tools">
          {actions}
          <button data-button-role="secondary" type="button" className="profile-tablet-power" onClick={onClose} aria-label={closeLabel}>
            <Power size={20} aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="profile-tablet-glass" data-phase={phase} style={{ "--profile-tablet-load-time": `${LOAD_DURATION}ms` }}>
        <div className="profile-tablet-boot" hidden={phase !== "loading"} role="status">
          <span>正在读取{title}…</span>
          <div className="profile-tablet-track" aria-hidden="true"><div /></div>
        </div>
        <div className="profile-tablet-interface" inert={phase !== "ready"}>
          <header className="profile-tablet-screen-header">
            <h2 id={titleId}>{showingReplay ? "对局回放" : title}</h2>
            {showingReplay && <button ref={backRef} className="profile-tablet-back" type="button" onClick={onCloseReplay} aria-label="关闭对局回放" title={`返回${title}`}>
              <ArrowLeft size={18} aria-hidden="true" />
            </button>}
          </header>
          <div className="profile-tablet-page" ref={profileRef} hidden={showingReplay}>
            {children}
          </div>
          {showingReplay && (
            <div className="profile-tablet-page profile-tablet-replays" onScroll={replay.pagination.onScroll}>
              <PaginatedReplayList {...replay} />
            </div>
          )}
        </div>
      </div>
      <footer className="profile-tablet-hardware profile-tablet-bottom" aria-hidden="true">IRIS SYSTEMS</footer>
      {overlays}
    </ModalDialog>
  );
}
