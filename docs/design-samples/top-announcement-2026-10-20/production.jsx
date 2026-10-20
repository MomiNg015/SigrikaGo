import { useState } from "react";
import { createRoot } from "react-dom/client";
import HomeScreen from "../../../src/home/HomeScreen.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";
import { DEFAULT_SITE_SETTINGS } from "../../../src/shared/siteSettings.js";
import { LONG_NOTICE, SHORT_NOTICE } from "./samples.js";
import "../../../src/styles.css";

function Preview() {
  const [enabled, setEnabled] = useState(true);
  const [text, setText] = useState(LONG_NOTICE);
  return <div className="app-shell player-theme-enabled theme-bright-school">
    <HomeScreen user={{ username: "公告预览", role: "player", selectedCharacter: "sigrika", ownedCharacters: ["sigrika"], rank: "初段", rating: 1000 }} characters={CHARACTERS} siteSettings={{ ...DEFAULT_SITE_SETTINGS, topAnnouncementEnabled: enabled, topAnnouncementText: text }} />
    <div style={{ position: "fixed", bottom: 12, right: 12, zIndex: 20, display: "flex", gap: 8 }}>
      <button type="button" onClick={() => setEnabled((value) => !value)}>{enabled ? "关闭播报" : "开启播报"}</button>
      <button type="button" onClick={() => setText((value) => value === LONG_NOTICE ? SHORT_NOTICE : LONG_NOTICE)}>切换长短文案</button>
    </div>
  </div>;
}
createRoot(document.getElementById("root")).render(<Preview />);
