import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { adminApi } from "../api/client.js";

const EMPTY_TRAIT = Object.freeze({
  id: "",
  name: "",
  definition: "",
  sortOrder: 0,
  references: []
});

export default function AdminSkillTraits({ traits, token, onSaved, onNotice }) {
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!draft?.id) return;
    const latest = traits.find((trait) => trait.id === draft.id);
    if (latest) setDraft({ ...latest });
  }, [draft?.id, traits]);

  async function saveTrait(event) {
    event.preventDefault();
    const name = String(draft?.name ?? "").trim();
    const definition = String(draft?.definition ?? "").trim();
    if (!name || !definition) {
      onNotice?.("特性词名称和释义均不能为空", "danger");
      return;
    }
    setSaving(true);
    try {
      const data = await adminApi(draft.id ? `/skill-traits/${draft.id}` : "/skill-traits", token, {
        method: draft.id ? "PATCH" : "POST",
        body: { name, definition, sortOrder: Number(draft.sortOrder) || 0 }
      });
      onNotice?.(draft.id ? "特性词已更新，技能引用已同步" : "特性词已创建", "success");
      setDraft({ ...data.trait, references: data.trait.references ?? [] });
      await onSaved?.();
    } catch (error) {
      if (Array.isArray(error.data?.references)) {
        setDraft((current) => current ? { ...current, references: error.data.references } : current);
      }
      onNotice?.(error.message, "danger");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTrait() {
    if (!draft?.id) return;
    if (draft.references?.length) {
      onNotice?.("该特性词仍有技能引用，请先移除引用", "danger");
      return;
    }
    if (!globalThis.confirm?.(`确定删除特性词【${draft.name}】吗？`)) return;
    setDeleting(true);
    try {
      await adminApi(`/skill-traits/${draft.id}`, token, { method: "DELETE" });
      onNotice?.("特性词已删除", "success");
      setDraft(null);
      await onSaved?.();
    } catch (error) {
      if (Array.isArray(error.data?.references)) {
        setDraft((current) => current ? { ...current, references: error.data.references } : current);
      }
      onNotice?.(error.message, "danger");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="admin-skill-trait-layout">
      <section className="admin-skill-trait-list" aria-label="特性词列表">
        <button className="admin-add-button" type="button" onClick={() => setDraft({ ...EMPTY_TRAIT })}>
          <Plus size={18} />新增特性词
        </button>
        <div className="admin-skill-trait-cards">
          {traits.map((trait) => (
            <button
              key={trait.id}
              type="button"
              className={`admin-skill-trait-card ${draft?.id === trait.id ? "selected" : ""}`}
              onClick={() => setDraft({ ...trait })}
            >
              <span>
                <strong>【{trait.name}】</strong>
                <small>{trait.definition}</small>
              </span>
              <em>{trait.references?.length ?? 0} 处引用</em>
            </button>
          ))}
          {!traits.length && <p className="quiet-text">暂无特性词。</p>}
        </div>
      </section>

      <section className="admin-skill-trait-editor">
        {draft ? (
          <form className="admin-character-form" onSubmit={saveTrait}>
            <div className="admin-form-heading">
              <div>
                <h2>{draft.id ? `编辑【${draft.name}】` : "新增特性词"}</h2>
                <p className="quiet-text">名称重命名时会原子替换基础与派生技能中的精确引用。</p>
              </div>
              <div className="inline-actions">
                {draft.id && (
                  <button
                    className="danger-action"
                    type="button"
                    disabled={deleting || Boolean(draft.references?.length)}
                    onClick={deleteTrait}
                  >
                    <Trash2 size={16} />{deleting ? "删除中" : "删除"}
                  </button>
                )}
                <button className="secondary-action" type="button" onClick={() => setDraft(null)}>取消</button>
                <button className="primary-action" type="submit" disabled={saving}>{saving ? "保存中" : "保存"}</button>
              </div>
            </div>
            <div className="admin-character-form-grid">
              <label>
                特性词名称
                <input
                  value={draft.name}
                  maxLength={8}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                />
                <small className="quiet-text">1–8 个字符；不能包含【或】，名称不可重复。</small>
              </label>
              <label>
                排序
                <input
                  type="number"
                  value={draft.sortOrder}
                  onChange={(event) => setDraft((current) => ({ ...current, sortOrder: event.target.value }))}
                />
              </label>
              <label className="wide-field">
                释义
                <textarea
                  required
                  value={draft.definition}
                  onChange={(event) => setDraft((current) => ({ ...current, definition: event.target.value }))}
                />
              </label>
            </div>
            {draft.id && (
              <div className="admin-skill-trait-references">
                <h3>引用位置（{draft.references?.length ?? 0}）</h3>
                {draft.references?.length ? (
                  <ul>
                    {draft.references.map((reference) => (
                      <li key={`${reference.characterId}:${reference.skillType}:${reference.skillId}`}>
                        <strong>{reference.characterName}</strong>
                        <span>{reference.skillType === "derived" ? "派生技能" : "基础技能"} · {reference.skillName}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="quiet-text">当前没有技能引用，可以安全删除。</p>
                )}
              </div>
            )}
          </form>
        ) : (
          <div className="admin-empty-state">
            <strong>选择一个特性词</strong>
            <p className="quiet-text">可编辑释义、查看引用，或新增词条。</p>
          </div>
        )}
      </section>
    </div>
  );
}
