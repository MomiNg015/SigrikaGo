import { HouseManualEntry, MatchEntry } from "./HomeImageEntries.jsx";
import HomeUtilityDock from "./HomeUtilityDock.jsx";
import PlayerPlaque from "./PlayerPlaque.jsx";

export default function HomeStage({
  matchmakingCount,
  selectedCharacter,
  user,
  onOpenFriends,
  onOpenHouse,
  onOpenLeaderboard,
  onOpenShop,
  onOpenWarehouse,
  onOpenWatch,
  onStartMatch
}) {
  return (
    <section className="home-grid-featured home-stage home-terminal-stage">
      <PlayerPlaque character={selectedCharacter} user={user} />
      <HouseManualEntry onOpenHouse={onOpenHouse} />
      <MatchEntry matchmakingCount={matchmakingCount} onStartMatch={onStartMatch} />
      <HomeUtilityDock
        onOpenFriends={onOpenFriends}
        onOpenLeaderboard={onOpenLeaderboard}
        onOpenShop={onOpenShop}
        onOpenWarehouse={onOpenWarehouse}
        onOpenWatch={onOpenWatch}
      />
    </section>
  );
}
