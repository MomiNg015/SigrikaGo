import { useState } from "react";
import { Bell, Info, Mic2, Music, Palette, Volume2, X } from "lucide-react";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { DEFAULT_VISUAL_THEME, VISUAL_THEME_OPTIONS } from "../app/visualTheme.js";

export default function SettingsModal({
  siteSettings = DEFAULT_SITE_SETTINGS,
  audioSettings,
  setAudioSettings,
  visualTheme = DEFAULT_VISUAL_THEME,
  setVisualTheme = () => {},
  onNotice = () => {},
  onClose
}) {
  const [tab, setTab] = useState("audio");
  const audioItems = [
    { key: "master", label: "\u4e3b\u97f3\u91cf", icon: <Volume2 size={18} /> },
    { key: "bgm", label: "\u80cc\u666f\u97f3\u4e50", icon: <Music size={18} /> },
    { key: "sfx", label: "\u63d0\u793a\u58f0", icon: <Bell size={18} /> },
    { key: "voice", label: "\u8bed\u97f3", icon: <Mic2 size={18} /> }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className={`settings-modal settings-modal-content settings-tab-${tab}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <h2>{"\u8bbe\u7f6e"}</h2>
        <div className="settings-tabs" role="tablist">
          <button className={tab === "audio" ? "active" : ""} onClick={() => setTab("audio")}><Volume2 size={16} />{"\u97f3\u9891"}</button>
          <button className={tab === "theme" ? "active" : ""} onClick={() => setTab("theme")}><Palette size={16} />{"\u754c\u9762"}</button>
          <button className={tab === "about" ? "active" : ""} onClick={() => setTab("about")}><Info size={16} />{"\u5173\u4e8e"}</button>
        </div>
        {tab === "audio" && (
          <div className="settings-panel settings-modal-content">
            {audioItems.map((item) => {
              const muted = audioSettings?.muted?.[item.key] === true;
              const labelId = `audio-volume-label-${item.key}`;

              return (
                <div className={`volume-row audio-slider-item ${muted ? "is-muted" : ""}`} key={item.key}>
                  <button
                    type="button"
                    id={labelId}
                    className="audio-volume-title"
                    aria-pressed={muted}
                    onClick={() => setAudioSettings((settings) => ({
                      ...settings,
                      muted: {
                        ...(settings.muted ?? {}),
                        [item.key]: !(settings.muted?.[item.key] === true)
                      }
                    }))}
                  >
                    {item.icon}{item.label}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    aria-labelledby={labelId}
                    value={audioSettings[item.key]}
                    onChange={(event) => setAudioSettings((settings) => ({
                      ...settings,
                      [item.key]: Number(event.target.value),
                      muted: {
                        ...(settings.muted ?? {}),
                        [item.key]: false
                      }
                    }))}
                  />
                  <strong>{audioSettings[item.key]}</strong>
                </div>
              );
            })}
          </div>
        )}
        {tab === "theme" && (
          <div className="settings-panel settings-modal-content theme-settings-panel">
            <div className="theme-choice-grid" aria-label={"\u754c\u9762\u4e3b\u9898"}>
              {VISUAL_THEME_OPTIONS.map((theme) => {
                const active = theme.available && visualTheme === theme.id;

                return (
                  <button
                    type="button"
                    key={theme.id}
                    className={[
                      "theme-choice-button",
                      active ? "active" : "",
                      theme.available ? "" : "is-future"
                    ].filter(Boolean).join(" ")}
                    aria-pressed={active}
                    onClick={() => {
                      if (theme.available) {
                        setVisualTheme(theme.id);
                        return;
                      }
                      onNotice("\u656c\u8bf7\u671f\u5f85~", "success");
                    }}
                  >
                    <strong>{theme.label}</strong>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {tab === "about" && (
          <div className="settings-panel about-panel about-panel-block">
            <p>{siteSettings.aboutText}</p>
          </div>
        )}
      </section>
    </div>
  );
}
