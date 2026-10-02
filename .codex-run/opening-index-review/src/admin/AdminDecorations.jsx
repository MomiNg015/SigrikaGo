import { useState } from "react";
import { X } from "lucide-react";
import { adminApi } from "../api/client.js";
import {
  buildDecorationDraft,
  decorationDraftToBody,
  emptyDecorationDraft
} from "../shared/adminDrafts.js";
import { AdminFieldLabel, AdminSectionHeader, AdminStatusPill, AdminTableEmpty, AdminTableScroll } from "./adminComponents.jsx";

export default function AdminDecorations({ decorations, token, onSaved, onNotice }) {
  const [draft, setDraft] = useState(null);

  function startNewDecoration() {
    setDraft(emptyDecorationDraft());
  }

  function editDecoration(decoration) {
    setDraft(buildDecorationDraft(decoration));
  }

  async function save(event) {
    event.preventDefault();
    if (!draft) return;
    const body = decorationDraftToBody(draft);
    if (!body) {
      onNotice?.("请填写装饰标识、名称和正确排序", "danger");
      return;
    }
    try {
      const data = await adminApi(draft.id ? `/decorations/${draft.id}` : "/decorations", token, {
        method: draft.id ? "PATCH" : "POST",
        body
      });
      setDraft(buildDecorationDraft(data.decoration));
      onNotice?.("保存成功", "success");
      await onSaved();
    } catch (error) {
      onNotice?.(error.message, "danger");
    }
  }

  return (
    <section className="admin-list-section">
      <AdminSectionHeader title="装饰列表" meta={`${decorations.length} 个装饰`} actionLabel="新增装饰" onAction={startNewDecoration} />
      <AdminTableScroll>
        <table className="admin-table compact">
          <thead><tr><th>装饰</th><th>标识</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            {decorations.map((decoration) => (
              <tr key={decoration.id} onClick={() => editDecoration(decoration)}>
                <td>{decoration.name}</td>
                <td>{decoration.slug}</td>
                <td>{decoration.sortOrder}</td>
                <td><AdminStatusPill tone={decoration.enabled ? "green" : "neutral"}>{decoration.enabled ? "启用" : "停用"}</AdminStatusPill></td>
                <td><button className="admin-row-action" type="button">编辑</button></td>
              </tr>
            ))}
            {decorations.length === 0 && (
              <tr>
                <AdminTableEmpty colSpan="5">暂无装饰</AdminTableEmpty>
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
                <h2>{draft.id ? "编辑装饰" : "新增装饰"}</h2>
                <p className="quiet-text">{draft.id ? draft.name || draft.slug : "创建新的装饰条目"}</p>
              </div>
              <button className="primary-action" type="submit">保存</button>
            </div>
            <div className="admin-character-form-grid">
              <label><AdminFieldLabel text="装饰标识" tip="装饰唯一 slug，用于购买后写入用户拥有列表。" /><input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></label>
              <label><AdminFieldLabel text="装饰名称" tip="棋舍里显示的装饰名称。" /><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
              <label><AdminFieldLabel text="图片地址" tip="装饰预览图片。" /><input value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} /></label>
              <label><AdminFieldLabel text="排序" tip="装饰显示顺序。" /><input type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></label>
              <label className="admin-checkbox"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /><AdminFieldLabel text="启用" tip="关闭后不展示该装饰。" /></label>
              <label className="wide-field"><AdminFieldLabel text="装饰描述" tip="棋舍和商城中展示的装饰说明。" /><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
            </div>
            <button className="secondary-action" type="button" onClick={() => setDraft(null)}>取消</button>
          </form>
        </aside>
      )}
    </section>
  );
}
