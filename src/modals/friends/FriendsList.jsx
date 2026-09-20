import WindowLoadingState from "../WindowLoadingState.jsx";
import WindowEmptyState from "../WindowEmptyState.jsx";
import { Fragment } from "react";
import { Settings } from "lucide-react";
import { CHARACTERS } from "../../shared/characters.js";
import { characterPortraitImageProps } from "../../shared/characterPortraits.js";
import { findCharacter } from "../../shared/characterDisplay.js";
import UserIdentity from "../../shared/UserIdentity.jsx";

const STATUS_LABELS = {
  online: "在线",
  offline: "离线",
  playing: "对局中"
};

export default function FriendsList({
  actionRow,
  activeTab,
  characters,
  loading,
  rows,
  onOpenConfirm,
  onOpenProfile,
  onRequestMatch,
  onToggleAction
}) {
  if (loading) return <WindowLoadingState>加载中...</WindowLoadingState>;

  return (
    <div className="friends-list">
      {rows.map((row) => {
        const character = findCharacter(characters, row.characterId) ?? CHARACTERS.sigrika;
        return (
          <Fragment key={row.id}>
            <article className="friends-row">
              <span className={`online-status ${row.status}`}>{STATUS_LABELS[row.status]}</span>
              <img {...characterPortraitImageProps(character, { itemEffects: row.itemEffects, user: row })} alt={character.name} />
              <div className="friend-main">
                <strong className="friend-username">
                  <UserIdentity user={row} compact />
                </strong>
              </div>
              <div className="friend-actions-cell">
                <button
                  className="friend-gear-button"
                  type="button"
                  title="操作"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleAction(row);
                  }}
                >
                  <Settings size={18} />
                </button>
              </div>
            </article>
            {actionRow?.id === row.id && (
              <FriendActionPanel
                activeTab={activeTab}
                row={row}
                onOpenConfirm={onOpenConfirm}
                onOpenProfile={onOpenProfile}
                onRequestMatch={onRequestMatch}
              />
            )}
          </Fragment>
        );
      })}
      {rows.length === 0 && <WindowEmptyState>暂无名单成员。</WindowEmptyState>}
    </div>
  );
}

function FriendActionPanel({ activeTab, row, onOpenConfirm, onOpenProfile, onRequestMatch }) {
  return (
    <div className="friend-action-row">
      <button type="button" onClick={() => onOpenProfile(row)}>详细信息</button>
      {activeTab === "friends" ? (
        <>
          <button type="button" disabled={row.status !== "online"} onClick={() => onRequestMatch(row)}>对局申请</button>
          <button type="button" onClick={() => onOpenConfirm("friend", row)}>解除好友</button>
        </>
      ) : (
        <button type="button" onClick={() => onOpenConfirm("blacklist", row)}>从黑名单解除</button>
      )}
    </div>
  );
}
