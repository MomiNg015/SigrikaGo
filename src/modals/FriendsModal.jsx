import { Fragment, useEffect, useState } from "react";
import { Settings, X } from "lucide-react";
import { api } from "../api/client.js";
import { CHARACTERS } from "../shared/characters.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { ConfirmPanel, UserProfileCard } from "./UserProfileCard.jsx";

const STATUS_LABELS = {
  online: "在线",
  offline: "离线",
  playing: "对局中"
};

export default function FriendsModal({ token, socket, characters, onClose, onOpenReplay }) {
  const [activeTab, setActiveTab] = useState("friends");
  const [actionTarget, setActionTarget] = useState(null);
  const [friends, setFriends] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const rows = activeTab === "friends" ? friends : blacklist;
  const actionRow = actionTarget?.row;

  useEffect(() => {
    refreshSocial();
  }, [token]);

  useEffect(() => {
    if (!socket) return undefined;
    const sent = ({ target }) => setNotice({ type: "success", text: `已向${target.username}发送对局申请。` });
    const rejected = ({ username }) => setNotice({ type: "danger", text: `${username}拒绝了你的对局申请。` });
    const unavailable = ({ reason }) => setNotice({ type: "danger", text: reason === "playing" ? "对方正在对局中。" : "对方不在线。" });
    socket.on("duel:sent", sent);
    socket.on("duel:rejected", rejected);
    socket.on("duel:unavailable", unavailable);
    return () => {
      socket.off("duel:sent", sent);
      socket.off("duel:rejected", rejected);
      socket.off("duel:unavailable", unavailable);
    };
  }, [socket]);

  async function refreshSocial() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api("/api/social", { token });
      setFriends(data.friends ?? []);
      setBlacklist(data.blacklist ?? []);
    } catch (error) {
      setNotice({ type: "danger", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function openProfile(row) {
    setActionTarget(null);
    setConfirmTarget(null);
    try {
      const data = await api(`/api/users/${row.id}/profile`, { token });
      setProfileUser(data.profile);
    } catch (error) {
      setNotice({ type: "danger", text: error.message });
    }
  }

  async function removeTarget(target = confirmTarget) {
    if (!target) return;
    const path = target.type === "friend" ? "friends" : "blacklist";
    const data = await api(`/api/social/${path}/${target.user.id}`, { method: "DELETE", token });
    setFriends(data.friends ?? []);
    setBlacklist(data.blacklist ?? []);
    setConfirmTarget(null);
    setActionTarget(null);
  }

  function requestMatch(row) {
    if (row.status !== "online") return;
    socket?.emit("duel:request", { targetUserId: row.id });
    setActionTarget(null);
  }

  function openConfirm(type, user) {
    setActionTarget(null);
    setProfileUser(null);
    setConfirmTarget({ type, user });
  }

  function renderActionPanel(row) {
    return (
      <div className="friend-action-row">
        <button type="button" onClick={() => openProfile(row)}>详细信息</button>
        {activeTab === "friends" ? (
          <>
            <button type="button">密谈</button>
            <button type="button" disabled={row.status !== "online"} onClick={() => requestMatch(row)}>对局申请</button>
            <button type="button" onClick={() => openConfirm("friend", row)}>解除好友</button>
          </>
        ) : (
          <button type="button" onClick={() => openConfirm("blacklist", row)}>从黑名单解除</button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <section className="friends-modal" onClick={(event) => event.stopPropagation()}>
          <button className="close-button" onClick={onClose}><X size={20} /></button>
          <div className="friends-tabs" role="tablist" aria-label="好友列表分类">
            <button className={activeTab === "friends" ? "active" : ""} type="button" onClick={() => setActiveTab("friends")}>好友</button>
            <button className={activeTab === "blacklist" ? "active" : ""} type="button" onClick={() => setActiveTab("blacklist")}>黑名单</button>
          </div>
          {notice?.text && <p className={`friend-notice ${notice.type === "danger" ? "danger" : ""}`}>{notice.text}</p>}
          {loading && <p className="quiet-text">加载中...</p>}
          {!loading && (
            <div className="friends-list">
              <div className="friends-list-heading">
                <span>状态</span>
                <span>常用角色</span>
                <span>用户名</span>
                <span>段位</span>
                <span>积分</span>
                <span>操作</span>
              </div>
              {rows.map((row) => {
                const character = findCharacter(characters, row.characterId) ?? CHARACTERS.sigrika;
                return (
                  <Fragment key={row.id}>
                    <article className="friends-row">
                      <span className={`online-status ${row.status}`}>{STATUS_LABELS[row.status]}</span>
                      <img src={character.portrait} alt={character.name} />
                      <strong>{row.username}</strong>
                      <span>{row.rank}</span>
                      <span>{row.rating}分</span>
                      <div className="friend-actions-cell">
                        <button
                          className="friend-gear-button"
                          type="button"
                          title="操作"
                          onClick={(event) => {
                            event.stopPropagation();
                            setActionTarget((current) => current?.row?.id === row.id ? null : { row });
                          }}
                        >
                          <Settings size={18} />
                        </button>
                      </div>
                    </article>
                    {actionRow?.id === row.id && renderActionPanel(row)}
                  </Fragment>
                );
              })}
              {rows.length === 0 && <p className="quiet-text">暂无名单成员。</p>}
            </div>
          )}
        </section>
      </div>
      {profileUser && (
        <div className="modal-backdrop profile-modal-backdrop" onClick={() => setProfileUser(null)}>
          <section className="room-floating-modal user-profile-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setProfileUser(null)}><X size={20} /></button>
            <UserProfileCard
              user={profileUser}
              characters={characters}
              token={token}
              onOpenReplay={(recordId) => {
                setProfileUser(null);
                onOpenReplay?.(recordId);
              }}
            />
          </section>
        </div>
      )}
      {confirmTarget && (
        <div className="modal-backdrop profile-modal-backdrop" onClick={() => setConfirmTarget(null)}>
          <section className="room-floating-modal confirm-inline-modal" onClick={(event) => event.stopPropagation()}>
            <ConfirmPanel
              message={confirmTarget.type === "friend" ? `确定解除${confirmTarget.user.username}好友吗？` : `确定将${confirmTarget.user.username}从黑名单解除吗？`}
              onConfirm={() => removeTarget()}
              onCancel={() => setConfirmTarget(null)}
            />
          </section>
        </div>
      )}
    </>
  );
}
