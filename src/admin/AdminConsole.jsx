import React, { useEffect, useState } from "react";
import { Plus, Upload, X } from "lucide-react";
import {
  buildCharacterDraft,
  buildDecorationDraft,
  buildShopItemDraft,
  characterDraftToBody,
  decorationDraftToBody,
  emptyCharacterDraft,
  emptyDecorationDraft,
  emptyShopItemDraft,
  parseAdminInteger,
  shopCategoryLabel,
  targetRuleForEffect,
  validateShopItemDraft
} from "../shared/adminDrafts.js";
import { SKILL_MESSAGE_TIP } from "../shared/skillMessages.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { adminApi, uploadPortrait } from "../api/client.js";

export default function AdminConsole({ user, token, tab, setTab, onCurrentUserChange, onCharactersChanged, onSiteSettingsChanged, onBack, onOpenReplay }) {
  const tabs = ["overview", "users", "characters", "shop", "decorations", "settings", "audit"];
  const tabLabels = {
    overview: "概览",
    users: "用户管理",
    characters: "角色管理",
    shop: "商城管理",
    decorations: "装饰管理",
    settings: "系统设置",
    audit: "审计日志"
  };
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [adminCharacters, setAdminCharacters] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [decorations, setDecorations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    if (tab !== "overview") return;
    setAdminError("");
    adminApi("/summary", token)
      .then(setSummary)
      .catch((error) => setAdminError(error.message));
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "users") return;
    refreshUsers();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "characters") return;
    refreshCharacters();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "audit") return;
    refreshAuditLogs();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "shop") return;
    refreshShopItems();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "decorations") return;
    refreshDecorations();
  }, [tab, token]);

  async function refreshUsers(nextSelectedId = selectedUser?.id) {
    setAdminError("");
    try {
      const data = await adminApi("/users", token);
      const nextUsers = data.users ?? [];
      setUsers(nextUsers);
      if (nextSelectedId) {
        setSelectedUser(nextUsers.find((candidate) => candidate.id === nextSelectedId) ?? null);
      }
    } catch (error) {
      setAdminError(error.message);
    }
  }

  async function refreshCharacters() {
    setAdminError("");
    try {
      const data = await adminApi("/characters", token);
      setAdminCharacters(data.characters ?? []);
    } catch (error) {
      setAdminError(error.message);
    }
  }

  async function refreshAuditLogs() {
    setAdminError("");
    try {
      const data = await adminApi("/audit-logs", token);
      setAuditLogs(data.auditLogs ?? []);
    } catch (error) {
      setAdminError(error.message);
    }
  }

  async function refreshShopItems() {
    setAdminError("");
    try {
      const data = await adminApi("/shop-items", token);
      setShopItems(data.items ?? []);
    } catch (error) {
      setAdminError(error.message);
    }
  }

  async function refreshDecorations() {
    setAdminError("");
    try {
      const data = await adminApi("/decorations", token);
      setDecorations(data.decorations ?? []);
    } catch (error) {
      setAdminError(error.message);
    }
  }

  return (
    <main className="admin-screen">
      <aside className="admin-sidebar">
        <strong>SigrikaGo Admin</strong>
        {tabs.map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {tabLabels[item]}
          </button>
        ))}
        <button onClick={onBack}>返回大厅</button>
      </aside>
      <section className="admin-main">
        <header><span>{user.username}</span><strong>{tabLabels[tab]}</strong></header>
        {adminError && <p className="form-error admin-error">{adminError}</p>}
        {tab === "overview" && <AdminOverview summary={summary} />}
        {tab === "users" && (
          <>
            <AdminUsers users={users} onSelect={setSelectedUser} />
            {selectedUser && (
              <UserEditor
                user={selectedUser}
                currentUserId={user.id}
                token={token}
                onClose={() => setSelectedUser(null)}
                onRefresh={refreshUsers}
                onCurrentUserChange={onCurrentUserChange}
                onOpenReplay={onOpenReplay}
              />
            )}
          </>
        )}
        {tab === "characters" && (
          <AdminCharacters
            characters={adminCharacters}
            token={token}
            onSaved={async () => {
              await refreshCharacters();
              await onCharactersChanged();
            }}
          />
        )}
        {tab === "shop" && (
          <AdminShopItems items={shopItems} token={token} onSaved={refreshShopItems} onClearError={() => setAdminError("")} />
        )}
        {tab === "decorations" && (
          <AdminDecorations decorations={decorations} token={token} onSaved={refreshDecorations} />
        )}
        {tab === "settings" && <AdminSiteSettings token={token} onSaved={onSiteSettingsChanged} />}
        {tab === "audit" && <AdminAudit logs={auditLogs} />}
      </section>
    </main>
  );
}

function AdminOverview({ summary }) {
  const cards = [
    ["用户", summary?.summary?.users ?? 0],
    ["封禁", summary?.summary?.bannedUsers ?? 0],
    ["角色", summary?.summary?.characters ?? 0],
    ["棋谱", summary?.summary?.gameRecords ?? 0]
  ];
  return (
    <div className="admin-grid">
      {cards.map(([label, value]) => <AdminStat key={label} label={label} value={value} />)}
    </div>
  );
}

function AdminSiteSettings({ token, onSaved }) {
  const [draft, setDraft] = useState(DEFAULT_SITE_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminApi("/site-settings", token)
      .then((data) => setDraft({ ...DEFAULT_SITE_SETTINGS, ...(data.settings ?? {}) }))
      .catch((error) => setMessage(error.message));
  }, [token]);

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const data = await adminApi("/site-settings", token, {
        method: "PATCH",
        body: draft
      });
      setDraft({ ...DEFAULT_SITE_SETTINGS, ...(data.settings ?? {}) });
      onSaved?.(data.settings);
      setMessage("已保存");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-list-section">
      <AdminSectionHeader title="大厅文案" meta="修改大厅标题和副标题" />
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
        <div className="inline-actions">
          <button className="primary-action" type="submit" disabled={saving}>{saving ? "保存中" : "保存"}</button>
          {message && <span className="admin-save-message">{message}</span>}
        </div>
      </form>
    </section>
  );
}

function AdminSectionHeader({ title, meta, actionLabel, onAction, children }) {
  return (
    <div className="admin-section-header">
      <div className="admin-section-title-block">
        <h2>{title}</h2>
        {meta && <span>{meta}</span>}
      </div>
      <div className="inline-actions">
        {children}
        {actionLabel && (
          <button className="primary-action" type="button" onClick={onAction}>
            <Plus size={18} />{actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function AdminStatusPill({ tone = "neutral", children }) {
  return <span className={`admin-status-pill ${tone}`}>{children}</span>;
}

function AdminUsers({ users, onSelect }) {
  return (
    <section className="admin-list-section">
      <AdminSectionHeader title="用户列表" meta={`${users.length} 个账号`} />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>权限</th>
              <th>状态</th>
              <th>段位</th>
              <th>积分</th>
              <th>金币</th>
              <th>胜负</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} onClick={() => onSelect(user)}>
                <td>{user.username}</td>
                <td><AdminStatusPill tone={user.role === "admin" ? "blue" : "neutral"}>{user.role === "admin" ? "管理员" : "玩家"}</AdminStatusPill></td>
                <td><AdminStatusPill tone={user.status === "active" ? "green" : "red"}>{user.status}</AdminStatusPill></td>
                <td>{user.rank}</td>
                <td>{user.rating}</td>
                <td>{user.coins}</td>
                <td>{user.wins}/{user.losses}</td>
                <td><button className="admin-row-action" type="button">编辑</button></td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="admin-table-empty" colSpan="8">暂无用户</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminCharacters({ characters, token, onSaved }) {
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

function AdminShopItems({ items, token, onSaved, onClearError }) {
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState("");

  function startNewItem() {
    onClearError();
    setMessage("");
    setDraft(emptyShopItemDraft());
  }

  function editItem(item) {
    onClearError();
    setMessage("");
    setDraft(buildShopItemDraft(item));
  }

  async function save(event) {
    event.preventDefault();
    if (!draft) return;
    onClearError();
    setMessage("");
    const validated = validateShopItemDraft(draft);
    if (!validated.ok) {
      setMessage(validated.error);
      return;
    }
    const id = draft.id;
    const data = await adminApi(id ? `/shop-items/${id}` : "/shop-items", token, {
      method: id ? "PATCH" : "POST",
      body: validated.value
    });
    setDraft(buildShopItemDraft(data.item));
    setMessage("保存成功");
    await onSaved();
  }

  async function disableItem(item) {
    await adminApi(`/shop-items/${item.id}`, token, { method: "DELETE" });
    await onSaved();
    setDraft(null);
  }

  return (
    <section className="admin-list-section">
      <AdminSectionHeader title="商城商品" meta={`${items.length} 个商品`} actionLabel="新增商品" onAction={startNewItem} />
      <div className="admin-table-wrap">
        <table className="admin-table compact">
          <thead><tr><th>商品</th><th>类别</th><th>目标</th><th>价格</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} onClick={() => editItem(item)}>
                <td>{item.name}</td>
                <td>{shopCategoryLabel(item.category)}</td>
                <td>{item.targetId}</td>
                <td>{item.finalPrice}/{item.priceCoins}</td>
                <td><AdminStatusPill tone={item.enabled ? "green" : "neutral"}>{item.enabled ? "展示" : "隐藏"}</AdminStatusPill></td>
                <td><button className="admin-row-action" type="button">编辑</button></td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="admin-table-empty" colSpan="6">暂无商品</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {draft && (
        <aside className="admin-crud-drawer">
          <button className="close-button" onClick={() => setDraft(null)}><X size={18} /></button>
          <form className="admin-character-form" onSubmit={save}>
            <div className="admin-form-heading">
              <div>
                <h2>{draft.id ? "编辑商品" : "新增商品"}</h2>
                <p className="quiet-text">{draft.id ? draft.name || draft.targetId : "创建新的商城条目"}</p>
              </div>
              <button className="primary-action" type="submit">保存</button>
            </div>
            {message && <p className={message === "保存成功" ? "admin-success" : "form-error admin-action-error"}>{message}</p>}
            <div className="admin-character-form-grid">
              <label><AdminFieldLabel text="商品名" tip="商城中显示的商品名称。" /><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
              <label><AdminFieldLabel text="类别" tip="购买后获得角色或装饰。" /><select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}><option value="character">角色</option><option value="decoration">装饰</option></select></label>
              <label><AdminFieldLabel text="目标标识" tip="角色 slug 或装饰 slug。" /><input value={draft.targetId} onChange={(e) => setDraft({ ...draft, targetId: e.target.value })} /></label>
              <label><AdminFieldLabel text="金币价格" tip="购买所需原价金币。" /><input type="number" value={draft.priceCoins} onChange={(e) => setDraft({ ...draft, priceCoins: e.target.value })} /></label>
              <label><AdminFieldLabel text="折扣" tip="0 到 100 的折扣百分比。" /><input type="number" min="0" max="100" value={draft.discountPercent} onChange={(e) => setDraft({ ...draft, discountPercent: e.target.value })} /></label>
              <label><AdminFieldLabel text="排序" tip="商品显示顺序。" /><input type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></label>
              <label className="admin-checkbox"><input type="checkbox" checked={draft.purchasable} onChange={(e) => setDraft({ ...draft, purchasable: e.target.checked })} /><AdminFieldLabel text="可购买" tip="关闭后商品可展示但不能购买。" /></label>
              <label className="admin-checkbox"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /><AdminFieldLabel text="展示" tip="关闭后不在商城显示。" /></label>
              <label className="wide-field"><AdminFieldLabel text="图片地址" tip="商城卡片图片。" /><input value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} /></label>
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

function AdminDecorations({ decorations, token, onSaved }) {
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState("");

  function startNewDecoration() {
    setMessage("");
    setDraft(emptyDecorationDraft());
  }

  function editDecoration(decoration) {
    setMessage("");
    setDraft(buildDecorationDraft(decoration));
  }

  async function save(event) {
    event.preventDefault();
    if (!draft) return;
    setMessage("");
    const body = decorationDraftToBody(draft);
    if (!body) {
      setMessage("请填写装饰标识、名称和正确排序");
      return;
    }
    const data = await adminApi(draft.id ? `/decorations/${draft.id}` : "/decorations", token, {
      method: draft.id ? "PATCH" : "POST",
      body
    });
    setDraft(buildDecorationDraft(data.decoration));
    setMessage("保存成功");
    await onSaved();
  }

  return (
    <section className="admin-list-section">
      <AdminSectionHeader title="装饰列表" meta={`${decorations.length} 个装饰`} actionLabel="新增装饰" onAction={startNewDecoration} />
      <div className="admin-table-wrap">
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
                <td className="admin-table-empty" colSpan="5">暂无装饰</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
            {message && <p className={message === "保存成功" ? "admin-success" : "form-error admin-action-error"}>{message}</p>}
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

function CharacterEditor({ draft, setDraft, token, onCancel, onSaved }) {
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const draftKey = draft.dbId || draft.originalSlug || "new-character";

  useEffect(() => {
    setSuccessMessage("");
    setActionError("");
  }, [draftKey]);

  function updateDraft(field, value) {
    setActionError("");
    setSuccessMessage("");
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateSkill(field, value) {
    setActionError("");
    setSuccessMessage("");
    setDraft((current) => ({
      ...current,
      skill: {
        ...current.skill,
        [field]: value
      }
    }));
  }

  function updateSkillEffect(effectType) {
    setActionError("");
    setSuccessMessage("");
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
    setActionError("");
    setSuccessMessage("");
    try {
      const url = await uploadPortrait(file, token);
      setDraft((current) => ({
        ...current,
        portraitUrl: url,
        portraitSource: "upload"
      }));
    } catch (error) {
      setActionError(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function saveCharacter(event) {
    event.preventDefault();
    const body = characterDraftToBody(draft);
    if (!body) {
      setActionError("排序和使用次数必须是整数；数值代价只能填数字，特殊代价需要填写文本");
      return;
    }

    setSaving(true);
    setActionError("");
    setSuccessMessage("");
    try {
      const id = draft.dbId ?? draft.originalSlug;
      const data = await adminApi(id ? `/characters/${id}` : "/characters", token, {
        method: id ? "PATCH" : "POST",
        body
      });
      setSuccessMessage("保存成功");
      await onSaved(data.character);
    } catch (error) {
      setActionError(error.message);
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
      {actionError && <p className="form-error admin-action-error">{actionError}</p>}
      {successMessage && <p className="admin-success">{successMessage}</p>}
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
        <label><AdminFieldLabel text="代价类别" tip="数值会在数子时扣除；特殊只展示文本，暂时不影响规则。" />
          <select value={draft.skill.costType} onChange={(event) => updateSkill("costType", event.target.value)}>
            <option value="numeric">数值</option>
            <option value="special">特殊</option>
          </select>
        </label>
        <label><AdminFieldLabel text="代价说明" tip="数值类别只能填写数字；特殊类别可填写展示文本。" />
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

function AdminAudit({ logs }) {
  return (
    <div className="admin-table-wrap audit-table-wrap">
      <table className="admin-table audit-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>管理员</th>
            <th>动作</th>
            <th>目标</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.createdAt)}</td>
              <td>{log.adminUserId ?? "-"}</td>
              <td>{log.action}</td>
              <td>{log.targetType ?? "-"} · {log.targetId ?? "-"}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan="4">暂无审计日志</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function UserEditor({ user, currentUserId, token, onClose, onRefresh, onCurrentUserChange, onOpenReplay }) {
  const [draft, setDraft] = useState(() => buildUserDraft(user));
  const [banReason, setBanReason] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [userReplays, setUserReplays] = useState([]);
  const [loadingReplays, setLoadingReplays] = useState(false);
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(buildUserDraft(user));
    setBanReason("");
    setNewPassword("");
    setUserReplays([]);
    setActionError("");
  }, [user]);

  function updateDraft(field, value) {
    setActionError("");
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function runAction(action) {
    setSaving(true);
    setActionError("");
    try {
      const result = await action();
      if (result?.user?.id === currentUserId) onCurrentUserChange(result.user);
      await onRefresh(user.id);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveUser(event) {
    event.preventDefault();
    const rating = parseAdminInteger(draft.rating);
    if (rating == null) {
      setActionError("积分必须是 32-bit signed int 范围内的整数");
      return;
    }
    const coins = parseAdminInteger(draft.coins);
    if (coins == null) {
      setActionError("金币必须是 32-bit signed int 范围内的整数");
      return;
    }
    await runAction(() => adminApi(`/users/${draft.id}`, token, {
      method: "PATCH",
      body: {
        role: draft.role,
        rank: draft.rank,
        rating,
        coins,
        ownedCharacters: draft.ownedCharactersText.split(",").map((item) => item.trim()).filter(Boolean),
        selectedCharacter: draft.selectedCharacter
      }
    }));
  }

  async function banUser() {
    const reason = banReason.trim();
    if (reason.length < 2) {
      setActionError("封禁原因至少需要 2 个字符");
      return;
    }
    if (!window.confirm(`确认封禁 ${user.username}？`)) return;
    await runAction(() => adminApi(`/users/${user.id}/ban`, token, {
      method: "POST",
      body: { reason }
    }));
  }

  async function unbanUser() {
    if (!window.confirm(`确认解封 ${user.username}？`)) return;
    await runAction(() => adminApi(`/users/${user.id}/unban`, token, { method: "POST" }));
  }

  async function resetPassword() {
    if (newPassword.length < 4) {
      setActionError("新密码至少需要 4 个字符");
      return;
    }
    if (!window.confirm(`确认重置 ${user.username} 的密码？`)) return;
    await runAction(async () => {
      await adminApi(`/users/${user.id}/reset-password`, token, {
        method: "POST",
        body: { password: newPassword }
      });
      setNewPassword("");
    });
  }

  async function loadUserReplays() {
    setLoadingReplays(true);
    setActionError("");
    try {
      const data = await adminApi(`/users/${user.id}/replays`, token);
      setUserReplays(data.records ?? []);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setLoadingReplays(false);
    }
  }

  return (
    <aside className="admin-drawer">
      <button className="close-button" onClick={onClose}><X size={18} /></button>
      <h2>{user.username}</h2>
      <p className="quiet-text">状态 {user.status} · 战绩 {user.wins}胜/{user.losses}负</p>
      {actionError && <p className="form-error admin-action-error">{actionError}</p>}
      <form className="admin-form" onSubmit={saveUser}>
        <label><AdminFieldLabel text="权限" tip="控制该账号是普通玩家还是管理员。" />
          <select value={draft.role} onChange={(event) => updateDraft("role", event.target.value)}>
            <option value="player">玩家</option>
            <option value="admin">管理员</option>
          </select>
        </label>
        <label><AdminFieldLabel text="段位" tip="显示在大厅、对局信息和个人棋舍中的段位文本。" />
          <input value={draft.rank} onChange={(event) => updateDraft("rank", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="积分" tip="用户的匹配积分，必须是整数。" />
          <input type="number" value={draft.rating} onChange={(event) => updateDraft("rating", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="金币" tip="用户当前拥有的金币数量，必须是整数。" />
          <input type="number" value={draft.coins} onChange={(event) => updateDraft("coins", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="拥有角色" tip="该用户已解锁的角色 slug，多个角色用英文逗号分隔。" />
          <input value={draft.ownedCharactersText} onChange={(event) => updateDraft("ownedCharactersText", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="出战角色" tip="该用户当前默认出战角色的 slug。" />
          <input value={draft.selectedCharacter} onChange={(event) => updateDraft("selectedCharacter", event.target.value)} />
        </label>
        <button className="primary-action" type="submit" disabled={saving}>保存</button>
      </form>
      <div className="admin-replay-zone">
        <div className="admin-section-title">
          <AdminFieldLabel text="用户棋谱" tip="查看并回放该用户参与过的任意对局。" />
          <button className="secondary-action" onClick={loadUserReplays} disabled={loadingReplays}>
            {loadingReplays ? "加载中" : "加载棋谱"}
          </button>
        </div>
        <div className="admin-replay-list">
          {userReplays.map((record) => (
            <button key={record.id} className="admin-replay-item" onClick={() => onOpenReplay(record.id)}>
              <strong>{record.blackName} vs {record.whiteName}</strong>
              <span>{record.resultText} · {record.moveCount}手 · {formatDateTime(record.createdAt)}</span>
            </button>
          ))}
          {!loadingReplays && userReplays.length === 0 && <p className="quiet-text">尚未加载或暂无棋谱。</p>}
        </div>
      </div>
      <div className="admin-danger-zone">
        <label><AdminFieldLabel text="封禁原因" tip="封禁账号时记录的原因，至少 2 个字符。" />
          <input value={banReason} onChange={(event) => {
            setActionError("");
            setBanReason(event.target.value);
          }} />
        </label>
        <div className="inline-actions">
          <button className="danger-action" onClick={banUser} disabled={saving || user.status === "banned"}>封禁</button>
          <button className="secondary-action" onClick={unbanUser} disabled={saving || user.status !== "banned"}>解封</button>
        </div>
        <label><AdminFieldLabel text="新密码" tip="为该用户重置登录密码，至少 4 个字符。" />
          <input type="password" value={newPassword} onChange={(event) => {
            setActionError("");
            setNewPassword(event.target.value);
          }} />
        </label>
        <button className="secondary-action" onClick={resetPassword} disabled={saving}>重置密码</button>
      </div>
    </aside>
  );
}
function AdminStat({ label, value }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

function AdminFieldLabel({ text, tip }) {
  return <span className="admin-field-label" title={tip}>{text}</span>;
}

function buildUserDraft(user) {
  return {
    id: user.id,
    role: user.role ?? "player",
    rank: user.rank ?? "",
    rating: user.rating ?? 0,
    coins: user.coins ?? 0,
    ownedCharactersText: (user.ownedCharacters ?? []).join(", "),
    selectedCharacter: user.selectedCharacter ?? ""
  };
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
