import WindowTitleSticker from "./WindowTitleSticker.jsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { api } from "../api/client.js";
import { useSocialRelations } from "../social/useSocialRelations.js";
import FriendsList from "./friends/FriendsList.jsx";
import FriendsOverlays from "./friends/FriendsOverlays.jsx";
import FriendsToolbar from "./friends/FriendsToolbar.jsx";
import { normalizeFriendSearchInput } from "./friends/friendSearch.js";
import { ModalDialog } from "./modalComponents.jsx";

export default function FriendsModal({ token, socket, characters, onNotice, onClose, onOpenReplay }) {
  const [activeTab, setActiveTab] = useState("friends");
  const [actionTarget, setActionTarget] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [duelModeTarget, setDuelModeTarget] = useState(null);
  const [searchUsername, setSearchUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [removalPending, setRemovalPending] = useState(false);
  const removalRequestRef = useRef(false);
  const overlayReturnFocusRef = useRef(null);
  const closeButtonRef = useRef(null);
  const overlayOpenRef = useRef(false);
  const notify = useCallback((text, tone = "danger") => {
    onNotice?.(text, tone);
  }, [onNotice]);
  const {
    blacklist,
    friends,
    loadProfile,
    refreshSocial: loadSocialRelations,
    updateBlacklist,
    updateFriend
  } = useSocialRelations({
    token,
    onError: (error) => notify(error.message, "danger")
  });
  const rows = activeTab === "friends" ? friends : blacklist;
  const actionRow = actionTarget?.row;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadSocialRelations().finally(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, [loadSocialRelations]);

  useEffect(() => {
    const overlayOpen = Boolean(confirmTarget || duelModeTarget || profileUser);
    if (overlayOpenRef.current && !overlayOpen) {
      const target = overlayReturnFocusRef.current;
      (target?.isConnected ? target : closeButtonRef.current)?.focus();
    }
    overlayOpenRef.current = overlayOpen;
  }, [confirmTarget, duelModeTarget, profileUser]);

  useEffect(() => {
    if (!socket) return undefined;
    const sent = ({ target }) => notify(`已向${target.username}发送对局申请。`, "success");
    socket.on("duel:sent", sent);
    return () => {
      socket.off("duel:sent", sent);
    };
  }, [notify, socket]);

  async function openProfile(row) {
    setActionTarget(null);
    setConfirmTarget(null);
    try {
      setProfileUser(await loadProfile(row.id));
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  async function searchProfile() {
    const username = searchUsername.trim();
    if (!username) return;
    if (username.length < 2) {
      notify("用户名需为 2-8 位", "danger");
      return;
    }
    overlayReturnFocusRef.current = document.activeElement;
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
      await updateFriend(profile.id, "POST");
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
      await updateBlacklist(profile.id, "POST");
      setActiveTab("blacklist");
      setProfileUser(null);
      notify(`已将${profile.username}加入黑名单。`, "success");
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  function handleSearchInput(value) {
    setSearchUsername(normalizeFriendSearchInput(value));
  }

  async function removeTarget(target = confirmTarget) {
    if (!target || removalRequestRef.current) return;
    removalRequestRef.current = true;
    setRemovalPending(true);
    try {
      if (target.type === "friend") await updateFriend(target.user.id, "DELETE");
      else await updateBlacklist(target.user.id, "DELETE");
      setConfirmTarget((current) => current === target ? null : current);
      setActionTarget((current) => current?.row?.id === target.user.id ? null : current);
    } catch (error) {
      notify(error.message, "danger");
    } finally {
      removalRequestRef.current = false;
      setRemovalPending(false);
    }
  }

  function requestMatch(row) {
    if (row.status !== "online") return;
    setDuelModeTarget(row);
    setActionTarget(null);
  }

  function requestMatchMode(mode) {
    if (!duelModeTarget) return;
    socket?.emit("duel:request", { targetUserId: duelModeTarget.id, mode });
    setDuelModeTarget(null);
  }

  function openConfirm(type, user) {
    setActionTarget(null);
    setProfileUser(null);
    setConfirmTarget({ type, user });
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <ModalDialog className="friends-modal window-sticker-host window-bookmark-host" ariaLabelledBy="friends-modal-title" onClose={onClose} onClick={(event) => event.stopPropagation()}>
          <button ref={closeButtonRef} className="close-button friends-modal-close" type="button" onClick={onClose} aria-label="关闭好友窗口">
            <X size={20} />
          </button>
          <header className="friends-modal-header window-sticker-header">
            <WindowTitleSticker titleKey="friends" id="friends-modal-title" />
          </header>
          <FriendsToolbar
            activeTab={activeTab}
            searchUsername={searchUsername}
            onSearchInput={handleSearchInput}
            onSearchSubmit={searchProfile}
            onTabChange={setActiveTab}
          />
          <FriendsList
            actionRow={actionRow}
            activeTab={activeTab}
            characters={characters}
            loading={loading}
            rows={rows}
            onOpenConfirm={openConfirm}
            onOpenProfile={openProfile}
            onRequestMatch={requestMatch}
            onToggleAction={(row) => {
              overlayReturnFocusRef.current = document.activeElement;
              setActionTarget((current) => current?.row?.id === row.id ? null : { row });
            }}
          />
        </ModalDialog>
      </div>
      <FriendsOverlays
        characters={characters}
        confirmTarget={confirmTarget}
        duelModeTarget={duelModeTarget}
        profileUser={profileUser}
        removalPending={removalPending}
        token={token}
        onAddBlacklist={addProfileBlacklist}
        onAddFriend={addProfileFriend}
        onCloseConfirm={() => setConfirmTarget(null)}
        onCloseDuelMode={() => setDuelModeTarget(null)}
        onCloseProfile={() => setProfileUser(null)}
        onNotice={notify}
        onRequestMatchMode={requestMatchMode}
        onOpenReplay={(recordId) => {
          setProfileUser(null);
          onOpenReplay?.(recordId);
        }}
        onRemoveTarget={() => removeTarget()}
      />
    </>
  );
}
