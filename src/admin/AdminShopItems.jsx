import { useState } from "react";
import { X } from "lucide-react";
import { adminApi } from "../api/client.js";
import {
  buildShopItemDraft,
  emptyShopItemDraft,
  shopCategoryLabel,
  validateShopItemDraft
} from "../shared/adminDrafts.js";
import { AdminFieldLabel, AdminSectionHeader, AdminStatusPill, AdminTableEmpty, AdminTableScroll } from "./adminComponents.jsx";
import { formatStockQuantity } from "./adminFormatters.js";

export default function AdminShopItems({ items, token, onSaved, onClearError, onNotice, fixedCategory = "", title = "商城商品", metaSuffix = "个商品" }) {
  const [draft, setDraft] = useState(null);

  function startNewItem() {
    onClearError();
    setDraft({ ...emptyShopItemDraft(), category: fixedCategory || "character" });
  }

  function editItem(item) {
    onClearError();
    setDraft({ ...buildShopItemDraft(item), category: fixedCategory || item.category });
  }

  async function save(event) {
    event.preventDefault();
    if (!draft) return;
    onClearError();
    const validated = validateShopItemDraft(draft);
    if (!validated.ok) {
      onNotice?.(validated.error, "danger");
      return;
    }
    try {
      const id = draft.id;
      const data = await adminApi(id ? `/shop-items/${id}` : "/shop-items", token, {
        method: id ? "PATCH" : "POST",
        body: fixedCategory ? { ...validated.value, category: fixedCategory } : validated.value
      });
      setDraft(buildShopItemDraft(data.item));
      onNotice?.("保存成功", "success");
      await onSaved();
    } catch (error) {
      onNotice?.(error.message, "danger");
    }
  }

  async function disableItem(item) {
    try {
      await adminApi(`/shop-items/${item.id}`, token, { method: "DELETE" });
      await onSaved();
      setDraft(null);
      onNotice?.("下架成功", "success");
    } catch (error) {
      onNotice?.(error.message, "danger");
    }
  }

  return (
    <section className="admin-list-section">
      <AdminSectionHeader title={title} meta={`${items.length} ${metaSuffix}`} actionLabel={fixedCategory === "item" ? "新增道具" : "新增商品"} onAction={startNewItem} />
      <AdminTableScroll>
        <table className="admin-table compact">
          <thead><tr><th>商品</th><th>类别</th><th>目标</th><th>价格</th><th>库存</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} onClick={() => editItem(item)}>
                <td>{item.name}</td>
                <td>{shopCategoryLabel(item.category)}</td>
                <td>{item.targetId}</td>
                <td>{item.finalPrice}/{item.priceCoins}</td>
                <td>{item.category === "item" ? formatStockQuantity(item.stockQuantity) : "-"}</td>
                <td><AdminStatusPill tone={item.enabled ? "green" : "neutral"}>{item.enabled ? "展示" : "隐藏"}</AdminStatusPill></td>
                <td><button className="admin-row-action" type="button">编辑</button></td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <AdminTableEmpty colSpan="7">暂无商品</AdminTableEmpty>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableScroll>
      {draft && (
        <aside className="admin-crud-drawer">
          <button className="close-button" onClick={() => setDraft(null)}><X size={18} /></button>
          <form className="admin-character-form" onSubmit={save}>
            <div className="admin-form-heading">
              <div>
                <h2>{draft.id ? (fixedCategory === "item" ? "编辑道具" : "编辑商品") : (fixedCategory === "item" ? "新增道具" : "新增商品")}</h2>
                <p className="quiet-text">{draft.id ? draft.name || draft.targetId : "创建新的商城条目"}</p>
              </div>
              <button className="primary-action" type="submit">保存</button>
            </div>
            <div className="admin-character-form-grid">
              <label><AdminFieldLabel text={fixedCategory === "item" ? "道具名" : "商品名"} tip="商城中显示的商品名称。" /><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
              <label><AdminFieldLabel text="类别" tip="购买后获得角色、装饰或道具。" /><select value={draft.category} disabled={Boolean(fixedCategory)} onChange={(e) => setDraft({ ...draft, category: e.target.value })}><option value="character">角色</option><option value="item">道具</option><option value="decoration">装饰</option><option value="music">???</option></select></label>
              <label><AdminFieldLabel text="目标标识" tip="角色 slug、装饰 slug 或道具 slug。" /><input value={draft.targetId} onChange={(e) => setDraft({ ...draft, targetId: e.target.value })} /></label>
              <label><AdminFieldLabel text="道具目标" tip="自己类道具可直接使用；角色类道具使用时需要选择拥有的角色。" /><select value={draft.itemTargetType} disabled={(fixedCategory || draft.category) !== "item"} onChange={(e) => setDraft({ ...draft, itemTargetType: e.target.value })}><option value="self">用户自己</option><option value="character">拥有角色</option></select></label>
              <label><AdminFieldLabel text="商店库存" tip="-1 表示不限量，0 表示售罄，正整数表示每个用户可购买次数上限。" /><input type="number" min="-1" value={draft.stockQuantity} onChange={(e) => setDraft({ ...draft, stockQuantity: e.target.value })} /></label>
              <label><AdminFieldLabel text="金币价格" tip="购买所需原价金币。" /><input type="number" value={draft.priceCoins} onChange={(e) => setDraft({ ...draft, priceCoins: e.target.value })} /></label>
              <label><AdminFieldLabel text="折扣" tip="0 到 100 的折扣百分比。" /><input type="number" min="0" max="100" value={draft.discountPercent} onChange={(e) => setDraft({ ...draft, discountPercent: e.target.value })} /></label>
              <label><AdminFieldLabel text="排序" tip="商品显示顺序。" /><input type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></label>
              <label className="admin-checkbox"><input type="checkbox" checked={draft.purchasable} onChange={(e) => setDraft({ ...draft, purchasable: e.target.checked })} /><AdminFieldLabel text="可购买" tip="关闭后商品可展示但不能购买。" /></label>
              <label className="admin-checkbox"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /><AdminFieldLabel text="展示" tip="关闭后不在商城显示。" /></label>
              <label className="wide-field"><AdminFieldLabel text="图片地址" tip="商城卡片图片。" /><input value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} /></label>
              <label><AdminFieldLabel text="illust 名称" tip="商品图绘制人员名，留空则商品详情不显示 illust 标签。" /><input value={draft.illustName} onChange={(e) => setDraft({ ...draft, illustName: e.target.value })} /></label>
              <label><AdminFieldLabel text="illust 链接" tip="可选，仅支持 http(s) 或站内 / 路径；填写链接时必须填写 illust 名称。" /><input value={draft.illustUrl} onChange={(e) => setDraft({ ...draft, illustUrl: e.target.value })} /></label>
              <label className="wide-field"><AdminFieldLabel text="商品描述" tip="商城中显示的商品说明。" /><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
            </div>
            <div className="inline-actions">
              <button className="secondary-action" type="button" onClick={() => setDraft(null)}>取消</button>
              {draft.id && <button className="secondary-action" type="button" onClick={() => disableItem(draft)}>下架</button>}
            </div>
          </form>
        </aside>
      )}
    </section>
  );
}
