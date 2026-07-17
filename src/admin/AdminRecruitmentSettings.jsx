import { useEffect, useState } from "react";
import { adminApi } from "../api/client.js";
import {
  DEFAULT_RECRUITMENT_CONFIG,
  probabilityRecruitmentItems
} from "../shared/recruitment.js";
import { AdminActionButton } from "./adminComponents.jsx";

const CHARACTER_IDS = ["lynae", "mornye", "chisa", "qiuyuan", "changli"];

export default function AdminRecruitmentSettings({ token, onNotice }) {
  const [draft, setDraft] = useState(() => configToDraft(DEFAULT_RECRUITMENT_CONFIG));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi("/recruitment-config", token)
      .then((data) => setDraft(configToDraft(data.config ?? DEFAULT_RECRUITMENT_CONFIG)))
      .catch((error) => onNotice?.(error.message, "danger"));
  }, [token]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await adminApi("/recruitment-config", token, {
        method: "PATCH",
        body: draftToConfig(draft)
      });
      onNotice?.("招募配置已保存", "success");
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-list-section admin-recruitment-settings">
      <div className="admin-section-heading">
        <div>
          <h2>招募配置</h2>
          <p className="quiet-text">候选池第一版固定在代码里，这里只配置等待时间、概率和回应文案。</p>
        </div>
      </div>
      <form className="admin-character-form" onSubmit={save}>
        <label>
          等待时间（秒）
          <input value={draft.durationSeconds} onChange={(event) => setDraft({ ...draft, durationSeconds: event.target.value })} />
        </label>
        <div className="admin-inline-grid">
          {[0, 1, 2].map((index) => (
            <label key={index}>
              {index + 1}档成功率（%）
              <input value={draft.successRates[index]} onChange={(event) => setRateDraft(setDraft, index, event.target.value)} />
            </label>
          ))}
        </div>
        <label>
          回应把握文案（三行）
          <textarea value={draft.confidenceTexts} onChange={(event) => setDraft({ ...draft, confidenceTexts: event.target.value })} rows={4} />
        </label>
        {probabilityRecruitmentItems().map((item) => (
          <label key={item.itemType}>
            {item.name} 未回应文案（每行一条）
            <textarea
              value={draft.noResponseTexts[item.itemType] ?? ""}
              onChange={(event) => setDraft({
                ...draft,
                noResponseTexts: { ...draft.noResponseTexts, [item.itemType]: event.target.value }
              })}
              rows={3}
            />
          </label>
        ))}
        {CHARACTER_IDS.map((characterId) => (
          <label key={characterId}>
            {characterId} 成功文案
            <textarea
              value={draft.successTexts[characterId] ?? ""}
              onChange={(event) => setDraft({
                ...draft,
                successTexts: { ...draft.successTexts, [characterId]: event.target.value }
              })}
              rows={2}
            />
          </label>
        ))}
        <AdminActionButton variant="primary" type="submit" disabled={saving}>{saving ? "保存中" : "保存招募配置"}</AdminActionButton>
      </form>
    </section>
  );
}

function configToDraft(config) {
  return {
    durationSeconds: String(Math.round(Number(config.durationMs ?? DEFAULT_RECRUITMENT_CONFIG.durationMs) / 1000)),
    successRates: (config.successRates ?? DEFAULT_RECRUITMENT_CONFIG.successRates).map(String),
    confidenceTexts: (config.confidenceTexts ?? DEFAULT_RECRUITMENT_CONFIG.confidenceTexts).join("\n"),
    noResponseTexts: Object.fromEntries(probabilityRecruitmentItems().map((item) => [
      item.itemType,
      (config.noResponseTexts?.[item.itemType] ?? DEFAULT_RECRUITMENT_CONFIG.noResponseTexts[item.itemType]).join("\n")
    ])),
    successTexts: { ...DEFAULT_RECRUITMENT_CONFIG.successTexts, ...(config.successTexts ?? {}) }
  };
}

function draftToConfig(draft) {
  return {
    durationMs: Math.max(30, Number(draft.durationSeconds) || 300) * 1000,
    successRates: draft.successRates.map((rate) => Number(rate) || 0),
    confidenceTexts: lines(draft.confidenceTexts),
    noResponseTexts: Object.fromEntries(Object.entries(draft.noResponseTexts).map(([itemType, text]) => [itemType, lines(text)])),
    successTexts: draft.successTexts
  };
}

function setRateDraft(setDraft, index, value) {
  setDraft((current) => {
    const successRates = [...current.successRates];
    successRates[index] = value;
    return { ...current, successRates };
  });
}

function lines(value) {
  return String(value ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
}
