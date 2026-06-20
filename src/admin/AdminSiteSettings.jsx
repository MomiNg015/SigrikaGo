import { useEffect, useState } from "react";
import { adminApi } from "../api/client.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { normalizeRatingRules } from "../shared/ratingRules.js";
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
        body: {
          ...draft,
          ratingRules: normalizeRatingRules(draft.ratingRules)
        }
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
        <label>
          <AdminFieldLabel text="加载页提示语" tip="显示在加载进度条下方；每行一句，玩家加载时随机展示并每 10 秒切换。" />
          <textarea
            maxLength={1000}
            rows={5}
            value={draft.preloadTips}
            onChange={(event) => setDraft((current) => ({ ...current, preloadTips: event.target.value }))}
          />
        </label>
        <RatingRulesEditor
          value={draft.ratingRules}
          onChange={(ratingRules) => setDraft((current) => ({ ...current, ratingRules }))}
        />
        <div className="inline-actions">
          <button className="primary-action" type="submit" disabled={saving}>{saving ? "保存中" : "保存"}</button>
        </div>
      </form>
    </section>
  );
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
      <legend>积分与友谊对局</legend>
      <div className="admin-settings-grid">
        <label>
          <AdminFieldLabel text="Elo K 值" tip="同分胜负默认约 20 分；数值越高，单局积分波动越大。" />
          <input type="number" min="10" max="80" value={rules.elo.kFactor} onChange={(event) => update(["elo", "kFactor"], Number(event.target.value))} />
        </label>
        <label>
          <AdminFieldLabel text="胜负最小变动" tip="胜负局最低积分变化；和棋不套最低变动。" />
          <input type="number" min="0" max="20" value={rules.elo.deltaMin} onChange={(event) => update(["elo", "deltaMin"], Number(event.target.value))} />
        </label>
        <label>
          <AdminFieldLabel text="胜负最大变动" tip="单局基础 Elo 变化上限，段位差修正后仍可能进一步衰减或加重。" />
          <input type="number" min="20" max="80" value={rules.elo.deltaMax} onChange={(event) => update(["elo", "deltaMax"], Number(event.target.value))} />
        </label>
        <label>
          <AdminFieldLabel text="升降段积分" tip="最近十盘触发升段或降段时，额外增加或扣除的积分。" />
          <input type="number" min="0" max="500" value={rules.rankChangeRatingDelta} onChange={(event) => update(["rankChangeRatingDelta"], Number(event.target.value))} />
        </label>
      </div>

      <label className="admin-toggle-row">
        <input type="checkbox" checked={rules.rankGapAdjustment.enabled} onChange={(event) => update(["rankGapAdjustment", "enabled"], event.target.checked)} />
        <span>启用段位差积分修正</span>
      </label>
      <label className="admin-toggle-row">
        <input type="checkbox" checked={rules.antiBoost.enabled} onChange={(event) => update(["antiBoost", "enabled"], event.target.checked)} />
        <span>启用同对手防刷衰减</span>
      </label>

      <div className="admin-settings-grid">
        <label>
          <AdminFieldLabel text="防刷窗口小时" tip="同一对玩家同一模式在该时间窗口内重复对局会被计数。" />
          <input type="number" min="1" max="168" value={rules.antiBoost.windowHours} onChange={(event) => update(["antiBoost", "windowHours"], Number(event.target.value))} />
        </label>
        <label>
          <AdminFieldLabel text="正常计分局数" tip="窗口内前 N 局正常计分。" />
          <input type="number" min="0" max="50" value={rules.antiBoost.fullScoreGames} onChange={(event) => update(["antiBoost", "fullScoreGames"], Number(event.target.value))} />
        </label>
        <label>
          <AdminFieldLabel text="衰减截止局数" tip="从正常局数之后到该局数前使用衰减倍率；达到后积分为 0。" />
          <input type="number" min="0" max="100" value={rules.antiBoost.reducedScoreGames} onChange={(event) => update(["antiBoost", "reducedScoreGames"], Number(event.target.value))} />
        </label>
        <label>
          <AdminFieldLabel text="衰减倍率" tip="例如 0.25 表示只结算 25% 积分。" />
          <input type="number" min="0" max="1" step="0.05" value={rules.antiBoost.reducedMultiplier} onChange={(event) => update(["antiBoost", "reducedMultiplier"], Number(event.target.value))} />
        </label>
      </div>

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
