import { X } from "lucide-react";
import { ConfirmPanel, UserProfileCard } from "../UserProfileCard.jsx";
import { ModalActionButton } from "../modalComponents.jsx";
import MatchModeRuleText from "../../home/MatchModeRuleText.jsx";
import { modeOrderedEntries } from "../../shared/gameModes.js";
import UserIdentity from "../../shared/UserIdentity.jsx";

export default function FriendsOverlays({
  characters,
  confirmTarget,
  duelModeTarget,
  profileUser,
  token,
  onAddBlacklist,
  onAddFriend,
  onCloseConfirm,
  onCloseDuelMode,
  onCloseProfile,
  onOpenReplay,
  onNotice,
  onRequestMatchMode,
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
              onNotice={onNotice}
            />
          </section>
        </div>
      )}
      {confirmTarget && (
        <div className="modal-backdrop profile-modal-backdrop" onClick={onCloseConfirm}>
          <section className="room-floating-modal confirm-inline-modal" onClick={(event) => event.stopPropagation()}>
            <ConfirmPanel
              message={confirmTarget.type === "friend" ? (
                <>确定解除<UserIdentity user={confirmTarget.user} compact />好友吗？</>
              ) : (
                <>确定将<UserIdentity user={confirmTarget.user} compact />从黑名单解除吗？</>
              )}
              onConfirm={onRemoveTarget}
              onCancel={onCloseConfirm}
            />
          </section>
        </div>
      )}
      {duelModeTarget && (
        <div className="modal-backdrop profile-modal-backdrop" onClick={onCloseDuelMode}>
          <section className="room-floating-modal match-mode-modal" onClick={(event) => event.stopPropagation()}>
            <h2>选择对弈模式</h2>
            <p className="quiet-text">向 <UserIdentity user={duelModeTarget} compact /> 发起对局申请</p>
            <div className="match-mode-options">
              {modeOrderedEntries().map((mode) => (
                <button className="match-mode-option" type="button" key={mode.id} onClick={() => onRequestMatchMode(mode.id)}>
                  <span className="match-mode-copy">
                    <strong>{mode.title}</strong>
                    <MatchModeRuleText rulesText={mode.rulesText} />
                  </span>
                </button>
              ))}
            </div>
            <ModalActionButton variant="secondary" type="button" onClick={onCloseDuelMode}>取消</ModalActionButton>
          </section>
        </div>
      )}
    </>
  );
}
