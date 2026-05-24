import { useState } from "react";
import { Bell, Info, Mic2, Music, Volume2, X } from "lucide-react";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";

export default function SettingsModal({ siteSettings = DEFAULT_SITE_SETTINGS, audioSettings, setAudioSettings, onClose }) {
  const [tab, setTab] = useState("audio");
  const audioItems = [
    { key: "master", label: "主音量", icon: <Volume2 size={18} /> },
    { key: "bgm", label: "背景音乐", icon: <Music size={18} /> },
    { key: "sfx", label: "提示声", icon: <Bell size={18} /> },
    { key: "voice", label: "语音", icon: <Mic2 size={18} /> }
  ];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="settings-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <h2>设置</h2>
        <div className="settings-tabs" role="tablist">
          <button className={tab === "audio" ? "active" : ""} onClick={() => setTab("audio")}><Volume2 size={16} />音频</button>
          <button className={tab === "about" ? "active" : ""} onClick={() => setTab("about")}><Info size={16} />关于</button>
        </div>
        {tab === "audio" && (
          <div className="settings-panel">
            {audioItems.map((item) => (
              <label className="volume-row" key={item.key}>
                <span>{item.icon}{item.label}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioSettings[item.key]}
                  onChange={(event) => setAudioSettings((settings) => ({
                    ...settings,
                    [item.key]: Number(event.target.value)
                  }))}
                />
                <strong>{audioSettings[item.key]}</strong>
              </label>
            ))}
          </div>
        )}
        {tab === "about" && (
          <div className="settings-panel about-panel">
            <p>{siteSettings.aboutText}</p>
          </div>
        )}
      </section>
    </div>
  );
}
