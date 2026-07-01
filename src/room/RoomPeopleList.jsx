import { memo, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { COLORS } from "../shared/game.js";
import { useSocialRelations } from "../social/useSocialRelations.js";
import { roomPeople } from "./roomView.js";
import { ConfirmPanel, UserProfileCard } from "../modals/UserProfileCard.jsx";
import UserIdentity from "../shared/UserIdentity.jsx";

function RoomPeopleList({
  room,
  user,
  characters,
  token,
  onOpenReplay,
  floatingLayerZ,
  onFloatingLayerRequest
}) {
  const [activeMenu, setActiveMenu] = useState(null);
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
    if (!activeMenu) return;
    const close = (event) => {
      if (!panelRef.current?.contains(event.target)) setActiveMenu(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [activeMenu]);

  function openPersonMenu(personId, event) {
    onFloatingLayerRequest?.();
    setActiveMenu((current) => {
      if (current?.id === personId) return null;
      const width = 284;
      const minY = 150;
      const margin = 12;
      const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth;
      const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;
      const x = viewportWidth > 0 ? Math.min(event.clientX, Math.max(margin, viewportWidth - width - margin)) : event.clientX;
      const y = viewportHeight > 0 ? Math.min(Math.max(event.clientY, minY), viewportHeight - margin) : event.clientY;
      return { id: personId, x, y };
    });
  }

  async function openProfile(person) {
    setActiveMenu(null);
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
    setActiveMenu(null);
  }

  async function addProfileBlacklist(profile) {
    if (!profile) return;
    await updateBlacklist(profile.id, "POST");
    setProfileUser({ ...profile, relation: "blacklist" });
  }

  function confirmFriendRemoval(person) {
    setActiveMenu(null);
    setProfileUser(null);
    setConfirmTarget({ type: "friend", user: person });
  }

  async function addFriend(person) {
    await updateFriend(person.userId, "POST");
    setActiveMenu(null);
  }

  async function addProfileFriend(profile) {
    if (!profile) return;
    await updateFriend(profile.id, "POST");
    setProfileUser({ ...profile, relation: "friend" });
  }

  async function removeFriend(person) {
    await updateFriend(person.userId, "DELETE");
    setConfirmTarget(null);
    setActiveMenu(null);
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
              <button className={`room-person ${person.role} ${relationClass} ${connectionClass}`} type="button" onClick={(event) => openPersonMenu(person.id, event)}>
                <span className="room-person-name">
                  {person.color && <i className={`room-color-dot ${person.color}`} aria-label={person.color === COLORS.black ? "执黑" : "执白"} />}
                  <UserIdentity user={person} compact />
                </span>
                <span>{person.rank}</span>
                <span className="text-rating-value">{person.rating}分</span>
              </button>
              {activeMenu?.id === person.id && (
                <div
                  className="room-person-popover"
                  style={{
                    "--room-person-popover-x": `${activeMenu.x}px`,
                    "--room-person-popover-y": `${activeMenu.y}px`,
                    ...(floatingLayerZ ? { "--room-floating-z": floatingLayerZ } : {})
                  }}
                  onPointerDownCapture={onFloatingLayerRequest}
                >
                  <button type="button" onClick={() => openProfile(person)}>详细信息</button>
                  <button type="button" disabled={isSelf} onClick={() => isFriend ? confirmFriendRemoval(person) : addFriend(person)}>
                    {isFriend ? "解除好友" : "加好友"}
                  </button>
                  <button type="button" disabled={isSelf || isFriend} onClick={() => toggleBlacklist(person)}>
                    {isBlocked ? "从黑名单解除" : "加入黑名单"}
                  </button>
                  <button type="button" disabled>密谈</button>
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
              message={<>确定解除<UserIdentity user={confirmTarget.user} compact />好友吗？</>}
              onConfirm={() => removeFriend(confirmTarget.user)}
              onCancel={() => setConfirmTarget(null)}
            />
          </section>
        </div>
      )}
    </section>
  );
}

export function areRoomPeopleListPropsEqual(previous, next) {
  return sameRoomPeopleSource(previous.room, next.room)
    && previous.user?.id === next.user?.id
    && previous.characters === next.characters
    && previous.token === next.token
    && previous.onOpenReplay === next.onOpenReplay
    && previous.floatingLayerZ === next.floatingLayerZ
    && previous.onFloatingLayerRequest === next.onFloatingLayerRequest;
}

function sameRoomPeopleSource(previousRoom, nextRoom) {
  return previousRoom?.code === nextRoom?.code
    && samePeoplePlayers(previousRoom?.players, nextRoom?.players)
    && samePeopleUsers(previousRoom?.spectators, nextRoom?.spectators);
}

function samePeoplePlayers(previous = [], next = []) {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  return previous.every((player, index) => (
    player?.color === next[index]?.color
    && player?.connected === next[index]?.connected
    && samePeopleUser(player?.user, next[index]?.user)
  ));
}

function samePeopleUsers(previous = [], next = []) {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  return previous.every((entry, index) => samePeopleUser(entry?.user, next[index]?.user));
}

function samePeopleUser(previous, next) {
  return previous?.id === next?.id
    && previous?.username === next?.username
    && previous?.rank === next?.rank
    && previous?.rating === next?.rating
    && previous?.achievementEquipment === next?.achievementEquipment
    && previous?.achievementEquipmentAssets === next?.achievementEquipmentAssets;
}

export default memo(RoomPeopleList, areRoomPeopleListPropsEqual);
