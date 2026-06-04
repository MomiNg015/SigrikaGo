import { X } from "lucide-react";
import { ConfirmPanel, UserProfileCard } from "../UserProfileCard.jsx";

export default function FriendsOverlays({
  characters,
  confirmTarget,
  profileUser,
  token,
  onAddBlacklist,
  onAddFriend,
  onCloseConfirm,
  onCloseProfile,
  onOpenReplay,
  onRemoveTarget
}) {
  return (
    <>
      {profileUser && (
        <div className="modal-backdrop profile-modal-backdrop" onClick={onCloseProfile}>
          <section className="room-floating-modal user-profile-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={onCloseProfile}><X size={20} /></button>
            <UserProfileCard
              user={profileUser}
              characters={characters}
              token={token}
              onAddFriend={onAddFriend}
              onAddBlacklist={onAddBlacklist}
              onOpenReplay={onOpenReplay}
            />
          </section>
        </div>
      )}
      {confirmTarget && (
        <div className="modal-backdrop profile-modal-backdrop" onClick={onCloseConfirm}>
          <section className="room-floating-modal confirm-inline-modal" onClick={(event) => event.stopPropagation()}>
            <ConfirmPanel
              message={confirmTarget.type === "friend" ? `确定解除${confirmTarget.user.username}好友吗？` : `确定将${confirmTarget.user.username}从黑名单解除吗？`}
              onConfirm={onRemoveTarget}
              onCancel={onCloseConfirm}
            />
          </section>
        </div>
      )}
    </>
  );
}
