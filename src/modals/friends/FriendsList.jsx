import { Fragment } from "react";
import { Settings } from "lucide-react";
import { CHARACTERS } from "../../shared/characters.js";
import { resolveCandyPortrait } from "../../shared/candyPortraits.js";
import { findCharacter } from "../../shared/characterDisplay.js";

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
  if (loading) return <p className="quiet-text">加载中...</p>;

  return (
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
      {rows.length === 0 && <p className="quiet-text">暂无名单成员。</p>}
    </div>
  );
}

function FriendActionPanel({ activeTab, row, onOpenConfirm, onOpenProfile, onRequestMatch }) {
  return (
    <div className="friend-action-row">
      <button type="button" onClick={() => onOpenProfile(row)}>详细信息</button>
      {activeTab === "friends" ? (
        <>
          <button type="button">密谈</button>
          <button type="button" disabled={row.status !== "online"} onClick={() => onRequestMatch(row)}>对局申请</button>
          <button type="button" onClick={() => onOpenConfirm("friend", row)}>解除好友</button>
        </>
      ) : (
        <button type="button" onClick={() => onOpenConfirm("blacklist", row)}>从黑名单解除</button>
      )}
    </div>
  );
}
