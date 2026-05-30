import { Fragment, useEffect, useState } from "react";
import { Search, Settings, X } from "lucide-react";
import { api } from "../api/client.js";
import { CHARACTERS } from "../shared/characters.js";
import { resolveCandyPortrait } from "../shared/candyPortraits.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { ConfirmPanel, UserProfileCard } from "./UserProfileCard.jsx";

const SEARCH_USERNAME_MAX_LENGTH = 16;
const SEARCH_USERNAME_DISALLOWED = /[^\p{Script=Han}A-Za-z0-9_]/gu;

const STATUS_LABELS = {
  online: "在线",
  offline: "离线",
  playing: "对局中"
};

export default function FriendsModal({ token, socket, characters, onNotice, onClose, onOpenReplay }) {
  const [activeTab, setActiveTab] = useState("friends");
  const [actionTarget, setActionTarget] = useState(null);
  const [friends, setFriends] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [searchUsername, setSearchUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const rows = activeTab === "friends" ? friends : blacklist;
  const actionRow = actionTarget?.row;

  useEffect(() => {
    refreshSocial();
  }, [token]);

  useEffect(() => {
    if (!socket) return undefined;
    const sent = ({ target }) => notify(`已向${target.username}发送对局申请。`, "success");
    socket.on("duel:sent", sent);
    return () => {
      socket.off("duel:sent", sent);
    };
  }, [socket]);

  async function refreshSocial() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api("/api/social", { token });
      applySocialData(data);
    } catch (error) {
      notify(error.message, "danger");
    } finally {
      setLoading(false);
    }
  }

  function applySocialData(data) {
    setFriends(data.friends ?? []);
    setBlacklist(data.blacklist ?? []);
  }

  async function openProfile(row) {
    setActionTarget(null);
    setConfirmTarget(null);
    try {
      const data = await api(`/api/users/${row.id}/profile`, { token });
      setProfileUser(data.profile);
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  async function searchProfile() {
    const username = searchUsername.trim();
    if (!username) return;
    if (username.length < 2) {
      notify("用户名需为 2-16 位", "danger");
      return;
    }
    setActionTarget(null);
    setConfirmTarget(null);
    try {
      const data = await api(`/api/users/search/profile?username=${encodeURIComponent(username)}`, { token });
      setProfileUser(data.profile);
    } catch (error) {
      notify(error.message === "该用户不存在" ? "该用户不存在" : error.message, "danger");
    }
  }

  async function addProfileFriend(profile = profileUser) {
    if (!profile) return;
    try {
      const data = await api(`/api/social/friends/${profile.id}`, { method: "POST", token });
      applySocialData(data);
      setActiveTab("friends");
      setProfileUser(null);
      notify(`已将${profile.username}加为好友。`, "success");
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  async function addProfileBlacklist(profile = profileUser) {
    if (!profile) return;
    try {
      const data = await api(`/api/social/blacklist/${profile.id}`, { method: "POST", token });
      applySocialData(data);
      setActiveTab("blacklist");
      setProfileUser(null);
      notify(`已将${profile.username}加入黑名单。`, "success");
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  function handleSearchInput(value) {
    setSearchUsername(value.replace(SEARCH_USERNAME_DISALLOWED, "").slice(0, SEARCH_USERNAME_MAX_LENGTH));
  }

  async function removeTarget(target = confirmTarget) {
    if (!target) return;
    const path = target.type === "friend" ? "friends" : "blacklist";
    const data = await api(`/api/social/${path}/${target.user.id}`, { method: "DELETE", token });
    applySocialData(data);
    setConfirmTarget(null);
    setActionTarget(null);
  }

  function requestMatch(row) {
    if (row.status !== "online") return;
    socket?.emit("duel:request", { targetUserId: row.id });
    setActionTarget(null);
  }

  function notify(text, tone = "danger") {
    onNotice?.(text, tone);
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
          <div className="friends-modal-toolbar">
            <div className="friends-tabs" role="tablist" aria-label="好友列表分类">
              <button className={activeTab === "friends" ? "active" : ""} type="button" onClick={() => setActiveTab("friends")}>好友</button>
              <button className={activeTab === "blacklist" ? "active" : ""} type="button" onClick={() => setActiveTab("blacklist")}>黑名单</button>
            </div>
            <form className="friend-search" onSubmit={(event) => {
              event.preventDefault();
              searchProfile();
            }}>
              <input
                value={searchUsername}
                maxLength={SEARCH_USERNAME_MAX_LENGTH}
                placeholder="输入用户名"
                aria-label="搜索用户名"
                onChange={(event) => handleSearchInput(event.target.value)}
              />
              <button type="submit" title="搜索用户" aria-label="搜索用户"><Search size={18} /></button>
            </form>
          </div>
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
                      <img src={resolveCandyPortrait(character, row.itemEffects)} alt={character.name} />
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
              onAddFriend={addProfileFriend}
              onAddBlacklist={addProfileBlacklist}
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
