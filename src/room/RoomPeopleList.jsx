import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { COLORS } from "../shared/game.js";
import { useSocialRelations } from "../social/useSocialRelations.js";
import { roomPeople } from "./roomView.js";
import { ConfirmPanel, UserProfileCard } from "../modals/UserProfileCard.jsx";

export default function RoomPeopleList({ room, user, characters, token, onOpenReplay }) {
  const [activeId, setActiveId] = useState("");
  const [profileUser, setProfileUser] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [error, setError] = useState("");
  const panelRef = useRef(null);
  const people = useMemo(() => roomPeople(room), [room]);
  const {
    blacklistIds,
    friendIds,
    loadProfile,
    refreshSocial,
    updateBlacklist,
    updateFriend
  } = useSocialRelations({
    token,
    onError: (apiError) => setError(apiError.message)
  });

  useEffect(() => {
    if (!token) return;
    refreshSocial();
  }, [refreshSocial, token]);

  useEffect(() => {
    if (!activeId) return;
    const close = (event) => {
      if (!panelRef.current?.contains(event.target)) setActiveId("");
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [activeId]);

  async function openProfile(person) {
    setActiveId("");
    setConfirmTarget(null);
    try {
      setProfileUser(await loadProfile(person.userId));
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function toggleBlacklist(person) {
    if (friendIds.has(person.userId)) return;
    const blocked = blacklistIds.has(person.userId);
    const method = blocked ? "DELETE" : "POST";
    await updateBlacklist(person.userId, method);
    setActiveId("");
  }

  async function addProfileBlacklist(profile) {
    if (!profile) return;
    await updateBlacklist(profile.id, "POST");
    setProfileUser({ ...profile, relation: "blacklist" });
  }

  function confirmFriendRemoval(person) {
    setActiveId("");
    setProfileUser(null);
    setConfirmTarget({ type: "friend", user: person });
  }

  async function addFriend(person) {
    await updateFriend(person.userId, "POST");
    setActiveId("");
  }

  async function addProfileFriend(profile) {
    if (!profile) return;
    await updateFriend(profile.id, "POST");
    setProfileUser({ ...profile, relation: "friend" });
  }

  async function removeFriend(person) {
    await updateFriend(person.userId, "DELETE");
    setConfirmTarget(null);
    setActiveId("");
  }

  return (
    <section className="room-people" ref={panelRef}>
      <strong>房间成员</strong>
      {error && <p className="room-people-error">{error}</p>}
      <div className="room-people-table">
        {people.map((person) => {
          const isSelf = person.userId === user?.id;
          const isFriend = friendIds.has(person.userId);
          const isBlocked = blacklistIds.has(person.userId);
          const relationClass = isSelf ? "self" : isBlocked ? "blocked" : isFriend ? "friend" : "";
          const connectionClass = person.role === "player" && person.connected === false ? "disconnected" : "";
          return (
            <div className="room-person-wrap" key={person.id}>
              <button className={`room-person ${person.role} ${relationClass} ${connectionClass}`} type="button" onClick={() => setActiveId((id) => id === person.id ? "" : person.id)}>
                <span className="room-person-name">
                  {person.color && <i className={`room-color-dot ${person.color}`} aria-label={person.color === COLORS.black ? "执黑" : "执白"} />}
                  {person.username}
                </span>
                <span>{person.rank}</span>
                <span>{person.rating}分</span>
              </button>
              {activeId === person.id && (
                <div className="room-person-popover">
                  <button type="button" onClick={() => openProfile(person)}>详细信息</button>
                  <button type="button" disabled={isSelf} onClick={() => isFriend ? confirmFriendRemoval(person) : addFriend(person)}>
                    {isFriend ? "解除好友" : "加好友"}
                  </button>
                  <button type="button" disabled={isSelf || isFriend} onClick={() => toggleBlacklist(person)}>
                    {isBlocked ? "从黑名单解除" : "加入黑名单"}
                  </button>
                  <button type="button">密谈</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {profileUser && (
        <div className="modal-backdrop room-overlay-backdrop" onClick={() => setProfileUser(null)}>
          <section className="room-floating-modal user-profile-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setProfileUser(null)}><X size={18} /></button>
            <UserProfileCard
              user={profileUser}
              characters={characters}
              token={token}
              replayDisabled
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
        <div className="modal-backdrop room-overlay-backdrop" onClick={() => setConfirmTarget(null)}>
          <section className="room-floating-modal confirm-inline-modal" onClick={(event) => event.stopPropagation()}>
            <ConfirmPanel
              message={`确定解除${confirmTarget.user.username}好友吗？`}
              onConfirm={() => removeFriend(confirmTarget.user)}
              onCancel={() => setConfirmTarget(null)}
            />
          </section>
        </div>
      )}
    </section>
  );
}
