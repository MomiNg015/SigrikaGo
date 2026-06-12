import { useState } from "react";
import { Plus, X } from "lucide-react";
import { adminApi } from "../api/client.js";
import {
  buildGachaPoolDraft,
  emptyGachaPoolDraft,
  emptyGachaPrizeDraft,
  gachaPoolDraftToBody,
  gachaTypeLabel
} from "../shared/adminDrafts.js";
import { MUSIC_TRACKS } from "../shared/musicLibrary.js";
import { STONE_DECORATIONS } from "../shared/stoneDecorations.js";
import { AdminFieldLabel, AdminSectionHeader, AdminStatusPill } from "./adminComponents.jsx";

const COIN_PRIZE_OPTION = { value: "", name: "金币奖励", imageUrl: "" };

export function prizeOptionsForType(type, resourceCatalogs = {}) {
  if (type === "character") {
    return (resourceCatalogs.characters ?? []).map((character) => ({
      value: character.id ?? character.slug ?? "",
      name: character.name ?? character.id ?? character.slug ?? "",
      imageUrl: character.portrait ?? character.portraitUrl ?? character.imageUrl ?? ""
    })).filter((option) => option.value);
  }
  if (type === "decoration") {
    const builtInDecorations = Object.values(STONE_DECORATIONS).map((decoration) => ({
      value: decoration.id,
      name: decoration.name ?? decoration.id,
      imageUrl: decoration.previewImageUrl ?? ""
    }));
    const adminDecorations = (resourceCatalogs.decorations ?? []).map((decoration) => ({
      value: decoration.slug ?? decoration.id ?? "",
      name: decoration.name ?? decoration.slug ?? decoration.id ?? "",
      imageUrl: decoration.imageUrl ?? decoration.previewUrl ?? ""
    })).filter((option) => option.value);
    return uniquePrizeOptions([...builtInDecorations, ...adminDecorations]);
  }
  if (type === "item") {
    return (resourceCatalogs.items ?? []).map((item) => ({
      value: item.targetId ?? item.slug ?? item.id ?? "",
      name: item.name ?? item.targetId ?? item.slug ?? item.id ?? "",
      imageUrl: item.imageUrl ?? ""
    })).filter((option) => option.value);
  }
  if (type === "music") {
    return Object.values(MUSIC_TRACKS).map((track) => ({
      value: track.id,
      name: track.name,
      imageUrl: track.imageUrl ?? ""
    }));
  }
  return [];
}

function uniquePrizeOptions(options) {
  const seen = new Set();
  return options.filter((option) => {
    if (!option.value || seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
}

function prizeQuantityUnit(type) {
  return type === "coins" ? "金币" : "个";
}

function prizePatchForOption(option) {
  return {
    targetId: option?.value ?? "",
    name: option?.name ?? "",
    imageUrl: option?.imageUrl ?? ""
  };
}

function prizePatchForType(type, resourceCatalogs) {
  if (type === "coins") {
    return {
      type,
      targetId: "",
      name: COIN_PRIZE_OPTION.name,
      imageUrl: ""
    };
  }
  return {
    type,
    ...prizePatchForOption(prizeOptionsForType(type, resourceCatalogs)[0])
  };
}

function selectedPrizeOption(type, targetId, resourceCatalogs) {
  return prizeOptionsForType(type, resourceCatalogs).find((option) => option.value === targetId) ?? null;
}

function prizePreviewFor(prize, resourceCatalogs) {
  const selected = selectedPrizeOption(prize.type, prize.targetId, resourceCatalogs);
  return {
    imageUrl: selected?.imageUrl || prize.imageUrl || "",
    name: selected?.name || prize.name || COIN_PRIZE_OPTION.name,
    fallback: gachaTypeLabel(prize.type).slice(0, 1)
  };
}

export default function AdminGachaPools({ pools, token, resourceCatalogs = {}, onSaved, onNotice }) {
  const [draft, setDraft] = useState(null);

  function startNewPool() {
    const nextDraft = emptyGachaPoolDraft();
    setDraft({
      ...nextDraft,
      prizes: nextDraft.prizes.map((prize) => ({ ...prize, ...prizePatchForType(prize.type, resourceCatalogs) }))
    });
  }

  function editPool(pool) {
    setDraft(buildGachaPoolDraft(pool));
  }

  function updatePrize(index, patch) {
    setDraft((current) => ({
      ...current,
      prizes: current.prizes.map((prize, prizeIndex) => prizeIndex === index ? { ...prize, ...patch } : prize)
    }));
  }

  function updatePrizeType(index, type) {
    updatePrize(index, prizePatchForType(type, resourceCatalogs));
  }

  function updatePrizeResource(index, type, value) {
    const option = prizeOptionsForType(type, resourceCatalogs).find((candidate) => candidate.value === value);
    updatePrize(index, prizePatchForOption(option));
  }

  async function save(event) {
    event.preventDefault();
    const body = gachaPoolDraftToBody(draft);
    if (!body) {
      onNotice?.("请检查扭蛋池配置", "danger");
      return;
    }
    try {
      const id = draft.id;
      const data = await adminApi(id ? `/gacha-pools/${id}` : "/gacha-pools", token, {
        method: id ? "PATCH" : "POST",
        body
      });
      setDraft(buildGachaPoolDraft(data.pool));
      onNotice?.("扭蛋池已保存", "success");
      await onSaved();
    } catch (error) {
      onNotice?.(error.message, "danger");
    }
  }

  async function disablePool(pool) {
    try {
      await adminApi(`/gacha-pools/${pool.id}`, token, { method: "DELETE" });
      setDraft(null);
      await onSaved();
      onNotice?.("扭蛋池已关闭", "success");
    } catch (error) {
      onNotice?.(error.message, "danger");
    }
  }

  return (
    <section className="admin-list-section admin-gacha-board">
      <AdminSectionHeader title="扭蛋管理" meta={`${pools.length} 个池子`} actionLabel="新增池子" onAction={startNewPool} />
      <div className="admin-table-wrap">
        <table className="admin-table compact">
          <thead><tr><th>池子</th><th>开放时间</th><th>价格</th><th>大奖</th><th>奖项</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            {pools.map((pool) => (
              <tr key={pool.id} onClick={() => editPool(pool)}>
                <td>{pool.name}</td>
                <td>{pool.openDateRange}</td>
                <td>{pool.singleDrawPrice} / {pool.tenDrawPrice}</td>
                <td>{pool.featuredPrize?.name ?? pool.featuredPrizeId ?? "-"}</td>
                <td>
                  <div className="admin-gacha-prize-list admin-gacha-prize-summary">
                    {(pool.prizes ?? []).slice(0, 3).map((prize) => (
                      <span key={prize.id ?? `${prize.type}-${prize.targetId}`}>
                        {gachaTypeLabel(prize.type)} {Number(prize.probabilityBasisPoints ?? 0) / 100}%
                      </span>
                    ))}
                    {(pool.prizes?.length ?? 0) > 3 && <span>+{pool.prizes.length - 3}</span>}
                  </div>
                </td>
                <td><AdminStatusPill tone={pool.enabled ? "green" : "neutral"}>{pool.enabled ? "开放配置" : "隐藏"}</AdminStatusPill></td>
                <td><button className="admin-row-action" type="button">编辑</button></td>
              </tr>
            ))}
            {pools.length === 0 && <tr><td className="admin-table-empty" colSpan="7">暂无扭蛋池</td></tr>}
          </tbody>
        </table>
      </div>

      {draft && (
        <aside className="admin-crud-drawer">
          <button className="close-button" type="button" onClick={() => setDraft(null)}><X size={18} /></button>
          <form className="admin-character-form admin-gacha-form" onSubmit={save}>
            <div className="admin-form-heading">
              <div>
                <h2>{draft.id ? "编辑扭蛋池" : "新增扭蛋池"}</h2>
                <p className="quiet-text">{draft.name || "配置开放时间、价格、大奖和概率"}</p>
              </div>
              <button className="primary-action" type="submit">保存</button>
            </div>
            <div className="admin-character-form-grid">
              <label><AdminFieldLabel text="池子名" tip="显示在玩家左侧 tabs 上。" /><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
              <label><AdminFieldLabel text="单抽价格" tip="单次抽奖消耗金币。" /><input type="number" min="1" value={draft.singleDrawPrice} onChange={(e) => setDraft({ ...draft, singleDrawPrice: e.target.value })} /></label>
              <label><AdminFieldLabel text="十连价格" tip="十连抽消耗金币。" /><input type="number" min="1" value={draft.tenDrawPrice} onChange={(e) => setDraft({ ...draft, tenDrawPrice: e.target.value })} /></label>
              <label><AdminFieldLabel text="排序" tip="数字越小越靠前。" /><input type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></label>
              <label className="admin-checkbox"><input type="checkbox" checked={draft.permanent} onChange={(e) => setDraft({ ...draft, permanent: e.target.checked })} /><AdminFieldLabel text="永久开放" tip="关闭后必须设置开始和结束时间。" /></label>
              <label className="admin-checkbox"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /><AdminFieldLabel text="启用" tip="关闭后玩家不会看到。" /></label>
              <label><AdminFieldLabel text="开始时间" tip="非永久池子的开始时间。" /><input type="datetime-local" disabled={draft.permanent} value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} /></label>
              <label><AdminFieldLabel text="结束时间" tip="非永久池子的结束时间。" /><input type="datetime-local" disabled={draft.permanent} value={draft.endsAt} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })} /></label>
              <label className="wide-field"><AdminFieldLabel text="描述" tip="后台备注和未来展示文案。" /><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
            </div>
            <div className="admin-gacha-prize-list">
              <div className="admin-gacha-prize-editor-head">
                <div>
                  <h3>奖项配置</h3>
                  <p>从当前游戏资源中选择奖品；概率按基点填写，10000 = 100%。</p>
                </div>
                <span>数量和概率均带单位</span>
              </div>
              {draft.prizes.map((prize, index) => {
                const preview = prizePreviewFor(prize, resourceCatalogs);
                return (
                  <div className="admin-gacha-prize-row" key={index}>
                    <div className="admin-gacha-prize-resource">
                      <span className="admin-gacha-prize-thumb" aria-hidden="true">
                        {preview.imageUrl ? <img src={preview.imageUrl} alt="" /> : <span>{preview.fallback}</span>}
                      </span>
                      <div className="admin-gacha-prize-controls">
                        <label>
                          <span>类型</span>
                          <select value={prize.type} onChange={(e) => updatePrizeType(index, e.target.value)}>
                            <option value="character">角色</option>
                            <option value="decoration">装饰</option>
                            <option value="item">道具</option>
                            <option value="music">音乐</option>
                            <option value="coins">金币</option>
                          </select>
                        </label>
                        <label>
                          <span>资源</span>
                          {prize.type === "coins" ? (
                            <span className="admin-gacha-resource-select admin-gacha-resource-static">{COIN_PRIZE_OPTION.name}</span>
                          ) : (
                            <select
                              className="admin-gacha-resource-select"
                              value={selectedPrizeOption(prize.type, prize.targetId, resourceCatalogs)?.value ?? ""}
                              onChange={(e) => updatePrizeResource(index, prize.type, e.target.value)}
                            >
                              <option value="">请选择资源</option>
                              {prizeOptionsForType(prize.type, resourceCatalogs).map((option) => (
                                <option key={option.value} value={option.value}>{option.name}</option>
                              ))}
                            </select>
                          )}
                        </label>
                      </div>
                    </div>
                    <div className="admin-gacha-prize-metrics">
                      <label className="admin-gacha-number-field">
                        <span>数量</span>
                        <input type="number" min="1" value={prize.quantity} onChange={(e) => updatePrize(index, { quantity: e.target.value })} />
                        <b>{prizeQuantityUnit(prize.type)}</b>
                      </label>
                      <label className="admin-gacha-number-field" title="10000 = 100%">
                        <span>概率</span>
                        <input type="number" min="0" max="10000" value={prize.probabilityBasisPoints} onChange={(e) => updatePrize(index, { probabilityBasisPoints: e.target.value })} />
                        <b>/10000</b>
                      </label>
                    </div>
                    <label className="admin-gacha-featured-toggle">
                      <input type="radio" checked={Number(draft.featuredPrizeIndex) === index} onChange={() => setDraft({ ...draft, featuredPrizeIndex: index })} />
                      <span>大奖</span>
                    </label>
                    <span className="admin-gacha-type-badge">{gachaTypeLabel(prize.type)}</span>
                  </div>
                );
              })}
              <button className="secondary-action" type="button" onClick={() => setDraft({ ...draft, prizes: [...draft.prizes, { ...emptyGachaPrizeDraft(), ...prizePatchForType("character", resourceCatalogs) }] })}>
                <Plus size={16} /> 添加奖项
              </button>
            </div>
            <div className="inline-actions">
              <button className="secondary-action" type="button" onClick={() => setDraft(null)}>取消</button>
              {draft.id && <button className="secondary-action" type="button" onClick={() => disablePool(draft)}>删除/关闭</button>}
            </div>
          </form>
        </aside>
      )}
    </section>
  );
}
