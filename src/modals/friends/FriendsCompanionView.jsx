import { ChevronRight, Swords } from "lucide-react";
import WindowLoadingState from "../WindowLoadingState.jsx";
import WindowEmptyState from "../WindowEmptyState.jsx";
import { CHARACTERS } from "../../shared/characters.js";
import { characterPortraitImageProps } from "../../shared/characterPortraits.js";
import { findCharacter } from "../../shared/characterDisplay.js";
import UserIdentity from "../../shared/UserIdentity.jsx";

const STATUS_LABELS = { online: "在线", offline: "离线", playing: "对局中" };

function FriendStatus({ row }) {
  return <span className={`fc-status fc-status-${row.status}`}><i aria-hidden="true" />{STATUS_LABELS[row.status] ?? "离线"}</span>;
}

function FriendPortrait({ row, characters, full = false }) {
  const character = findCharacter(characters, row.characterId) ?? CHARACTERS.sigrika;
  return <img
    {...characterPortraitImageProps(character, { variant: full ? "full" : "avatar", itemEffects: row.itemEffects, user: row })}
    className={full ? "fc-portrait-full" : "fc-avatar"}
    alt={character.name}
  />;
}

export default function FriendsCompanionView({ activeTab, characters, loading, rows, selectedRow, onSelect, onOpenConfirm, onOpenProfile, onRequestMatch }) {
  if (loading) return <div className="fc-empty"><WindowLoadingState>加载中...</WindowLoadingState></div>;
  if (!rows.length) return <div className="fc-empty"><WindowEmptyState>{activeTab === "friends" ? "暂无好友" : "暂无黑名单"}</WindowEmptyState></div>;

  return <div className="fc-layout">
    <div className="fc-roster" role="group" aria-label={activeTab === "friends" ? "好友名单" : "黑名单名单"}>
      {rows.map((row) => <button
        type="button"
        className="fc-person"
        key={row.id}
        aria-label={`选择 ${row.username}，${STATUS_LABELS[row.status] ?? "离线"}`}
        aria-pressed={selectedRow?.id === row.id}
        onClick={() => onSelect(row)}
      >
        <FriendPortrait row={row} characters={characters} />
        <span className="fc-identity"><UserIdentity user={row} compact /><FriendStatus row={row} /></span>
        <ChevronRight className="fc-chevron" size={17} aria-hidden="true" />
      </button>)}
    </div>
    {selectedRow && <aside className="fc-detail" key={selectedRow.id} aria-label={`${selectedRow.username}的操作`}>
      <div className="fc-art"><FriendPortrait row={selectedRow} characters={characters} full /></div>
      <div className="fc-caption"><UserIdentity user={selectedRow} compact /><FriendStatus row={selectedRow} /></div>
      <div className="fc-actions">
        {activeTab === "friends" && <button type="button" className="fc-duel" data-button-role="primary" disabled={selectedRow.status !== "online"}
          title={selectedRow.status === "online" ? "对局申请" : selectedRow.status === "playing" ? "对方正在对局" : "对方暂不在线"}
          onClick={() => { if (selectedRow.status === "online") onRequestMatch(selectedRow); }}><Swords size={17} aria-hidden="true" />对局申请</button>}
        <button type="button" className="fc-profile" data-button-role="tool" onClick={() => onOpenProfile(selectedRow)}>详细信息</button>
        <button type="button" className="fc-remove" data-button-role="danger" onClick={() => onOpenConfirm(activeTab === "friends" ? "friend" : "blacklist", selectedRow)}>{activeTab === "friends" ? "解除好友" : "从黑名单解除"}</button>
      </div>
    </aside>}
  </div>;
}
