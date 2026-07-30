import { useState } from "react";
import { CircleHelp, LogOut, Mail, Menu, MessageSquareText, Newspaper, Settings, UsersRound } from "lucide-react";

export default function HomeHeader({
  isAdmin,
  onlineCount,
  siteTitle,
  siteVersion,
  mailboxBadgeCount = 0,
  announcementUnread = false,
  onLogout,
  onOpenAdmin,
  onOpenAnnouncements,
  onOpenMailbox,
  onOpenMessageBoard,
  onOpenOnboardingStory,
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
        <span className="home-brand-title text-window-title">{siteTitle}</span>
        {siteVersion && (
          <span className="home-brand-version home-brand-subtitle text-display-accent">{siteVersion}</span>
        )}
      </div>
      <span className="home-online-tag" aria-label={`在线人数 ${onlineCount}`}>
        <UsersRound size={16} aria-hidden="true" />
        <b>{onlineCount}</b>
      </span>
      <div className="topbar-actions">
        <button
          className={`icon-button announcement-action ${announcementUnread ? "has-unread" : ""}`}
          type="button"
          aria-label={announcementUnread ? "打开公告，有未读内容" : "打开公告"}
          title="公告"
          onClick={onOpenAnnouncements}
        >
          <Newspaper size={20} />
          {announcementUnread && <span className="announcement-badge-dot" />}
        </button>
        <button className="icon-button mailbox-action" type="button" aria-label={mailboxLabel} title="邮箱" onClick={onOpenMailbox}>
          <Mail size={20} />
          {mailboxCount > 0 && <span className="mailbox-badge">{mailboxCount}</span>}
        </button>
        <button className="icon-button onboarding-action" type="button" aria-label="打开新手引导" title="引导" onClick={onOpenOnboardingStory}>
          <CircleHelp size={20} />
        </button>
        <button className="icon-button" type="button" aria-label="打开留言板" title="留言板" onClick={onOpenMessageBoard}><MessageSquareText size={20} /></button>
        <button className="icon-button" type="button" aria-label="打开设置" title="设置" onClick={onOpenSettings}><Settings size={20} /></button>
        {isAdmin && (
          <button className="icon-button admin-nav-action" type="button" aria-label="打开后台管理" title="后台管理" onClick={onOpenAdmin}>
            <Settings size={22} />
            <span>后台管理</span>
          </button>
        )}
        <button className="icon-button" type="button" aria-label="退出登录" title="退出登录" onClick={onLogout}><LogOut size={20} /></button>
      </div>
      <div className={`home-mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <button
          className="icon-button home-mobile-menu-toggle"
          type="button"
          aria-label={mobileMenuOpen ? "关闭首页菜单" : "打开首页菜单"}
          aria-expanded={mobileMenuOpen}
          aria-controls="home-mobile-menu-panel"
          title="选项"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <Menu size={21} />
        </button>
        <div className="home-mobile-menu-panel" id="home-mobile-menu-panel" aria-hidden={!mobileMenuOpen}>
          <button className={`home-mobile-announcement-action ${announcementUnread ? "has-unread" : ""}`} type="button" onClick={closeMobileMenu(onOpenAnnouncements)}>
            <Newspaper size={18} />
            公告
            {announcementUnread && <span className="announcement-badge-dot" />}
          </button>
          <button className="home-mobile-mailbox-action" type="button" onClick={closeMobileMenu(onOpenMailbox)}>
            <Mail size={18} />
            邮箱
            {mailboxCount > 0 && <span className="mailbox-badge">{mailboxCount}</span>}
          </button>
          <button className="home-mobile-onboarding-action" type="button" aria-label="打开新手引导" onClick={closeMobileMenu(onOpenOnboardingStory)}>
            <CircleHelp size={18} />
            引导
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
