import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import { adminApi, uploadPortrait } from "../api/client.js";
import {
  buildCharacterDraft,
  characterDraftToBody,
  emptyCharacterDraft,
  targetRuleForEffect
} from "../shared/adminDrafts.js";
import { SKILL_MESSAGE_TIP } from "../shared/skillMessages.js";
import { AdminFieldLabel } from "./adminComponents.jsx";

export default function AdminCharacters({ characters, token, onSaved, onNotice }) {
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

function CharacterEditor({ draft, setDraft, token, onCancel, onSaved, onNotice }) {
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

  function updateSkillEffect(effectType) {
    setDraft((current) => ({
      ...current,
      skill: {
        ...current.skill,
        effectType,
        targetRule: targetRuleForEffect(effectType)
      }
    }));
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
      onNotice?.("排序和使用次数必须是整数；数值超频只能填数字，特殊超频需要填写文本", "danger");
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
        <label><AdminFieldLabel text="技能效果" tip="决定技能实际执行的规则类型。" />
          <select value={draft.skill.effectType} onChange={(event) => updateSkillEffect(event.target.value)}>
            <option value="erase-point">抹除交叉点</option>
            <option value="flip-stone">棋子反色</option>
            <option value="hidden-hand">隐藏手</option>
            <option value="random-blast">随机爆炸</option>
            <option value="color-illusion-passive">被动伪装</option>
          </select>
        </label>
        <label><AdminFieldLabel text="技能名" tip="展示给玩家看的技能名称。" />
          <input value={draft.skill.name} onChange={(event) => updateSkill("name", event.target.value)} />
        </label>
        <label className="wide-field"><AdminFieldLabel text="技能描述" tip="棋舍角色详情中展示的技能说明。" />
          <textarea value={draft.skill.description} onChange={(event) => updateSkill("description", event.target.value)} />
        </label>
        <label className="wide-field"><AdminFieldLabel text="技能系统信息" tip={SKILL_MESSAGE_TIP} />
          <textarea value={draft.skill.systemMessage} onChange={(event) => updateSkill("systemMessage", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="使用次数" tip="每局可使用该技能的次数，范围 0 到 9。" />
          <input type="number" min="0" max="9" value={draft.skill.uses} onChange={(event) => updateSkill("uses", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="目标规则" tip="限制技能可以点选空点还是已有棋子。" />
          <select value={draft.skill.targetRule} onChange={(event) => updateSkill("targetRule", event.target.value)}>
            <option value="empty-point">空交叉点</option>
            <option value="stone">棋子</option>
            <option value="any-point">任意点</option>
            <option value="none">无目标</option>
          </select>
        </label>
        <label className="admin-checkbox">
          <input type="checkbox" checked={draft.skill.freeTurn} onChange={(event) => updateSkill("freeTurn", event.target.checked)} />
          <AdminFieldLabel text="不消耗回合" tip="开启后释放技能不会交出当前回合。" />
        </label>
        <label className="admin-checkbox">
          <input type="checkbox" checked={draft.skill.enabled} onChange={(event) => updateSkill("enabled", event.target.checked)} />
          <AdminFieldLabel text="技能启用" tip="关闭后，该角色公开资料不会下发技能，玩家也不能使用该技能。" />
        </label>
        <label><AdminFieldLabel text="超频类别" tip="数值会在数子时扣除；特殊只展示文本，暂时不影响规则。" />
          <select value={draft.skill.costType} onChange={(event) => updateSkill("costType", event.target.value)}>
            <option value="numeric">数值</option>
            <option value="special">特殊</option>
          </select>
        </label>
        <label><AdminFieldLabel text="超频说明" tip="数值类别只能填写数字；特殊类别可填写展示文本。" />
          <input
            type={draft.skill.costType === "numeric" ? "number" : "text"}
            value={draft.skill.costValue}
            onChange={(event) => updateSkill("costValue", event.target.value)}
          />
        </label>
        <label className="wide-field"><AdminFieldLabel text="技能参数" tip="保留给扩展技能使用的 JSON 参数。" />
          <textarea value={draft.skill.paramsJson} onChange={(event) => updateSkill("paramsJson", event.target.value)} />
        </label>
      </div>
    </form>
  );
}
