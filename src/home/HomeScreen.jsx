import { Eye, LogOut, Settings, ShoppingBag, Sparkles, Swords, Trophy, UserRound } from "lucide-react";
import { CHARACTERS } from "../shared/characters.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";

export default function HomeScreen({ user, characters, siteSettings = DEFAULT_SITE_SETTINGS, onLogout, onStartMatch, onOpenHouse, onOpenLeaderboard, onOpenWatch, onOpenShop, onOpenSettings, onOpenAdmin }) {
  const selectedCharacter = characters[user.selectedCharacter] ?? CHARACTERS[user.selectedCharacter] ?? CHARACTERS.sigrika;

  return (
    <main className="home-screen">
      <header className="topbar">
        <div>
          <p>{siteSettings.homeSubtitle}</p>
          <h1>{siteSettings.homeTitle}</h1>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" title="设置" onClick={onOpenSettings}><Settings size={20} /></button>
          <button className="icon-button" title="退出登录" onClick={onLogout}><LogOut size={20} /></button>
        </div>
      </header>
      <section className="home-grid-featured">
        <section className="home-match-feature">
          <div className="match-feature-copy">
            <Swords size={34} />
            <div>
              <h2>空想对局</h2>
              <p className="quiet-text">13路，中国数子规则，黑贴2又3/4子。</p>
            </div>
          </div>
          <button className="match-button match-button-large" onClick={onStartMatch}>
            <Sparkles size={24} />
            开始匹配
          </button>
        </section>
        <button className="home-entry house-entry house-entry-secondary" onClick={onOpenHouse}>
          <div className="entry-copy">
            <UserRound size={30} />
            <strong>棋舍</strong>
            <span>{user.username} · {user.rank} · {user.rating}分</span>
          </div>
          <img className="entry-portrait" src={selectedCharacter.portrait} alt="出战角色" />
        </button>
        <div className={user.role === "admin" ? "home-utility-grid home-utility-grid-admin" : "home-utility-grid"}>
          <button className="home-entry utility-entry watch-entry" onClick={onOpenWatch} title="观战">
            <Eye size={28} />
            <strong>观战</strong>
            <span>输入5位房间号进入观战席</span>
          </button>
          <button className="home-entry utility-entry leaderboard-entry" onClick={onOpenLeaderboard} title="排行榜">
            <Trophy size={28} />
            <strong>排行榜</strong>
            <span>积分、胜负与常用角色</span>
          </button>
          <button className="home-entry utility-entry shop-entry" onClick={onOpenShop} title="商城">
            <ShoppingBag size={28} />
            <strong>商城</strong>
            <span>角色、物品、装饰即将开放</span>
          </button>
          {user.role === "admin" && (
            <button className="home-entry utility-entry admin-entry" onClick={onOpenAdmin} title="后台管理">
              <Settings size={30} />
              <strong>后台管理</strong>
              <span>用户、角色与系统配置</span>
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
