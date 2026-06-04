import { Search } from "lucide-react";
import { SEARCH_USERNAME_MAX_LENGTH } from "./friendSearch.js";

export default function FriendsToolbar({
  activeTab,
  searchUsername,
  onSearchInput,
  onSearchSubmit,
  onTabChange
}) {
  return (
    <div className="friends-modal-toolbar">
      <div className="friends-tabs" role="tablist" aria-label="好友列表分类">
        <button className={activeTab === "friends" ? "active" : ""} type="button" onClick={() => onTabChange("friends")}>好友</button>
        <button className={activeTab === "blacklist" ? "active" : ""} type="button" onClick={() => onTabChange("blacklist")}>黑名单</button>
      </div>
      <form className="friend-search" onSubmit={(event) => {
        event.preventDefault();
        onSearchSubmit();
      }}>
        <input
          value={searchUsername}
          maxLength={SEARCH_USERNAME_MAX_LENGTH}
          placeholder="输入用户名"
          aria-label="搜索用户名"
          onChange={(event) => onSearchInput(event.target.value)}
        />
        <button type="submit" title="搜索用户" aria-label="搜索用户"><Search size={18} /></button>
      </form>
    </div>
  );
}
