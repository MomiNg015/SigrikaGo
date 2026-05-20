import { Eye, LogOut, MessageSquareText, Settings, ShoppingBag, Sparkles, Swords, Trophy, UserRound } from "lucide-react";
import { CHARACTERS } from "../shared/characters.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";

export default function HomeScreen({ user, characters, siteSettings = DEFAULT_SITE_SETTINGS, onLogout, onStartMatch, onOpenHouse, onOpenLeaderboard, onOpenWatch, onOpenShop, onOpenSettings, onOpenMessageBoard, onOpenAdmin }) {
  const selectedCharacter = characters[user.selectedCharacter] ?? CHARACTERS[user.selectedCharacter] ?? CHARACTERS.sigrika;
  const plaqueStyle = { "--plaque-color": selectedCharacter.palette ?? "#5d7fe8" };

  return (
    <main className="home-screen">
      <header className="topbar">
        <div className="home-title-lockup">
          <p>{siteSettings.homeSubtitle}</p>
          <h1>{siteSettings.homeTitle}</h1>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" title="留言板" onClick={onOpenMessageBoard}><MessageSquareText size={20} /></button>
          <button className="icon-button" title="设置" onClick={onOpenSettings}><Settings size={20} /></button>
          <button className="icon-button" title="退出登录" onClick={onLogout}><LogOut size={20} /></button>
        </div>
      </header>
      <section className="home-player-plaque" aria-label="当前用户铭牌" style={plaqueStyle}>
        <div className="plaque-avatar">
          <img src={selectedCharacter.portrait} alt="当前出战角色" />
        </div>
        <strong>{user.username}</strong>
        <div className="plaque-stats">
          <span>{user.rank}</span>
          <span>{user.rating}分</span>
        </div>
      </section>
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
          <button className="home-entry utility-entry shop-entry" onClick={onOpenShop} title="商店">
            <ShoppingBag size={28} />
            <strong>商店</strong>
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
