import { HouseManualEntry, MatchEntry } from "./HomeImageEntries.jsx";
import HomeUtilityDock from "./HomeUtilityDock.jsx";
import PlayerPlaque from "./PlayerPlaque.jsx";

export default function HomeStage({
  selectedCharacter,
  user,
  recruitmentReady,
  onOpenFriends,
  onOpenRecruitment,
  onOpenHouse,
  onOpenResume,
  onOpenLeaderboard,
  onOpenShop,
  onOpenWarehouse,
  onOpenWatch,
  onStartMatch
}) {
  return (
    <section className="home-grid-featured home-stage home-terminal-stage">
      <PlayerPlaque character={selectedCharacter} user={user} onOpenResume={onOpenResume} />
      <HouseManualEntry onOpenHouse={onOpenHouse} />
      <MatchEntry onStartMatch={onStartMatch} />
      <HomeUtilityDock
        onOpenFriends={onOpenFriends}
        recruitmentReady={recruitmentReady}
        onOpenRecruitment={onOpenRecruitment}
        onOpenLeaderboard={onOpenLeaderboard}
        onOpenShop={onOpenShop}
        onOpenWarehouse={onOpenWarehouse}
        onOpenWatch={onOpenWatch}
      />
    </section>
  );
}
