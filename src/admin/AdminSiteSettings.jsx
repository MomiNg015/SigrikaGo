import { useEffect, useRef, useState } from "react";
import { adminApi } from "../api/client.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { normalizeRatingRules } from "../shared/ratingRules.js";
import { AdminActionButton, AdminFieldLabel, AdminSectionHeader } from "./adminComponents.jsx";

export default function AdminSiteSettings({ token, onSaved, onNotice }) {
  const [draft, setDraft] = useState(() => settingsDraftFromApi(DEFAULT_SITE_SETTINGS));
  const [saving, setSaving] = useState(false);
  const onNoticeRef = useRef(onNotice);

  useEffect(() => {
    onNoticeRef.current = onNotice;
  }, [onNotice]);

  useEffect(() => {
    adminApi("/site-settings", token)
      .then((data) => setDraft(settingsDraftFromApi(data.settings)))
      .catch((error) => onNoticeRef.current?.(error.message, "danger"));
  }, [token]);

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await adminApi("/site-settings", token, {
        method: "PATCH",
        body: {
          ...draft,
          ratingRules: normalizeRatingRules(draft.ratingRules)
        }
      });
      setDraft(settingsDraftFromApi(data.settings));
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
      <AdminSectionHeader title="大厅文案" meta="修改大厅标题、项目版本号、关于文本和页脚信息" />
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
          <AdminFieldLabel text="项目版本号" tip="显示在大厅标题旁，例如 v0.1.0；不附加测试服、构建时间等其它文案。" />
          <input
            maxLength={24}
            value={draft.homeVersion}
            onChange={(event) => setDraft((current) => ({ ...current, homeVersion: event.target.value }))}
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
        <label>
          <AdminFieldLabel text="加载页提示语" tip="显示在加载进度条下方；每行一句，玩家加载时随机展示并每 10 秒切换。" />
          <textarea
            maxLength={1000}
            rows={5}
            value={draft.preloadTips}
            onChange={(event) => setDraft((current) => ({ ...current, preloadTips: event.target.value }))}
          />
        </label>
        <label>
          <AdminFieldLabel text="角色加载台词" tip="每行一个角色加载台词，格式为 角色ID=台词，例如 sigrika=西格莉卡正在戳棋盘。" />
          <textarea
            maxLength={3000}
            rows={6}
            value={draft.characterLoadingLines}
            onChange={(event) => setDraft((current) => ({ ...current, characterLoadingLines: event.target.value }))}
          />
        </label>
        <RatingRulesEditor
          value={draft.ratingRules}
          onChange={(ratingRules) => setDraft((current) => ({ ...current, ratingRules }))}
        />
        <fieldset className="admin-settings-fieldset">
          <legend>对局表现</legend>
          <label className="admin-toggle-row">
            <input
              type="checkbox"
              checked={draft.skillEffectsEnabled !== false}
              onChange={(event) => setDraft((current) => ({ ...current, skillEffectsEnabled: event.target.checked }))}
            />
            <span>启用技能特效演出</span>
          </label>
        </fieldset>
        <div className="inline-actions">
          <AdminActionButton variant="primary" type="submit" disabled={saving}>{saving ? "保存中" : "保存"}</AdminActionButton>
        </div>
      </form>
    </section>
  );
}

export function settingsDraftFromApi(settings = {}) {
  const merged = { ...DEFAULT_SITE_SETTINGS, ...(settings ?? {}) };
  delete merged.irisGreeting;
  delete merged.irisLinks;
  delete merged.shopMascotDialogues;
  delete merged.homeSubtitle;
  return merged;
}

function RatingRulesEditor({ value, onChange }) {
  const rules = normalizeRatingRules(value);
  const update = (path, nextValue) => {
    const next = structuredClone(rules);
    let target = next;
    for (const key of path.slice(0, -1)) target = target[key];
    target[path.at(-1)] = nextValue;
    onChange(next);
  };

  return (
    <fieldset className="admin-settings-fieldset rating-rules-fieldset">
      <legend>段位与友谊对局</legend>
      <p>九段以下采用星数制；九段每胜加200分、每负减250分。星数与积分不受对手段位或重复对局次数影响。</p>
      <div className="admin-settings-grid">
        <label>
          <AdminFieldLabel text="友谊胜利金币" tip="私人/好友/房间号对局每日奖励额度内的胜利金币。" />
          <input type="number" min="0" max="200" value={rules.privateRewards.winCoins} onChange={(event) => update(["privateRewards", "winCoins"], Number(event.target.value))} />
        </label>
        <label>
          <AdminFieldLabel text="友谊失败金币" tip="私人/好友/房间号对局每日奖励额度内的失败金币。" />
          <input type="number" min="0" max="100" value={rules.privateRewards.lossCoins} onChange={(event) => update(["privateRewards", "lossCoins"], Number(event.target.value))} />
        </label>
        <label>
          <AdminFieldLabel text="友谊和棋金币" tip="私人/好友/房间号对局每日奖励额度内的和棋金币。" />
          <input type="number" min="0" max="100" value={rules.privateRewards.drawCoins} onChange={(event) => update(["privateRewards", "drawCoins"], Number(event.target.value))} />
        </label>
        <label>
          <AdminFieldLabel text="友谊每日奖励局数" tip="按服务器时区自然日，每个用户前 N 局友谊对局有金币奖励。" />
          <input type="number" min="0" max="20" value={rules.privateRewards.dailyRewardLimit} onChange={(event) => update(["privateRewards", "dailyRewardLimit"], Number(event.target.value))} />
        </label>
      </div>
    </fieldset>
  );
}
