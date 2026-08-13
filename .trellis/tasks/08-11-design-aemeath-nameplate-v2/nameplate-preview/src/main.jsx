import React from "react";
import { createRoot } from "react-dom/client";
import PlayerPlaque from "/@fs/C:/codex/SigrikaGo/src/home/components/PlayerPlaque.jsx";
import { CHARACTERS } from "/@fs/C:/codex/SigrikaGo/src/shared/characters.js";
import UserIdentity from "/@fs/C:/codex/SigrikaGo/src/shared/UserIdentity.jsx";
import "./generated-imports.css";
import "./preview.css";
import config from "./preview-config.js";

const samples = [
  { label: "八字符英文名", username: "Alice_12" },
  { label: "四个中日韩字符", username: "星辉旅者" }
];

const contexts = [
  { label: "Desktop · 1.0", scale: 1, compact: false },
  { label: "Compact · 0.88", scale: 0.88, compact: true },
  { label: "Phone · 0.78", scale: 0.78, compact: true }
];

function assetUser(sample, asset) {
  return {
    username: sample.username,
    rank: "3段",
    itemEffects: {},
    characterChains: {},
    achievementEquipmentAssets: {
      nameplate: {
        id: asset.assetId,
        name: "Preview nameplate",
        imageUrl: asset.imageUrl
      }
    }
  };
}

function RealHomePreview({ asset }) {
  return (
    <section className="nameplate-real-home" data-preview-context="Real home PlayerPlaque">
      <h2>真实首页学生证 · 1.12</h2>
      {samples.map((sample) => (
        <PlayerPlaque
          key={sample.username}
          character={CHARACTERS.aemeath}
          user={assetUser(sample, asset)}
          onOpenResume={() => {}}
        />
      ))}
    </section>
  );
}

function PreviewCell({ asset, sample, context, tone }) {
  return (
    <div className={`nameplate-preview-cell tone-${tone}`} data-preview-asset={asset.assetId}>
      <span className="nameplate-preview-label">{asset.label} · {sample.label}</span>
      <div className="home-player-plaque tactical-id-card">
        <div
          className="nameplate-preview-stage"
          style={{ "--preview-nameplate-scale": context.scale }}
        >
          <UserIdentity user={assetUser(sample, asset)} compact={context.compact} />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="app-shell player-theme-enabled theme-bright-school nameplate-preview-app">
      <main className="nameplate-preview-page">
        <header>
          <p>Bright School · real UserIdentity</p>
          <h1>三款角色铭牌用户名与高度对比</h1>
          <code>Sigrika / Danya / Aemeath · shared 150 × 32 final owner</code>
        </header>
        <RealHomePreview asset={config.assets.find((asset) => asset.assetId.includes("aemeath"))} />
        {contexts.map((context) => (
          <section key={context.label} className="nameplate-preview-group" data-preview-context={context.label}>
            <h2>{context.label}</h2>
            <div className="nameplate-preview-grid">
              {config.assets.flatMap((asset) => samples.map((sample, index) => (
                <PreviewCell
                  key={`${context.label}-${asset.assetId}-${sample.label}`}
                  asset={asset}
                  sample={sample}
                  context={context}
                  tone={index === 0 ? "light" : "dark"}
                />
              )))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
