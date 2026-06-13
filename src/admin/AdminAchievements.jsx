import { useMemo, useState } from "react";
import { adminApi } from "../api/client.js";

const DEFAULT_CONDITION = { value: 1 };
const EMPTY_ACHIEVEMENT = {
  key: "",
  name: "",
  content: "",
  conditionType: "total_games",
  conditionParams: DEFAULT_CONDITION,
  rewardAssetId: "",
  enabled: true,
  sortOrder: 0
};
const EMPTY_REWARD = {
  type: "currency",
  name: "",
  description: "",
  imageUrl: "",
  text: "",
  targetType: "coins",
  targetId: "",
  amount: 10,
  enabled: true,
  sortOrder: 0
};

export default function AdminAchievements({ data, token, onSaved, onNotice }) {
  const [view, setView] = useState("achievements");
  const [draftAchievement, setDraftAchievement] = useState(null);
  const [draftReward, setDraftReward] = useState(null);
  const rewardAssets = data?.rewardAssets ?? [];
  const achievements = data?.achievements ?? [];
  const rewardOptions = useMemo(() => rewardAssets.filter((asset) => asset.enabled && !asset.deletedAt), [rewardAssets]);

  async function saveAchievement(event) {
    event.preventDefault();
    const payload = {
      ...draftAchievement,
      conditionParams: normalizeJsonLike(draftAchievement.conditionParams)
    };
    try {
      if (payload.id) await adminApi(`/achievements/${payload.id}`, token, { method: "PATCH", body: payload });
      else await adminApi("/achievements", token, { method: "POST", body: payload });
      setDraftAchievement(null);
      await onSaved();
      onNotice?.("成就已保存", "success");
    } catch (error) {
      onNotice?.(error.message);
    }
  }

  async function saveReward(event) {
    event.preventDefault();
    try {
      if (draftReward.id) await adminApi(`/achievement-reward-assets/${draftReward.id}`, token, { method: "PATCH", body: draftReward });
      else await adminApi("/achievement-reward-assets", token, { method: "POST", body: draftReward });
      setDraftReward(null);
      await onSaved();
      onNotice?.("奖励资产已保存", "success");
    } catch (error) {
      onNotice?.(error.message);
    }
  }

  async function disableAchievement(achievement) {
    try {
      await adminApi(`/achievements/${achievement.id}`, token, { method: "DELETE" });
      await onSaved();
      onNotice?.("成就已下线", "success");
    } catch (error) {
      onNotice?.(error.message);
    }
  }

  async function disableReward(asset) {
    try {
      await adminApi(`/achievement-reward-assets/${asset.id}`, token, { method: "DELETE" });
      await onSaved();
      onNotice?.("奖励资产已下线", "success");
    } catch (error) {
      onNotice?.(error.message);
    }
  }

  return (
    <section className="admin-list-section admin-achievement-board">
      <div className="admin-section-header">
        <div className="admin-section-title-block">
          <h2>成就管理</h2>
          <span>{achievements.length} 条成就 · {rewardAssets.length} 个奖励资产</span>
        </div>
        <div className="admin-achievement-switch" role="tablist" aria-label="成就管理视图">
          <button className={view === "achievements" ? "active" : ""} type="button" onClick={() => setView("achievements")}>成就列表</button>
          <button className={view === "rewards" ? "active" : ""} type="button" onClick={() => setView("rewards")}>奖励资产</button>
        </div>
      </div>

      {view === "achievements" && (
        <>
          <button className="admin-add-button" type="button" onClick={() => setDraftAchievement({ ...EMPTY_ACHIEVEMENT })}>新增成就</button>
          <div className="admin-table-wrap">
            <table className="admin-table compact">
              <thead><tr><th>Key</th><th>成就名</th><th>条件</th><th>奖励</th><th>状态</th><th>达成人数</th><th>操作</th></tr></thead>
              <tbody>
                {achievements.map((achievement) => (
                  <tr key={achievement.id}>
                    <td>{achievement.key}</td>
                    <td>{achievement.name}</td>
                    <td>{achievement.conditionType}</td>
                    <td>{achievement.reward?.name || "无"}</td>
                    <td><span className={`admin-status-pill ${achievement.enabled ? "green" : "red"}`}>{achievement.enabled ? "启用" : "下线"}</span></td>
                    <td>{achievement.achievedCount ?? 0}</td>
                    <td>
                      <button className="admin-row-action" type="button" onClick={() => setDraftAchievement(achievementToDraft(achievement))}>编辑</button>
                      <button className="admin-row-action" type="button" onClick={() => disableAchievement(achievement)}>下线</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === "rewards" && (
        <>
          <button className="admin-add-button" type="button" onClick={() => setDraftReward({ ...EMPTY_REWARD })}>新增奖励资产</button>
          <div className="admin-table-wrap">
            <table className="admin-table compact">
              <thead><tr><th>类型</th><th>名称</th><th>目标</th><th>数量</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>
                {rewardAssets.map((asset) => (
                  <tr key={asset.id}>
                    <td>{asset.type}</td>
                    <td>{asset.name}</td>
                    <td>{asset.targetId || asset.targetType || "-"}</td>
                    <td>{asset.amount}</td>
                    <td><span className={`admin-status-pill ${asset.enabled ? "green" : "red"}`}>{asset.enabled ? "启用" : "下线"}</span></td>
                    <td>
                      <button className="admin-row-action" type="button" onClick={() => setDraftReward({ ...asset })}>编辑</button>
                      <button className="admin-row-action" type="button" onClick={() => disableReward(asset)}>下线</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {draftAchievement && (
        <div className="admin-crud-drawer">
          <form className="admin-character-form" onSubmit={saveAchievement}>
            <div className="admin-form-heading">
              <h2>{draftAchievement.id ? "编辑成就" : "新增成就"}</h2>
              <button type="button" className="close-button" onClick={() => setDraftAchievement(null)}>×</button>
            </div>
            <div className="admin-character-form-grid">
              <label>Key<input value={draftAchievement.key} onChange={(e) => setDraftAchievement({ ...draftAchievement, key: e.target.value })} /></label>
              <label>排序<input type="number" value={draftAchievement.sortOrder} onChange={(e) => setDraftAchievement({ ...draftAchievement, sortOrder: Number(e.target.value) })} /></label>
              <label>成就名<input value={draftAchievement.name} onChange={(e) => setDraftAchievement({ ...draftAchievement, name: e.target.value })} /></label>
              <label>条件类型<input value={draftAchievement.conditionType} onChange={(e) => setDraftAchievement({ ...draftAchievement, conditionType: e.target.value })} /></label>
              <label className="wide-field">成就内容<textarea value={draftAchievement.content} onChange={(e) => setDraftAchievement({ ...draftAchievement, content: e.target.value })} /></label>
              <label className="wide-field">条件参数 JSON<textarea value={jsonText(draftAchievement.conditionParams)} onChange={(e) => setDraftAchievement({ ...draftAchievement, conditionParams: e.target.value })} /></label>
              <label>奖励资产<select value={draftAchievement.rewardAssetId} onChange={(e) => setDraftAchievement({ ...draftAchievement, rewardAssetId: e.target.value })}>
                <option value="">无奖励</option>
                {rewardOptions.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
              </select></label>
              <label className="admin-checkbox"><input type="checkbox" checked={draftAchievement.enabled} onChange={(e) => setDraftAchievement({ ...draftAchievement, enabled: e.target.checked })} />启用</label>
            </div>
            <button className="primary-action" type="submit">保存成就</button>
          </form>
        </div>
      )}

      {draftReward && (
        <div className="admin-crud-drawer">
          <form className="admin-character-form" onSubmit={saveReward}>
            <div className="admin-form-heading">
              <h2>{draftReward.id ? "编辑奖励资产" : "新增奖励资产"}</h2>
              <button type="button" className="close-button" onClick={() => setDraftReward(null)}>×</button>
            </div>
            <div className="admin-character-form-grid">
              <label>类型<input value={draftReward.type} onChange={(e) => setDraftReward({ ...draftReward, type: e.target.value })} /></label>
              <label>排序<input type="number" value={draftReward.sortOrder} onChange={(e) => setDraftReward({ ...draftReward, sortOrder: Number(e.target.value) })} /></label>
              <label>名称<input value={draftReward.name} onChange={(e) => setDraftReward({ ...draftReward, name: e.target.value })} /></label>
              <label>文本显示<input value={draftReward.text} onChange={(e) => setDraftReward({ ...draftReward, text: e.target.value })} /></label>
              <label>目标类型<input value={draftReward.targetType} onChange={(e) => setDraftReward({ ...draftReward, targetType: e.target.value })} /></label>
              <label>目标 ID<input value={draftReward.targetId} onChange={(e) => setDraftReward({ ...draftReward, targetId: e.target.value })} /></label>
              <label>数量<input type="number" value={draftReward.amount} onChange={(e) => setDraftReward({ ...draftReward, amount: Number(e.target.value) })} /></label>
              <label>图片 URL<input value={draftReward.imageUrl} onChange={(e) => setDraftReward({ ...draftReward, imageUrl: e.target.value })} /></label>
              <label className="wide-field">描述<textarea value={draftReward.description} onChange={(e) => setDraftReward({ ...draftReward, description: e.target.value })} /></label>
              <label className="admin-checkbox"><input type="checkbox" checked={draftReward.enabled} onChange={(e) => setDraftReward({ ...draftReward, enabled: e.target.checked })} />启用</label>
            </div>
            <button className="primary-action" type="submit">保存奖励资产</button>
          </form>
        </div>
      )}
    </section>
  );
}

function achievementToDraft(achievement) {
  return {
    ...achievement,
    conditionParams: achievement.conditionParams ?? DEFAULT_CONDITION,
    rewardAssetId: achievement.rewardAssetId ?? ""
  };
}

function jsonText(value) {
  if (typeof value === "string") return value;
  return JSON.stringify(value ?? {}, null, 2);
}

function normalizeJsonLike(value) {
  if (typeof value === "object" && value && !Array.isArray(value)) return value;
  try {
    return JSON.parse(String(value || "{}"));
  } catch {
    return {};
  }
}
