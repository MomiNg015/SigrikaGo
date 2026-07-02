import { useState } from "react";
import { X } from "lucide-react";
import { adminApi } from "../api/client.js";
import { AdminFieldLabel, AdminSectionHeader, AdminTableEmpty, AdminTableScroll } from "./adminComponents.jsx";

const MUSIC_TYPE_LABELS = {
  home: "大厅",
  battle: "对局",
  skill: "角色技能"
};

export default function AdminMusicTracks({ tracks, token, onSaved, onNotice }) {
  const [draft, setDraft] = useState(null);
  const list = Object.values(tracks ?? {});

  function editTrack(track) {
    setDraft({
      id: track.id,
      defaultName: track.defaultName ?? track.name,
      displayName: track.name ?? "",
      type: track.type,
      characterId: track.characterId ?? ""
    });
  }

  async function save(event) {
    event.preventDefault();
    if (!draft) return;
    try {
      const data = await adminApi(`/music-tracks/${encodeURIComponent(draft.id)}`, token, {
        method: "PATCH",
        body: { displayName: draft.displayName }
      });
      onNotice?.("音乐显示名已保存", "success");
      setDraft({
        ...draft,
        displayName: data.track?.name ?? draft.displayName
      });
      await onSaved?.();
    } catch (error) {
      onNotice?.(error.message, "danger");
    }
  }

  return (
    <section className="admin-list-section">
      <AdminSectionHeader title="音乐管理" meta={`${list.length} 首音乐`} />
      <AdminTableScroll>
        <table className="admin-table compact">
          <thead><tr><th>轨道</th><th>类型</th><th>角色</th><th>默认名</th><th>显示名</th><th>操作</th></tr></thead>
          <tbody>
            {list.map((track) => (
              <tr key={track.id} onClick={() => editTrack(track)}>
                <td>{track.id}</td>
                <td>{MUSIC_TYPE_LABELS[track.type] ?? track.type}</td>
                <td>{track.characterId || "-"}</td>
                <td>{track.defaultName ?? track.name}</td>
                <td>{track.name}</td>
                <td><button className="admin-row-action" type="button">编辑</button></td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <AdminTableEmpty colSpan="6">暂无音乐</AdminTableEmpty>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableScroll>
      {draft && (
        <aside className="admin-crud-drawer">
          <button className="close-button" type="button" onClick={() => setDraft(null)}><X size={18} /></button>
          <form className="admin-character-form" onSubmit={save}>
            <div className="admin-form-heading">
              <div>
                <h2>编辑音乐显示名</h2>
                <p className="quiet-text">{draft.id}</p>
              </div>
              <button className="primary-action" type="submit">保存</button>
            </div>
            <div className="admin-character-form-grid">
              <label><AdminFieldLabel text="默认名" tip="代码内置音乐名，仅用于回退显示。" /><input value={draft.defaultName} disabled /></label>
              <label><AdminFieldLabel text="显示名" tip="玩家在游戏内看到的音乐名称，留空时回退默认名。" /><input value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} /></label>
              <label><AdminFieldLabel text="类型" tip="音乐在游戏中的使用位置。" /><input value={MUSIC_TYPE_LABELS[draft.type] ?? draft.type} disabled /></label>
              <label><AdminFieldLabel text="绑定角色" tip="角色技能 BGM 的角色 id；非角色音乐为空。" /><input value={draft.characterId || "-"} disabled /></label>
            </div>
            <div className="inline-actions">
              <button className="secondary-action" type="button" onClick={() => setDraft(null)}>取消</button>
            </div>
          </form>
        </aside>
      )}
    </section>
  );
}
