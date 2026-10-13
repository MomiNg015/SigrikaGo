import { useState } from "react";
import { createRoot } from "react-dom/client";
import WatchModal from "../../../src/modals/WatchModal.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";
import { rooms } from "../watch-mobile-2026-10-13/fixtures.js";
import "../../../src/styles.css";
import "./sample.css";

const requested = new URLSearchParams(location.search).get("style");
const style = ["marker", "tape", "scoresheet"].includes(requested) ? requested : "marker";
const originalFetch = window.fetch;
window.fetch = async (url, options) => {
  if (typeof url !== "string" || !url.startsWith("/api/")) return originalFetch(url, options);
  if (url !== "/api/rooms/watch?mode=all" || options?.headers?.Authorization !== "Bearer watch-header-preview") throw new Error("Unexpected preview request");
  return Response.json({ rooms });
};
function Preview() {
  const [open, setOpen] = useState(true);
  return <div className="app-shell player-theme-enabled theme-bright-school wh-preview" data-header-style={style}>
    {open ? <WatchModal token="watch-header-preview" characters={CHARACTERS} onJoinRoom={() => {}} onClose={() => setOpen(false)}/> : <button onClick={() => setOpen(true)}>打开观战窗口</button>}
  </div>;
}
createRoot(document.getElementById("root")).render(<Preview/>);
