import { useState } from "react";
import { X } from "lucide-react";
import { adminApi } from "../api/client.js";
import {
  buildCostumeDraft,
  costumeDraftToBody,
  emptyCostumeDraft
} from "../shared/adminDrafts.js";
import {
  AdminFieldLabel,
  AdminSectionHeader,
  AdminStatusPill,
  AdminTableEmpty,
  AdminTableScroll
} from "./adminComponents.jsx";

export default function AdminCostumes({ costumes, characters, token, onSaved, onNotice }) {
  const [draft, setDraft] = useState(null);
  const [editingId, setEditingId] = useState("");

  function startNewCostume() {
    setEditingId("");
    setDraft(emptyCostumeDraft());
  }

  function editCostume(costume) {
    setEditingId(costume.id);
    setDraft(buildCostumeDraft(costume));
  }

  async function save(event) {
    event.preventDefault();
    if (!draft) return;
    const editing = Boolean(editingId);
    const validated = costumeDraftToBody(draft, { editing });
    if (!validated.ok) {
      onNotice?.(validated.error, "danger");
      return;
    }
    try {
      const data = await adminApi(editing ? `/costumes/${editingId}` : "/costumes", token, {
        method: editing ? "PATCH" : "POST",
        body: validated.value
      });
      setEditingId(data.costume.id);
      setDraft(buildCostumeDraft(data.costume));
      onNotice?.("保存成功", "success");
      await onSaved();
    } catch (error) {
      onNotice?.(error.message, "danger");
    }
  }

  return (
    <section className="admin-list-section">
      <AdminSectionHeader
        title="服装列表"
        meta={`${costumes.length} 套服装`}
        actionLabel="新增服装"
        onAction={startNewCostume}
      />
      <AdminTableScroll>
        <table className="admin-table compact">
          <thead>
            <tr><th>预览</th><th>服装</th><th>角色</th><th>价格</th><th>商店</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            {costumes.map((costume) => (
              <tr key={costume.id} onClick={() => editCostume(costume)}>
                <td><img className="admin-costume-thumb" src={costume.portraitUrl} alt="" /></td>
                <td><strong>{costume.name}</strong><small>{costume.id}</small></td>
                <td>{characters.find((character) => character.slug === costume.characterSlug)?.name ?? costume.characterSlug}</td>
                <td>{costume.finalPrice}/{costume.priceCoins}</td>
                <td><AdminStatusPill tone={costume.shopVisible ? "green" : "neutral"}>{costume.shopVisible ? "展示" : "隐藏"}</AdminStatusPill></td>
                <td><AdminStatusPill tone={costume.enabled ? "green" : "neutral"}>{costume.enabled ? "启用" : "停用"}</AdminStatusPill></td>
                <td><button className="admin-row-action" type="button">编辑</button></td>
              </tr>
            ))}
            {costumes.length === 0 && (
              <tr><AdminTableEmpty colSpan="7">暂无服装</AdminTableEmpty></tr>
            )}
          </tbody>
        </table>
      </AdminTableScroll>

      {draft && (
        <aside className="admin-crud-drawer">
          <button className="close-button" type="button" aria-label="关闭" onClick={() => setDraft(null)}><X size={18} /></button>
          <form className="admin-character-form" onSubmit={save}>
            <div className="admin-form-heading">
              <div>
                <h2>{editingId ? "编辑服装" : "新增服装"}</h2>
                <p className="quiet-text">{draft.name || "创建新的角色服装"}</p>
              </div>
              <button className="primary-action" type="submit">保存</button>
            </div>
            <div className="admin-character-form-grid">
              <label>
                <AdminFieldLabel text="服装 ID" tip="稳定唯一标识，创建后不可修改。" />
                <input value={draft.id} disabled={Boolean(editingId)} onChange={(event) => setDraft({ ...draft, id: event.target.value })} />
              </label>
              <label>
                <AdminFieldLabel text="服装名称" tip="商店与部员手册详情中显示的名称。" />
                <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </label>
              <label>
                <AdminFieldLabel text="所属角色" tip="服装只能由对应角色装扮。" />
                <select value={draft.characterSlug} onChange={(event) => setDraft({ ...draft, characterSlug: event.target.value })}>
                  <option value="">请选择角色</option>
                  {characters.map((character) => <option key={character.slug} value={character.slug}>{character.name}</option>)}
                </select>
              </label>
              <label>
                <AdminFieldLabel text="金币价格" tip="服装原价。" />
                <input type="number" min="0" value={draft.priceCoins} onChange={(event) => setDraft({ ...draft, priceCoins: event.target.value })} />
              </label>
              <label>
                <AdminFieldLabel text="折扣" tip="0 到 100 的折扣百分比。" />
                <input type="number" min="0" max="100" value={draft.discountPercent} onChange={(event) => setDraft({ ...draft, discountPercent: event.target.value })} />
              </label>
              <label>
                <AdminFieldLabel text="排序" tip="同一角色内以及商店候选中的稳定顺序。" />
                <input type="number" value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: event.target.value })} />
              </label>
              <label className="wide-field">
                <AdminFieldLabel text="常态立绘地址" tip="支持 /assets/... 或安全的 http(s) 地址。" />
                <input value={draft.portraitUrl} onChange={(event) => setDraft({ ...draft, portraitUrl: event.target.value })} />
              </label>
              <label className="wide-field">
                <AdminFieldLabel text="糖果特效立绘地址" tip="可留空；留空时沿用该角色原本的糖果特效立绘。" />
                <input value={draft.candyEffectPortraitUrl} onChange={(event) => setDraft({ ...draft, candyEffectPortraitUrl: event.target.value })} />
              </label>
              <label>
                <AdminFieldLabel text="显示缩放（%）" tip="只影响衣柜缩略图和角色实际装扮后的显示；商店商品图与详情图保持原尺寸。" />
                <input type="number" min="50" max="150" value={draft.portraitScalePercent} onChange={(event) => setDraft({ ...draft, portraitScalePercent: event.target.value })} />
              </label>
              <label>
                <AdminFieldLabel text="横向偏移（%）" tip="负数向左，正数向右；范围 -50 到 50。" />
                <input type="number" min="-50" max="50" value={draft.portraitOffsetXPercent} onChange={(event) => setDraft({ ...draft, portraitOffsetXPercent: event.target.value })} />
              </label>
              <label>
                <AdminFieldLabel text="纵向偏移（%）" tip="负数向上，正数向下；范围 -50 到 50。" />
                <input type="number" min="-50" max="50" value={draft.portraitOffsetYPercent} onChange={(event) => setDraft({ ...draft, portraitOffsetYPercent: event.target.value })} />
              </label>
              <label>
                <AdminFieldLabel text="illust 名称" tip="立绘作者名。" />
                <input value={draft.illustName} onChange={(event) => setDraft({ ...draft, illustName: event.target.value })} />
              </label>
              <label>
                <AdminFieldLabel text="illust 链接" tip="可选，仅支持 /assets/... 或 http(s) 地址。" />
                <input value={draft.illustUrl} onChange={(event) => setDraft({ ...draft, illustUrl: event.target.value })} />
              </label>
              <label className="admin-checkbox">
                <input type="checkbox" checked={draft.shopVisible} onChange={(event) => setDraft({ ...draft, shopVisible: event.target.checked })} />
                <AdminFieldLabel text="商店展示" tip="关闭后不进入服装店批次，但仍在部员手册展示。" />
              </label>
              <label className="admin-checkbox">
                <input type="checkbox" checked={draft.purchasable} onChange={(event) => setDraft({ ...draft, purchasable: event.target.checked })} />
                <AdminFieldLabel text="可购买" tip="关闭后可查看详情，但不能新增购买。" />
              </label>
              <label className="admin-checkbox">
                <input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />
                <AdminFieldLabel text="启用" tip="关闭后不可展示或装扮，当前使用者会回到默认服装；所有权仍保留。" />
              </label>
              <label className="wide-field">
                <AdminFieldLabel text="服装描述" tip="服装详情文案。" />
                <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              </label>
            </div>
            <button className="secondary-action" type="button" onClick={() => setDraft(null)}>取消</button>
          </form>
        </aside>
      )}
    </section>
  );
}
