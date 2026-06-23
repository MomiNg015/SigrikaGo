import { useState } from "react";
import { LogOut, Mail, Menu, MessageSquareText, Settings } from "lucide-react";

export default function HomeHeader({
  isAdmin,
  onlineCount,
  siteTitle,
  mailboxBadgeCount = 0,
  onLogout,
  onOpenAdmin,
  onOpenMailbox,
  onOpenMessageBoard,
  onOpenSettings
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mailboxCount = Math.max(0, Math.floor(Number(mailboxBadgeCount) || 0));
  const mailboxLabel = mailboxCount > 0 ? `打开邮箱，${mailboxCount}封未处理邮件` : "打开邮箱";
  const closeMobileMenu = (action) => () => {
    setMobileMenuOpen(false);
    action?.();
  };

  return (
    <header className="home-top-strip home-terminal-header">
      <div className="home-top-brand">
        <span className="home-brand-title">{siteTitle}</span>
        <span className="home-brand-subtitle">连罗伊人的都爱玩的智力游戏</span>
      </div>
      <span className="home-online-tag">在线人数：{onlineCount}</span>
      <div className="topbar-actions">
        <button className="icon-button mailbox-action" aria-label={mailboxLabel} title="邮箱" onClick={onOpenMailbox}>
          <Mail size={20} />
          {mailboxCount > 0 && <span className="mailbox-badge">{mailboxCount}</span>}
        </button>
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
      <div className={`home-mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <button
          className="icon-button home-mobile-menu-toggle"
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-controls="home-mobile-menu-panel"
          title="选项"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <Menu size={21} />
        </button>
        <div className="home-mobile-menu-panel" id="home-mobile-menu-panel" aria-hidden={!mobileMenuOpen}>
          <button className="home-mobile-mailbox-action" type="button" onClick={closeMobileMenu(onOpenMailbox)}>
            <Mail size={18} />
            邮箱
            {mailboxCount > 0 && <span className="mailbox-badge">{mailboxCount}</span>}
          </button>
          <button type="button" onClick={closeMobileMenu(onOpenMessageBoard)}>
            <MessageSquareText size={18} />
            留言
          </button>
          <button type="button" onClick={closeMobileMenu(onOpenSettings)}>
            <Settings size={18} />
            设置
          </button>
          {isAdmin && (
            <button type="button" onClick={closeMobileMenu(onOpenAdmin)}>
              <Settings size={18} />
              后台
            </button>
          )}
          <button type="button" onClick={closeMobileMenu(onLogout)}>
            <LogOut size={18} />
            退出
          </button>
        </div>
      </div>
    </header>
  );
}
