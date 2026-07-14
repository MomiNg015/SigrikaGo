import { useRef, useState } from "react";
import { Plus, Upload } from "lucide-react";
import { adminApi, uploadPortrait } from "../api/client.js";
import {
  buildCharacterDraft,
  characterDraftToBody,
  emptyCharacterDraft,
  updateDerivedSkillDraft
} from "../shared/adminDrafts.js";
import { extractSkillTraitReferences } from "../shared/skillTraits.js";
import { AdminFieldLabel } from "./adminComponents.jsx";

export default function AdminCharacters({ characters, skillTraits = [], token, onSaved, onNotice }) {
  const [draft, setDraft] = useState(null);

  function startNewCharacter() {
    setDraft(emptyCharacterDraft());
  }

  function selectCharacter(character) {
    setDraft(buildCharacterDraft(character));
  }

  return (
    <div className="admin-character-layout">
      <section className="admin-character-list">
        <button className="admin-add-button" onClick={startNewCharacter}>
          <Plus size={18} />新增角色
        </button>
        <div className="admin-character-cards">
          {characters.map((character) => (
            <button
              key={character.dbId ?? character.id}
              className={`admin-character-card ${draft?.dbId === character.dbId ? "selected" : ""}`}
              onClick={() => selectCharacter(character)}
            >
              <img src={character.portrait} alt={character.name} />
              <span>
                <strong>{character.name}</strong>
                <small>{character.id}</small>
              </span>
              <em>{character.enabled ? "启用" : "停用"}</em>
            </button>
          ))}
          {characters.length === 0 && <p className="quiet-text">暂无角色。</p>}
        </div>
      </section>
      <section className="admin-character-editor">
        {draft ? (
          <CharacterEditor
            draft={draft}
            setDraft={setDraft}
            token={token}
            skillTraits={skillTraits}
            onCancel={() => setDraft(null)}
            onNotice={onNotice}
            onSaved={async (savedCharacter) => {
              await onSaved();
              if (savedCharacter) setDraft(buildCharacterDraft(savedCharacter));
            }}
          />
        ) : (
          <div className="admin-empty-state">
            <strong>选择一个角色</strong>
            <p className="quiet-text">从左侧选择角色，或新建角色后编辑技能和肖像。</p>
          </div>
        )}
      </section>
    </div>
  );
}

function CharacterEditor({ draft, setDraft, skillTraits, token, onCancel, onSaved, onNotice }) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateSkill(field, value) {
    setDraft((current) => ({
      ...current,
      skill: {
        ...current.skill,
        [field]: value
      }
    }));
  }

  function updateDerivedSkill(derivedSkillId, field, value) {
    setDraft((current) => updateDerivedSkillDraft(current, derivedSkillId, field, value));
  }

  async function handleUpload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPortrait(file, token);
      setDraft((current) => ({
        ...current,
        portraitUrl: url,
        portraitSource: "upload"
      }));
      onNotice?.("上传成功", "success");
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      setUploading(false);
    }
  }

  async function saveCharacter(event) {
    event.preventDefault();
    const body = characterDraftToBody(draft);
    if (!body) {
      onNotice?.("请检查排序、技能名称和超频内容；数值超频只能填数字，特殊超频不能为空；CV 链接需为 http(s) 或站内路径且必须有 CV 名称", "danger");
      return;
    }

    setSaving(true);
    try {
      const id = draft.dbId ?? draft.originalSlug;
      const data = await adminApi(id ? `/characters/${id}` : "/characters", token, {
        method: id ? "PATCH" : "POST",
        body
      });
      onNotice?.("保存成功", "success");
      await onSaved(data.character);
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-character-form" onSubmit={saveCharacter}>
      <div className="admin-form-heading">
        <div>
          <h2>{draft.dbId ? "编辑角色" : "新增角色"}</h2>
          <p className="quiet-text">{draft.originalSlug || "new-character"}</p>
        </div>
        <div className="inline-actions">
          <button className="secondary-action" type="button" onClick={onCancel}>取消</button>
          <button className="primary-action" type="submit" disabled={saving}>{saving ? "保存中" : "保存"}</button>
        </div>
      </div>
      <div className="admin-character-form-grid">
        <label><AdminFieldLabel text="角色标识" tip="角色的唯一 slug，用于存档、拥有角色和出战角色匹配。" />
          <input value={draft.slug} onChange={(event) => updateDraft("slug", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="角色名称" tip="显示在棋舍、对局资料和技能演出中的角色名。" />
          <input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="CV 名称" tip="角色详情中显示的配音人员名；留空则不展示 CV 标签。" />
          <input value={draft.cvName} onChange={(event) => updateDraft("cvName", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="CV 链接" tip="可选。支持 http(s) 链接或以 / 开头的站内路径；填写后详情里的 CV 标签会作为链接打开。" />
          <input value={draft.cvUrl} onChange={(event) => updateDraft("cvUrl", event.target.value)} />
        </label>
        <label className="wide-field"><AdminFieldLabel text="角色描述" tip="展示在棋舍角色详情里，位于获得途径下方的角色介绍文本。" />
          <textarea value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="立绘地址" tip="角色立绘图片地址，可以是资源路径或上传后生成的路径。" />
          <input value={draft.portraitUrl} onChange={(event) => updateDraft("portraitUrl", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="立绘来源" tip="标记立绘来自外部路径还是后台上传。" />
          <select value={draft.portraitSource} onChange={(event) => updateDraft("portraitSource", event.target.value)}>
            <option value="url">路径</option>
            <option value="upload">上传</option>
          </select>
        </label>
        <label><AdminFieldLabel text="获得途径" tip="展示在棋舍角色详情中的纯文本说明。" />
          <input value={draft.acquisitionMethod} onChange={(event) => updateDraft("acquisitionMethod", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="主题色" tip="角色卡片和视觉提示使用的代表色。" />
          <input type="color" value={draft.palette} onChange={(event) => updateDraft("palette", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="排序" tip="角色在列表中的显示顺序，数字越小越靠前。" />
          <input type="number" value={draft.sortOrder} onChange={(event) => updateDraft("sortOrder", event.target.value)} />
        </label>
        <label className="admin-checkbox">
          <input type="checkbox" checked={draft.enabled} onChange={(event) => updateDraft("enabled", event.target.checked)} />
          <AdminFieldLabel text="启用" tip="关闭后该角色不会出现在玩家可选角色中。" />
        </label>
        <label className="admin-upload-field"><AdminFieldLabel text="上传立绘" tip="上传 png、jpg、webp 或 gif 作为角色立绘。" />
          <span>
            <Upload size={18} />
            {uploading ? "上传中" : "选择文件"}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => handleUpload(event.target.files?.[0])} />
          </span>
        </label>
      </div>
      {draft.portraitUrl && (
        <div className="admin-portrait-preview">
          <img src={draft.portraitUrl} alt={draft.name || "character portrait"} />
        </div>
      )}
      <h3>技能</h3>
      <div className="admin-character-form-grid">
        <label><AdminFieldLabel text="技能名" tip="展示给玩家看的技能名称。" />
          <input value={draft.skill.name} onChange={(event) => updateSkill("name", event.target.value)} />
        </label>
        <TraitDescriptionField
          label="技能描述"
          tip="棋舍角色详情和对局中展示的技能说明；【词】可放在正文任意位置。"
          value={draft.skill.description}
          traits={skillTraits}
          onChange={(value) => updateSkill("description", value)}
        />
        <label><AdminFieldLabel text="超频" tip="只修改技能的超频数值或说明，不会改变技能规则。" />
          <input
            type={draft.skill.costType === "numeric" ? "number" : "text"}
            value={draft.skill.costValue}
            onChange={(event) => updateSkill("costValue", event.target.value)}
          />
        </label>
      </div>
      {(draft.skill.derivedSkills ?? []).length > 0 && (
        <>
          <h3>派生技能</h3>
          <div className="admin-character-form-grid">
            {(draft.skill.derivedSkills ?? []).map((derivedSkill) => (
              <DerivedSkillEditor
                key={derivedSkill.id ?? derivedSkill.effectType}
                derivedSkill={derivedSkill}
                skillTraits={skillTraits}
                onChange={updateDerivedSkill}
              />
            ))}
          </div>
        </>
      )}
    </form>
  );
}

function DerivedSkillEditor({ derivedSkill, skillTraits, onChange }) {
  const derivedSkillId = derivedSkill.effectType ?? derivedSkill.id;
  return (
    <>
      <label><AdminFieldLabel text="派生技能名" tip="展示给玩家看的派生技能名称。" />
        <input value={derivedSkill.name} onChange={(event) => onChange(derivedSkillId, "name", event.target.value)} />
      </label>
      <label><AdminFieldLabel text="派生超频" tip="只修改派生技能的超频数值或说明，不会改变技能规则。" />
        <input
          type={derivedSkill.costType === "special" ? "text" : "number"}
          value={derivedSkill.costValue}
          onChange={(event) => onChange(derivedSkillId, "costValue", event.target.value)}
        />
      </label>
      <TraitDescriptionField
        label="派生技能描述"
        tip="角色详情和对局技能说明中展示的派生技能文本；【词】可放在正文任意位置。"
        value={derivedSkill.description}
        traits={skillTraits}
        onChange={(value) => onChange(derivedSkillId, "description", value)}
      />
    </>
  );
}

function TraitDescriptionField({ label, tip, value, traits, onChange }) {
  const textareaRef = useRef(null);
  const referencedNames = new Set(extractSkillTraitReferences(value));
  const availableTraits = traits.filter((trait) => !referencedNames.has(trait.name));

  function insertTrait(event) {
    const traitName = event.target.value;
    event.target.value = "";
    if (!traitName) return;
    const insertion = insertSkillTraitToken(value, traitName, textareaRef.current);
    if (!insertion) return;
    onChange(insertion.value);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(insertion.cursor, insertion.cursor);
    });
  }

  return (
    <label className="wide-field admin-trait-description-field">
      <AdminFieldLabel text={label} tip={tip} />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="admin-trait-insert-row">
        <span>插入特性词</span>
        <select
          aria-label={`${label}插入特性词`}
          defaultValue=""
          disabled={!availableTraits.length}
          onChange={insertTrait}
        >
          <option value="">{availableTraits.length ? "选择词条" : "没有可插入词条"}</option>
          {availableTraits.map((trait) => (
            <option key={trait.id} value={trait.name}>【{trait.name}】</option>
          ))}
        </select>
      </span>
    </label>
  );
}

export function insertSkillTraitToken(value, traitName, textarea) {
  const text = String(value ?? "");
  if (extractSkillTraitReferences(text).includes(traitName)) return null;
  const token = `【${traitName}】`;
  const start = Number.isInteger(textarea?.selectionStart) ? textarea.selectionStart : text.length;
  const end = Number.isInteger(textarea?.selectionEnd) ? textarea.selectionEnd : start;
  return {
    value: `${text.slice(0, start)}${token}${text.slice(end)}`,
    cursor: start + token.length
  };
}
