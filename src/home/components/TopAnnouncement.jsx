import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { normalizeTopAnnouncementText } from "../../shared/topAnnouncement.js";

export default function TopAnnouncement({ enabled = false, text = "" }) {
  const message = normalizeTopAnnouncementText(text);
  return enabled === true && message ? <AnnouncementLine key={message} message={message} /> : null;
}

function AnnouncementLine({ message }) {
  const viewportRef = useRef(null);
  const textRef = useRef(null);
  const [metrics, setMetrics] = useState({ overflow: false, distance: 0 });
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const original = textRef.current;
    const measure = () => {
      const width = original.getBoundingClientRect().width;
      const next = { overflow: width > viewport.clientWidth + 1, distance: width + 64 };
      setMetrics((current) => current.overflow === next.overflow && current.distance === next.distance ? current : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(original);
    measure();
    return () => observer.disconnect();
  }, []);

  const scrolling = metrics.overflow && !reduced;
  return (
    <section className="campus-broadcast" aria-label="校园播报" data-overflow={metrics.overflow} data-reduced={reduced} data-paused={paused}>
      <div className="campus-broadcast-inner">
        <span className="campus-broadcast-label">校园播报</span>
        {/* Native horizontal reading requires a keyboard stop when reduced motion is enabled. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div className="campus-broadcast-window" role="region" aria-label="公告内容" ref={viewportRef} tabIndex={metrics.overflow ? 0 : undefined}>
          <p className="campus-broadcast-accessible" role="status">{message}</p>
          <div className={`campus-broadcast-track${scrolling ? " is-scrolling" : ""}`} aria-hidden="true" style={{ "--broadcast-travel": `${-metrics.distance}px`, "--broadcast-duration": `${metrics.distance / 36}s` }}>
            <span ref={textRef}>{message}</span>{scrolling && <span>{message}</span>}
          </div>
        </div>
        {scrolling && <button className="campus-broadcast-pause" type="button" data-ui-sound="none" aria-label={paused ? "继续滚动公告" : "暂停滚动公告"} aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? <Play size={13} fill="currentColor" /> : <Pause size={13} fill="currentColor" />}</button>}
      </div>
    </section>
  );
}
