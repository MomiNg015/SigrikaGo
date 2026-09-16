import { HouseManualEntry, MatchEntry } from "./HomeImageEntries.jsx";
import HomeUtilityDock from "./HomeUtilityDock.jsx";
import PlayerPlaque from "./PlayerPlaque.jsx";

export default function HomeStage({
  selectedCharacter,
  user,
  sigrikaCorrupted = false,
  recruitmentReady,
  onOpenFriends,
  onOpenRecruitment,
  onOpenHouse,
  onOpenResume,
  onOpenLeaderboard,
  onOpenShop,
  onOpenWarehouse,
  onOpenWatch,
  onPreloadPlayableReady,
  onStartMatch
}) {
  return (
    <section className="home-grid-featured home-stage home-terminal-stage home-stage-with-student-id">
      <PlayerPlaque character={selectedCharacter} user={user} onOpenResume={onOpenResume} disabled={sigrikaCorrupted} />
      <HouseManualEntry sigrikaCorrupted={sigrikaCorrupted} onOpenHouse={onOpenHouse} />
      <MatchEntry sigrikaCorrupted={sigrikaCorrupted} onStartMatch={onStartMatch} onPreloadPlayableReady={onPreloadPlayableReady} />
      <HomeUtilityDock
        disabled={sigrikaCorrupted}
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
