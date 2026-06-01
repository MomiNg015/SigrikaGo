import { Archive, Eye, LogOut, MessageSquareText, Settings, ShoppingBag, Trophy, UsersRound } from "lucide-react";
import { CHARACTERS } from "../shared/characters.js";
import { resolveCandyPortrait } from "../shared/candyPortraits.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";

export default function HomeScreen({ user, characters, siteSettings = DEFAULT_SITE_SETTINGS, lobbyStats = {}, onLogout, onStartMatch, onOpenHouse, onOpenWarehouse, onOpenLeaderboard, onOpenWatch, onOpenShop, onOpenFriends, onOpenSettings, onOpenMessageBoard, onOpenAdmin }) {
  const selectedCharacter = characters[user.selectedCharacter] ?? CHARACTERS[user.selectedCharacter] ?? CHARACTERS.sigrika;
  const plaqueStyle = { "--plaque-color": selectedCharacter.palette ?? "#5d7fe8" };
  const onlineCount = Number(lobbyStats.onlineCount ?? 0);
  const matchmakingCount = Number(lobbyStats.matchmakingCount ?? 0);

  return (
    <main className="home-screen">
      <header className="home-top-strip">
        <div className="home-top-brand">
          <span className="home-brand-title">{siteSettings.homeTitle}</span>
          <span className="home-brand-subtitle">连罗伊人的都爱玩的智力游戏</span>
        </div>
        <span className="home-online-tag">在线人数：{onlineCount}</span>
        <div className="topbar-actions">
          <button className="icon-button" title="留言板" onClick={onOpenMessageBoard}><MessageSquareText size={20} /></button>
          <button className="icon-button" title="设置" onClick={onOpenSettings}><Settings size={20} /></button>
          {user.role === "admin" && (
            <button className="icon-button admin-nav-action" title="后台管理" onClick={onOpenAdmin}>
              <Settings size={22} />
              <span>后台管理</span>
            </button>
          )}
          <button className="icon-button" title="退出登录" onClick={onLogout}><LogOut size={20} /></button>
        </div>
      </header>

      <section className="home-main-panel">
        <section className="home-grid-featured home-stage">
          <section className="home-player-zone" aria-label="当前用户与在线状态">
            <div className="home-player-row" style={plaqueStyle}>
              <section className="home-player-plaque" aria-label="当前用户铭牌">
                <div className="plaque-avatar">
                  <img src={resolveCandyPortrait(selectedCharacter, user.itemEffects)} alt="当前出战角色" />
                </div>
                <strong>{user.username}</strong>
                <div className="plaque-stats">
                  <span>{user.rank}</span>
                  <span>{user.rating}分</span>
                </div>
              </section>
            </div>
          </section>

          <button className="home-image-entry house-manual-entry" onClick={onOpenHouse} aria-label="部员手册">
            <img src="/assets/home/book-entry.png" alt="部员手册" decoding="async" />
          </button>

          <section className="home-match-feature" aria-label="空想对局入口">
            <button className="home-image-entry match-image-entry" onClick={onStartMatch} aria-describedby="matchmaking-count-popup">
              <img src="/assets/home/fantasy-match-entry.png" alt="空想对局" decoding="async" />
            </button>
            <div id="matchmaking-count-popup" className="matchmaking-popup" role="status" aria-label="匹配状态、规则与用时">
              <span>当前匹配人数：{matchmakingCount}</span>
              <span>路数：13路</span>
              <span>用时：5分钟30秒3次</span>
              <span>规则：黑贴2又3/4子，中国数子规则</span>
            </div>
          </section>

          <div className="home-utility-grid">
            <button className="home-entry utility-entry shop-entry" onClick={onOpenShop} title="商店">
              <ShoppingBag size={28} />
              <strong>商店</strong>
              <span>角色、物品、装饰即将开放</span>
            </button>
            <button className="home-entry utility-entry warehouse-entry" onClick={onOpenWarehouse} title="仓库">
              <Archive size={28} />
              <strong>仓库</strong>
              <span>查看并使用已经获得的道具</span>
            </button>
            <button className="home-entry utility-entry leaderboard-entry" onClick={onOpenLeaderboard} title="排行榜">
              <Trophy size={28} />
              <strong>排行榜</strong>
              <span>积分、胜负与常用角色</span>
            </button>
            <button className="home-entry utility-entry watch-entry" onClick={onOpenWatch} title="观战">
              <Eye size={28} />
              <strong>观战</strong>
              <span>输入5位房间号进入观战席</span>
            </button>
            <button className="home-entry utility-entry friends-entry" onClick={onOpenFriends} title="好友">
              <UsersRound size={28} />
              <strong>好友</strong>
              <span>好友与黑名单</span>
            </button>
          </div>
        </section>
      </section>

      <section className="home-orientation-guard" aria-label="横屏提示">
        <h2>请横屏使用</h2>
        <p>星炬学院围棋部需要横屏才能完整显示棋局入口和部员手册。</p>
      </section>

      <footer className="home-footer-strip">
        <span>{siteSettings.homeTitle}</span>
        <span>Copyright ©KURO GAMES. ALL RIGHTS RESERVED.</span>
        <span>浙ICP备2026035038号</span>
      </footer>
    </main>
  );
}
