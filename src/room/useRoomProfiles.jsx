import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UserProfileCard } from "../modals/UserProfileCard.jsx";
import { ModalDialog } from "../modals/modalComponents.jsx";
import { useSocialRelations } from "../social/useSocialRelations.js";

export function useRoomProfiles({ roomKey, user, token, characters, onOpenReplay }) {
  const [selection, setSelection] = useState(null);
  const sequence = useRef(0);
  const { loadProfile, updateFriend, updateBlacklist } = useSocialRelations({ token });
  const close = useCallback(() => { sequence.current += 1; setSelection(null); }, []);
  useEffect(() => { close(); return () => { sequence.current += 1; }; }, [roomKey, token, close]);
  const openProfile = useCallback(async (person) => {
    if (!person?.id || person.isBot || !token) return;
    const request = ++sequence.current;
    setSelection({ person, pending: true });
    try {
      const profile = await loadProfile(person.id);
      if (request === sequence.current) setSelection({ person, profile: person.id === user?.id ? { ...profile, relation: "self" } : profile });
    } catch (error) {
      if (request === sequence.current) setSelection({ person, error: error.message });
    }
  }, [loadProfile, token, user?.id]);
  const layer = selection && createPortal(
    <div className="modal-backdrop profile-modal-backdrop room-overlay-backdrop" onClick={close}>
      {selection.profile ? <UserProfileCard
        key={selection.profile.id}
        titleStickers user={selection.profile} characters={characters} token={token}
        replayDisabled onClose={close} onOpenReplay={onOpenReplay}
        onAddFriend={(profile) => updateFriend(profile.id, "POST")}
        onRemoveFriend={(profile) => updateFriend(profile.id, "DELETE")}
        onAddBlacklist={(profile) => updateBlacklist(profile.id, "POST")}
        onRemoveBlacklist={(profile) => updateBlacklist(profile.id, "DELETE")}
      /> : <ModalDialog className="room-floating-modal room-profile-status" ariaLabel="用户详细信息" onClose={close} onClick={(event) => event.stopPropagation()}>
        <p role={selection.error ? "alert" : "status"}>{selection.error || "正在载入用户详细信息…"}</p>
        {selection.error && <button type="button" onClick={() => openProfile(selection.person)}>重试</button>}
        <button type="button" onClick={close}>关闭</button>
      </ModalDialog>}
    </div>, document.querySelector(".app-shell") ?? document.body
  );
  return { openProfile, profileLayer: layer };
}
