import React from "react";
import { createRoot } from "react-dom/client";
import UserIdentity from "/src/shared/UserIdentity.jsx";
import "./generated-imports.css";
import "./preview.css";
import config from "./preview-config.js";

const samples = [
  { label: "合法英文名", username: "Alice_12" },
  { label: "四个中日韩字符", username: "星辉旅者" },
  { label: "历史超长用户名", username: "LegacyUsernameThatNeedsEllipsis" },
  { label: "称号＋独立徽章", username: "Moming", decorated: true }
];

const contexts = [
  { label: "Desktop · 1.0", scale: 1, compact: false },
  { label: "Compact · 0.88", scale: 0.88, compact: true },
  { label: "Phone · 0.78", scale: 0.78, compact: true }
];

function assetUser(sample) {
  return {
    username: sample.username,
    achievementEquipmentAssets: {
      ...(sample.decorated ? {
        title: { name: "角色成就称号", text: "角色成就称号" },
        badge: { name: "独立徽章", text: "徽" }
      } : {}),
      nameplate: {
        id: config.assetId,
        name: "Preview nameplate",
        imageUrl: config.imageUrl
      }
    }
  };
}

function PreviewCell({ sample, context, tone }) {
  return (
    <div className={`nameplate-preview-cell tone-${tone}`}>
      <span className="nameplate-preview-label">{sample.label}</span>
      <div
        className="nameplate-preview-stage"
        style={{ "--user-nameplate-scale": context.scale }}
      >
        <UserIdentity user={assetUser(sample)} compact={context.compact} />
      </div>
    </div>
  );
}

function App() {
  return (
    <main className="nameplate-preview-page">
      <header>
        <p>Asset ID</p>
        <h1>{config.assetId}</h1>
        <code>{config.imageUrl}</code>
      </header>
      {contexts.map((context) => (
        <section key={context.label} className="nameplate-preview-group">
          <h2>{context.label}</h2>
          <div className="nameplate-preview-grid">
            {samples.flatMap((sample) => ["light", "dark"].map((tone) => (
              <PreviewCell key={`${context.label}-${sample.label}-${tone}`} sample={sample} context={context} tone={tone} />
            )))}
          </div>
        </section>
      ))}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
