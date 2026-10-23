import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import "../../../src/styles.css";
import { useModalScrollLock } from "../../../src/app/useModalScrollLock.js";
import SettingsModal from "../../../src/modals/SettingsModal.jsx";
import { ConfirmModal } from "../../../src/modals/FeedbackModals.jsx";
import LeaderboardModal from "../../../src/modals/LeaderboardModal.jsx";

function Fixture() {
  const leaderboard = new URLSearchParams(location.search).get("surface") === "leaderboard";
  const rootRef = useRef(null);
  useModalScrollLock(rootRef);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [audio, setAudio] = useState({ master: 60, bgm: 60, sfx: 60, voice: 60 });
  return <div ref={rootRef} className="app-shell player-theme-enabled theme-bright-school">
    <main className="home-screen" style={{ height: "100dvh", overflowY: "auto", display: "block" }}>
      <div style={{ height: 1800, paddingTop: 220 }}>
        <button type="button" onClick={() => setOpen(true)}>打开测试窗口</button>
        <p>可滚动的背景主界面</p>
      </div>
      {open && !leaderboard && <>
        <SettingsModal audioSettings={audio} setAudioSettings={setAudio}
          siteSettings={{ aboutText: "窗口内部的长说明文字，滚动到边界仍不能带动背景。".repeat(120) }}
          onClose={() => setConfirm(true)} />
        {confirm && createPortal(<ConfirmModal title="关闭窗口？" message="这是独立挂载的第二层窗口。"
          confirmText="全部关闭" onConfirm={() => { setConfirm(false); setOpen(false); }}
          onCancel={() => setConfirm(false)} />, rootRef.current)}
      </>}
    </main>
    {open && leaderboard && <LeaderboardModal token="scroll-fixture" user={{ id: "player-8" }} characters={{}} onClose={() => setOpen(false)} />}
  </div>;
}

createRoot(document.getElementById("root")).render(<Fixture />);
