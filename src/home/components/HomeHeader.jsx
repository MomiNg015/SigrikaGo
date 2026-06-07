import { LogOut, MessageSquareText, Settings } from "lucide-react";

export default function HomeHeader({
  isAdmin,
  onlineCount,
  siteTitle,
  onLogout,
  onOpenAdmin,
  onOpenMessageBoard,
  onOpenSettings
}) {
  return (
    <header className="home-top-strip home-terminal-header">
      <div className="home-top-brand">
        <span className="home-brand-title">{siteTitle}</span>
        <span className="home-brand-subtitle">连罗伊人的都爱玩的智力游戏</span>
      </div>
      <span className="home-online-tag">在线人数：{onlineCount}</span>
      <span className="home-lobby-status">LOBBY_ROOM (•̀ᴗ•́)و</span>
      <div className="topbar-actions">
        <button className="icon-button" title="留言板" onClick={onOpenMessageBoard}><MessageSquareText size={20} /></button>
        <button className="icon-button" title="设置" onClick={onOpenSettings}><Settings size={20} /></button>
        {isAdmin && (
          <button className="icon-button admin-nav-action" title="后台管理" onClick={onOpenAdmin}>
            <Settings size={22} />
            <span>后台管理</span>
          </button>
        )}
        <button className="icon-button" title="退出登录" onClick={onLogout}><LogOut size={20} /></button>
      </div>
    </header>
  );
}
