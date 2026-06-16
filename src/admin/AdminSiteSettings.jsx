import { useEffect, useState } from "react";
import { adminApi } from "../api/client.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { AdminFieldLabel, AdminSectionHeader } from "./adminComponents.jsx";

export default function AdminSiteSettings({ token, onSaved, onNotice }) {
  const [draft, setDraft] = useState(DEFAULT_SITE_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi("/site-settings", token)
      .then((data) => setDraft({ ...DEFAULT_SITE_SETTINGS, ...(data.settings ?? {}) }))
      .catch((error) => onNotice?.(error.message, "danger"));
  }, [token, onNotice]);

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await adminApi("/site-settings", token, {
        method: "PATCH",
        body: draft
      });
      setDraft({ ...DEFAULT_SITE_SETTINGS, ...(data.settings ?? {}) });
      onSaved?.(data.settings);
      onNotice?.("已保存", "success");
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-list-section">
      <AdminSectionHeader title="大厅文案" meta="修改大厅标题、副标题、关于文本和页脚信息" />
      <form className="admin-form admin-settings-form" onSubmit={saveSettings}>
        <label>
          <AdminFieldLabel text="大厅标题" tip="显示在大厅顶部的主标题。" />
          <input
            maxLength={24}
            value={draft.homeTitle}
            onChange={(event) => setDraft((current) => ({ ...current, homeTitle: event.target.value }))}
          />
        </label>
        <label>
          <AdminFieldLabel text="大厅副标题" tip="显示在大厅标题上方的小字，可用于服务器名称或活动文案。" />
          <textarea
            maxLength={80}
            rows={3}
            value={draft.homeSubtitle}
            onChange={(event) => setDraft((current) => ({ ...current, homeSubtitle: event.target.value }))}
          />
        </label>
        <label>
          <AdminFieldLabel text="关于文本" tip="显示在玩家设置弹窗的关于页，可填写较长说明。" />
          <textarea
            maxLength={3000}
            rows={8}
            value={draft.aboutText}
            onChange={(event) => setDraft((current) => ({ ...current, aboutText: event.target.value }))}
          />
        </label>
        <label>
          <AdminFieldLabel text="页脚信息" tip="显示在大厅右下角页脚。支持 Markdown 链接格式：[文字](https://example.com)。" />
          <textarea
            maxLength={3000}
            rows={6}
            value={draft.footerText}
            onChange={(event) => setDraft((current) => ({ ...current, footerText: event.target.value }))}
          />
        </label>
        <div className="inline-actions">
          <button className="primary-action" type="submit" disabled={saving}>{saving ? "保存中" : "保存"}</button>
        </div>
      </form>
    </section>
  );
}
