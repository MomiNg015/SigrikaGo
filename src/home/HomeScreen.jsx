import { CHARACTERS } from "../shared/characters.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import HomeFooter from "./components/HomeFooter.jsx";
import HomeHeader from "./components/HomeHeader.jsx";
import HomeStage from "./components/HomeStage.jsx";

export default function HomeScreen({ user, characters, siteSettings = DEFAULT_SITE_SETTINGS, lobbyStats = {}, onLogout, onStartMatch, onOpenHouse, onOpenWarehouse, onOpenLeaderboard, onOpenWatch, onOpenShop, onOpenFriends, onOpenSettings, onOpenMessageBoard, onOpenAdmin }) {
  const selectedCharacter = characters[user.selectedCharacter] ?? CHARACTERS[user.selectedCharacter] ?? CHARACTERS.sigrika;
  const onlineCount = Number(lobbyStats.onlineCount ?? 0);
  const matchmakingCount = Number(lobbyStats.matchmakingCount ?? 0);

  return (
    <main className="home-screen home-terminal-screen">
      <HomeHeader
        isAdmin={user.role === "admin"}
        onlineCount={onlineCount}
        siteTitle={siteSettings.homeTitle}
        onLogout={onLogout}
        onOpenAdmin={onOpenAdmin}
        onOpenMessageBoard={onOpenMessageBoard}
        onOpenSettings={onOpenSettings}
      />

      <section className="home-main-panel home-terminal-main">
        <HomeStage
          matchmakingCount={matchmakingCount}
          selectedCharacter={selectedCharacter}
          user={user}
          onOpenFriends={onOpenFriends}
          onOpenHouse={onOpenHouse}
          onOpenLeaderboard={onOpenLeaderboard}
          onOpenShop={onOpenShop}
          onOpenWarehouse={onOpenWarehouse}
          onOpenWatch={onOpenWatch}
          onStartMatch={onStartMatch}
        />
      </section>

      <section className="home-orientation-guard" aria-label="横屏提示">
        <h2>请横屏使用</h2>
        <p>星炬学院围棋部需要横屏才能完整显示棋局入口和部员手册。</p>
      </section>

      <HomeFooter siteTitle={siteSettings.homeTitle} />
    </main>
  );
}
