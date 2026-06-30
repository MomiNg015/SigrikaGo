import React from "react";

export const ADMIN_TABS = ["overview", "operations", "users", "characters", "shop", "items", "decorations", "music", "gacha", "recruitment", "announcements", "onboarding", "mailbox", "achievements", "settings", "feedback", "reports", "audit"];

export const ADMIN_TAB_LABELS = {
  overview: "概况",
  operations: "运营分析",
  users: "用户管理",
  characters: "角色管理",
  shop: "商城管理",
  items: "道具管理",
  decorations: "装饰管理",
  music: "音乐管理",
  gacha: "扭蛋管理",
  recruitment: "招募配置",
  announcements: "公告管理",
  onboarding: "剧情教学",
  mailbox: "邮箱管理",
  achievements: "成就管理",
  settings: "系统设置",
  feedback: "留言反馈",
  reports: "用户举报",
  audit: "审计日志"
};

export default function AdminShell({ user, tab, setTab, onBack, error = "", children }) {
  return (
    <main className="admin-screen">
      <aside className="admin-sidebar">
        <strong>SigrikaGo Admin</strong>
        {ADMIN_TABS.map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {ADMIN_TAB_LABELS[item]}
          </button>
        ))}
        <button onClick={onBack}>返回大厅</button>
      </aside>
      <section className="admin-main">
        <header><span>{user.username}</span><strong>{ADMIN_TAB_LABELS[tab]}</strong></header>
        {error && <p className="form-error admin-error">{error}</p>}
        {children}
      </section>
    </main>
  );
}
