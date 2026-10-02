import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { adminApi } from "../api/client.js";
import { parseAdminInteger } from "../shared/adminDrafts.js";
import {
  AdminActionButton,
  AdminFieldLabel,
  AdminSectionHeader,
  AdminStatusPill,
  AdminTableEmpty,
  AdminTableScroll
} from "./adminComponents.jsx";
import { formatDateTime } from "./adminFormatters.js";
import { buildUserDraft, parseOwnedItemsText } from "./adminUserDrafts.js";

export default function AdminUsers({ users, onSelect }) {
  return (
    <section className="admin-list-section">
      <AdminSectionHeader title="用户列表" meta={`${users.length} 个账号`} />
      <AdminTableScroll>
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
                <AdminTableEmpty colSpan="8">暂无用户</AdminTableEmpty>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableScroll>
    </section>
  );
}

export function UserEditor({ user, currentUserId, token, onClose, onRefresh, onCurrentUserChange, onNotice, onOpenReplay }) {
  const [draft, setDraft] = useState(() => buildUserDraft(user));
  const [banReason, setBanReason] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [userReplays, setUserReplays] = useState([]);
  const [loadingReplays, setLoadingReplays] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(buildUserDraft(user));
    setBanReason("");
    setNewPassword("");
    setUserReplays([]);
  }, [user]);

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function runAction(action) {
    setSaving(true);
    try {
      const result = await action();
      if (result?.user?.id === currentUserId) onCurrentUserChange(result.user);
      await onRefresh(user.id);
      onNotice?.("操作成功", "success");
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      setSaving(false);
    }
  }

  async function saveUser(event) {
    event.preventDefault();
    const rating = parseAdminInteger(draft.rating);
    if (rating == null) {
      onNotice?.("积分必须是 32-bit signed int 范围内的整数", "danger");
      return;
    }
    const coins = parseAdminInteger(draft.coins);
    if (coins == null) {
      onNotice?.("金币必须是 32-bit signed int 范围内的整数", "danger");
      return;
    }
    await runAction(() => adminApi(`/users/${draft.id}`, token, {
      method: "PATCH",
      body: {
        role: draft.role,
        rating,
        coins,
        ownedCharacters: draft.ownedCharactersText.split(",").map((item) => item.trim()).filter(Boolean),
        ownedItems: parseOwnedItemsText(draft.ownedItemsText),
        selectedCharacter: draft.selectedCharacter
      }
    }));
  }

  async function banUser() {
    const reason = banReason.trim();
    if (reason.length < 2) {
      onNotice?.("封禁原因至少需要 2 个字符", "danger");
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
      onNotice?.("新密码至少需要 4 个字符", "danger");
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
    try {
      const data = await adminApi(`/users/${user.id}/replays`, token);
      setUserReplays(data.records ?? []);
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      setLoadingReplays(false);
    }
  }

  return (
    <aside className="admin-drawer">
      <button className="close-button" onClick={onClose}><X size={18} /></button>
      <h2>{user.username}</h2>
      <p className="quiet-text">状态 {user.status} · 战绩 {user.wins}胜/{user.losses}负</p>
      <form className="admin-form" onSubmit={saveUser}>
        <label><AdminFieldLabel text="权限" tip="控制该账号是普通玩家还是管理员。" />
          <select value={draft.role} onChange={(event) => updateDraft("role", event.target.value)}>
            <option value="player">玩家</option>
            <option value="admin">管理员</option>
          </select>
        </label>
        <label><AdminFieldLabel text="段位" tip="段位按最近10盘胜负独立升降，不再由积分自动换算。" />
          <input value={draft.rank} readOnly />
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
        <label><AdminFieldLabel text="拥有道具" tip="一行一个道具，格式为 道具slug:数量。数量为 0 或删除该行可移除道具。" />
          <textarea rows={4} value={draft.ownedItemsText} onChange={(event) => updateDraft("ownedItemsText", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="出战角色" tip="该用户当前默认出战角色的 slug。" />
          <input value={draft.selectedCharacter} onChange={(event) => updateDraft("selectedCharacter", event.target.value)} />
        </label>
        <AdminActionButton variant="primary" type="submit" disabled={saving}>保存</AdminActionButton>
      </form>
      <div className="admin-replay-zone">
        <div className="admin-section-title">
          <AdminFieldLabel text="用户棋谱" tip="查看并回放该用户参与过的任意对局。" />
          <AdminActionButton variant="secondary" onClick={loadUserReplays} disabled={loadingReplays}>
            {loadingReplays ? "加载中" : "加载棋谱"}
          </AdminActionButton>
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
            setBanReason(event.target.value);
          }} />
        </label>
        <div className="inline-actions">
          <AdminActionButton variant="danger" onClick={banUser} disabled={saving || user.status === "banned"}>封禁</AdminActionButton>
          <AdminActionButton variant="secondary" onClick={unbanUser} disabled={saving || user.status !== "banned"}>解封</AdminActionButton>
        </div>
        <label><AdminFieldLabel text="新密码" tip="为该用户重置登录密码，至少 4 个字符。" />
          <input type="password" value={newPassword} onChange={(event) => {
            setNewPassword(event.target.value);
          }} />
        </label>
        <AdminActionButton variant="secondary" onClick={resetPassword} disabled={saving}>重置密码</AdminActionButton>
      </div>
    </aside>
  );
}
