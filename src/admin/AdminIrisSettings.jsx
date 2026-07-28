import { useEffect, useRef, useState } from "react";
import { adminApi } from "../api/client.js";
import {
  MAX_IRIS_GREETING_LENGTH,
  normalizeIrisGreeting
} from "../shared/irisGreeting.js";
import {
  irisLinksFromSettings,
  irisLinksSettingJson,
  MAX_IRIS_LINKS
} from "../shared/irisLinks.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { AdminActionButton, AdminFieldLabel, AdminSectionHeader } from "./adminComponents.jsx";

export default function AdminIrisSettings({ token, onSaved, onNotice }) {
  const [greeting, setGreeting] = useState(() => normalizeIrisGreeting(DEFAULT_SITE_SETTINGS.irisGreeting));
  const [links, setLinks] = useState(() => irisLinksFromSettings(DEFAULT_SITE_SETTINGS));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const onNoticeRef = useRef(onNotice);

  useEffect(() => {
    onNoticeRef.current = onNotice;
  }, [onNotice]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi("/site-settings", token)
      .then((data) => {
        if (!cancelled) {
          setGreeting(normalizeIrisGreeting(data.settings?.irisGreeting));
          setLinks(irisLinksFromSettings(data.settings));
        }
      })
      .catch((error) => {
        if (!cancelled) onNoticeRef.current?.(error.message, "danger");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function saveIrisSettings(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await adminApi("/site-settings", token, {
        method: "PATCH",
        body: {
          irisGreeting: normalizeIrisGreeting(greeting),
          irisLinks: irisLinksSettingJson(links)
        }
      });
      setGreeting(normalizeIrisGreeting(data.settings?.irisGreeting));
      const savedLinks = irisLinksFromSettings(data.settings);
      setLinks(savedLinks);
      onSaved?.(data.settings);
      onNotice?.("IRIS 资料链接已保存", "success");
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-list-section">
      <AdminSectionHeader title="IRIS 管理" meta="维护 IRIS 看板娘问候语与围棋资料链接" />
      {loading ? (
        <p className="quiet-text" role="status">正在加载 IRIS 资料…</p>
      ) : (
        <form className="admin-form admin-settings-form" onSubmit={saveIrisSettings}>
          <fieldset className="admin-settings-fieldset">
            <legend>看板娘问候语</legend>
            <label>
              <AdminFieldLabel
                text="问候语"
                tip="显示在数据库窗口左侧立绘区顶部；留空时恢复默认问候语。"
              />
              <input
                maxLength={MAX_IRIS_GREETING_LENGTH}
                value={greeting}
                onChange={(event) => setGreeting(event.target.value)}
              />
            </label>
          </fieldset>
          <IrisLinksEditor value={links} onChange={setLinks} />
          <div className="inline-actions">
            <AdminActionButton variant="primary" type="submit" disabled={saving}>
              {saving ? "保存中" : "保存 IRIS 资料"}
            </AdminActionButton>
          </div>
        </form>
      )}
    </section>
  );
}

export function IrisLinksEditor({ value = [], onChange }) {
  const links = Array.isArray(value) ? value : irisLinksFromSettings({ irisLinks: value });

  function updateLink(index, key, nextValue) {
    onChange(links.map((link, currentIndex) => (
      currentIndex === index ? { ...link, [key]: nextValue } : link
    )));
  }

  return (
    <fieldset className="admin-settings-fieldset">
      <legend>友情链接</legend>
      {links.map((link, index) => (
        <div className="admin-settings-grid" key={index}>
          <label>
            <AdminFieldLabel text={`条目 ${index + 1} 名称`} tip="显示在 IRIS 资料列表中的主标题。" />
            <input
              maxLength={80}
              required
              value={link.title}
              onChange={(event) => updateLink(index, "title", event.target.value)}
            />
          </label>
          <label>
            <AdminFieldLabel text="说明" tip="显示在名称下方的简短资料分类。" />
            <input
              maxLength={120}
              value={link.description}
              onChange={(event) => updateLink(index, "description", event.target.value)}
            />
          </label>
          <label>
            <AdminFieldLabel text="链接地址" tip="只允许 http:// 或 https:// 链接。" />
            <input
              maxLength={500}
              required
              type="url"
              value={link.href}
              onChange={(event) => updateLink(index, "href", event.target.value)}
            />
          </label>
          <div className="inline-actions">
            <AdminActionButton
              variant="danger"
              type="button"
              onClick={() => onChange(links.filter((_, currentIndex) => currentIndex !== index))}
            >
              删除条目
            </AdminActionButton>
          </div>
        </div>
      ))}
      <div className="inline-actions">
        <AdminActionButton
          variant="secondary"
          type="button"
          disabled={links.length >= MAX_IRIS_LINKS}
          onClick={() => onChange([...links, { title: "", description: "", href: "" }])}
        >
          添加资料链接
        </AdminActionButton>
      </div>
    </fieldset>
  );
}
