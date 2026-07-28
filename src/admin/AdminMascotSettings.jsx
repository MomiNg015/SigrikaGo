import { useEffect, useRef, useState } from "react";
import { adminApi } from "../api/client.js";
import {
  irisGreetingsFromSettings,
  irisGreetingsSettingJson,
  MAX_IRIS_GREETING_LENGTH,
  MAX_IRIS_GREETING_POOL_SIZE
} from "../shared/irisGreeting.js";
import {
  irisLinksFromSettings,
  irisLinksSettingJson,
  MAX_IRIS_LINKS
} from "../shared/irisLinks.js";
import {
  MAX_MASCOT_DIALOGUE_LENGTH,
  MAX_MASCOT_DIALOGUE_POOL_SIZE,
  shopMascotDialoguesFromSettings,
  shopMascotDialoguesSettingJson
} from "../shared/shopMascotDialogues.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { AdminActionButton, AdminFieldLabel, AdminSectionHeader } from "./adminComponents.jsx";

const MASCOT_SECTIONS = [
  {
    id: "zahira",
    title: "扎希拉 · 扎希拉商铺",
    description: "管理进入商店、刷新商品和目录状态变化时显示的台词。",
    fixedFields: [
      ["loadingLine", "加载商品", "商品目录请求期间显示。"],
      ["emptyLine", "暂无商品", "当前没有可售商品时显示。"],
      ["errorLine", "加载失败", "商品目录请求失败时显示。"],
      ["thanksLine", "购买成功", "玩家成功购买商品后显示。"]
    ]
  },
  {
    id: "nabomo",
    title: "娜波摩 · 残星会商店",
    description: "管理进入服装店、刷新衣架和购买反馈时显示的台词。",
    fixedFields: [
      ["loadingLine", "加载服装", "服装目录请求期间显示。"],
      ["emptyLine", "暂无服装", "当前没有可售服装时显示。"],
      ["errorLine", "加载失败", "服装目录请求失败时显示。"],
      ["thanksLine", "购买成功", "玩家成功购买服装后显示。"],
      ["insufficientLine", "金币不足", "购买服装时金币不足后显示。"]
    ]
  }
];

export default function AdminMascotSettings({ token, onSaved, onNotice }) {
  const [dialogues, setDialogues] = useState(() => (
    shopMascotDialoguesFromSettings(DEFAULT_SITE_SETTINGS)
  ));
  const [irisGreetings, setIrisGreetings] = useState(() => (
    irisGreetingsFromSettings(DEFAULT_SITE_SETTINGS)
  ));
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
        if (cancelled) return;
        setDialogues(shopMascotDialoguesFromSettings(data.settings));
        setIrisGreetings(irisGreetingsFromSettings(data.settings));
        setLinks(irisLinksFromSettings(data.settings));
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

  function updateMascotField(mascotId, field, value) {
    setDialogues((current) => ({
      ...current,
      [mascotId]: {
        ...current[mascotId],
        [field]: value
      }
    }));
  }

  async function saveMascotSettings(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await adminApi("/site-settings", token, {
        method: "PATCH",
        body: {
          shopMascotDialogues: shopMascotDialoguesSettingJson(dialogues),
          irisGreeting: irisGreetingsSettingJson(irisGreetings),
          irisLinks: irisLinksSettingJson(links)
        }
      });
      setDialogues(shopMascotDialoguesFromSettings(data.settings));
      setIrisGreetings(irisGreetingsFromSettings(data.settings));
      setLinks(irisLinksFromSettings(data.settings));
      onSaved?.(data.settings);
      onNotice?.("看板娘配置已保存", "success");
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-list-section">
      <AdminSectionHeader title="看板娘管理" meta="维护扎希拉、娜波摩与 IRIS 的玩家台词" />
      {loading ? (
        <p className="quiet-text" role="status">正在加载看板娘配置…</p>
      ) : (
        <form className="admin-form admin-settings-form" onSubmit={saveMascotSettings}>
          {MASCOT_SECTIONS.map((section) => (
            <MascotDialogueEditor
              key={section.id}
              section={section}
              value={dialogues[section.id]}
              onChange={(field, value) => updateMascotField(section.id, field, value)}
            />
          ))}
          <fieldset className="admin-settings-fieldset">
            <legend>IRIS · IRIS 数据库</legend>
            <p className="quiet-text">管理打开 IRIS 数据库后随机显示在通讯条中的问候语。</p>
            <DialoguePoolEditor
              label="问候语"
              tip="每次打开数据库时随机选择一条；留空时恢复默认问候语。"
              value={irisGreetings}
              maxLength={MAX_IRIS_GREETING_LENGTH}
              maxItems={MAX_IRIS_GREETING_POOL_SIZE}
              onChange={setIrisGreetings}
            />
          </fieldset>
          <IrisLinksEditor value={links} onChange={setLinks} />
          <div className="inline-actions">
            <AdminActionButton variant="primary" type="submit" disabled={saving}>
              {saving ? "保存中" : "保存看板娘配置"}
            </AdminActionButton>
          </div>
        </form>
      )}
    </section>
  );
}

function MascotDialogueEditor({ section, value, onChange }) {
  return (
    <fieldset className="admin-settings-fieldset">
      <legend>{section.title}</legend>
      <p className="quiet-text">{section.description}</p>
      <DialoguePoolEditor
        label="进入时随机台词"
        tip="每次成功载入商店时随机选择一条。"
        value={value.greetingLines}
        onChange={(lines) => onChange("greetingLines", lines)}
      />
      <DialoguePoolEditor
        label="刷新时随机台词"
        tip="每次成功换一批商品时随机选择一条。"
        value={value.refreshLines}
        onChange={(lines) => onChange("refreshLines", lines)}
      />
      <div className="admin-settings-grid">
        {section.fixedFields.map(([field, label, tip]) => (
          <label key={field}>
            <AdminFieldLabel text={label} tip={tip} />
            <input
              maxLength={MAX_MASCOT_DIALOGUE_LENGTH}
              value={value[field]}
              onChange={(event) => onChange(field, event.target.value)}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function DialoguePoolEditor({
  label,
  tip,
  value = [],
  maxLength = MAX_MASCOT_DIALOGUE_LENGTH,
  maxItems = MAX_MASCOT_DIALOGUE_POOL_SIZE,
  onChange
}) {
  const lines = Array.isArray(value) ? value : [];

  function updateLine(index, nextValue) {
    onChange(lines.map((line, currentIndex) => (
      currentIndex === index ? nextValue : line
    )));
  }

  return (
    <div>
      {lines.map((line, index) => (
        <div className="admin-settings-grid" key={`${label}-${index}`}>
          <label>
            <AdminFieldLabel text={`${label} ${index + 1}`} tip={tip} />
            <input
              maxLength={maxLength}
              value={line}
              onChange={(event) => updateLine(index, event.target.value)}
            />
          </label>
          <div className="inline-actions">
            <AdminActionButton
              variant="danger"
              type="button"
              disabled={lines.length <= 1}
              onClick={() => onChange(lines.filter((_, currentIndex) => currentIndex !== index))}
            >
              删除台词
            </AdminActionButton>
          </div>
        </div>
      ))}
      <div className="inline-actions">
        <AdminActionButton
          variant="secondary"
          type="button"
          disabled={lines.length >= maxItems}
          onClick={() => onChange([...lines, ""])}
        >
          添加{label}
        </AdminActionButton>
      </div>
    </div>
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
      <legend>IRIS 友情链接</legend>
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
