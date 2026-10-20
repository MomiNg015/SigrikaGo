import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bell, Megaphone, Pause, Play, Radio } from "lucide-react";
import HomeHeader from "../../../src/home/components/HomeHeader.jsx";
import { LONG_NOTICE } from "./samples.js";
import "../../../src/styles.css";
import "./frame.css";

const variants = { mint: { label: "校园播报", Icon: Bell }, ribbon: { label: "特别公告", Icon: Megaphone }, ink: { label: "维护通知", Icon: Radio } };
const requestedVariant = new URLSearchParams(location.search).get("variant");
const variant = Object.hasOwn(variants, requestedVariant) ? requestedVariant : "mint";

function Announcement({ text }) {
  const windowRef = useRef(null);
  const textRef = useRef(null);
  const [metrics, setMetrics] = useState({ overflow: false, distance: 0 });
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const { Icon, label } = variants[variant];

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useLayoutEffect(() => {
    const viewport = windowRef.current;
    const original = textRef.current;
    const measure = () => setMetrics({ overflow: original.getBoundingClientRect().width > viewport.clientWidth + 1, distance: original.getBoundingClientRect().width + 64 });
    const observer = new ResizeObserver(measure);
    observer.observe(viewport); observer.observe(original);
    measure();
    return () => observer.disconnect();
  }, [text]);

  const scrolling = metrics.overflow && !reduced;
  return (
    <section className={`announcement announcement--${variant}`} aria-label="顶部公告" data-overflow={metrics.overflow} data-reduced={reduced} data-paused={paused}>
      <div className="announcement-inner">
        <span className="announcement-label"><Icon size={15} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span></span>
        {/* A scrollable region needs a keyboard stop for native arrow-key scrolling in reduced-motion mode. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div className="announcement-window" ref={windowRef} role="region" tabIndex={metrics.overflow ? 0 : undefined} aria-label="公告内容">
          <p className="announcement-accessible" role="status">{text}</p>
          <div className={`announcement-track${scrolling ? " is-scrolling" : ""}`} aria-hidden="true" style={{ "--travel": `${-metrics.distance}px`, "--duration": `${metrics.distance / 36}s` }}>
            <span ref={textRef}>{text}</span>{scrolling && <span>{text}</span>}
          </div>
        </div>
        {scrolling && <button className="announcement-pause" type="button" aria-label={paused ? "继续滚动公告" : "暂停滚动公告"} aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? <Play size={13} fill="currentColor" /> : <Pause size={13} fill="currentColor" />}</button>}
      </div>
    </section>
  );
}

function Preview() {
  const [settings, setSettings] = useState({ enabled: true, text: LONG_NOTICE });
  useEffect(() => {
    const receive = (event) => {
      if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== "announcement-preview") return;
      setSettings({ enabled: event.data.enabled === true, text: String(event.data.text ?? "").replace(/\s+/gu, " ").trim().slice(0, 500) });
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "announcement-ready" }, location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);
  return <div className="announcement-demo">
    {settings.enabled && settings.text && <Announcement key={settings.text} text={settings.text} />}
    <div className="app-shell player-theme-enabled theme-bright-school announcement-context">
      <main className="home-screen home-terminal-screen">
        <HomeHeader siteTitle="星炬学院围棋部" siteVersion="v0.1.0" mailboxBadgeCount={2} />
        <div className="announcement-classroom" aria-hidden="true" />
      </main>
    </div>
  </div>;
}
createRoot(document.getElementById("root")).render(<Preview />);
