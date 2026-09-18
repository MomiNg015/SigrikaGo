import { useLayoutEffect, useRef } from "react";
import { HouseManualEntry, MatchEntry } from "./HomeImageEntries.jsx";
import HomeUtilityDock from "./HomeUtilityDock.jsx";

export default function HomeStage({
  sigrikaCorrupted = false,
  recruitmentReady,
  onOpenFriends,
  onOpenRecruitment,
  onOpenHouse,
  onOpenLeaderboard,
  onOpenShop,
  onOpenWarehouse,
  onOpenWatch,
  onPreloadPlayableReady,
  onStartMatch
}) {
  const stageRef = useRef(null);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const board = stage?.parentElement;
    const plaque = board?.querySelector(".home-student-id-zone");
    const manual = stage?.querySelector(".house-manual-entry");
    const match = stage?.querySelector(".home-match-feature");
    if (!plaque || !manual || !match || typeof ResizeObserver === "undefined") return;

    const positionEntries = () => {
      if (window.innerWidth <= 768) {
        board.style.removeProperty("--home-student-id-left");
        manual.style.removeProperty("--home-manual-center-offset");
        return;
      }
      const boardBounds = board.getBoundingClientRect();
      const stageBounds = stage.getBoundingClientRect();
      const stageInset = Number.parseFloat(getComputedStyle(stage).paddingLeft) || 0;
      const compositionLeft = stageBounds.left - boardBounds.left + stageInset;
      board.style.setProperty("--home-student-id-left", `${Math.max(boardBounds.width * 0.08, compositionLeft)}px`);
      const plaqueBounds = plaque.getBoundingClientRect();
      const matchBounds = match.getBoundingClientRect();
      const manualBounds = manual.getBoundingClientRect();
      const currentOffset = Number.parseFloat(getComputedStyle(manual).translate) || 0;
      const originalCenter = manualBounds.left + manualBounds.width / 2 - currentOffset;
      const targetCenter = (plaqueBounds.right + matchBounds.left) / 2;
      manual.style.setProperty("--home-manual-center-offset", `${targetCenter - originalCenter}px`);
    };
    const observer = new ResizeObserver(positionEntries);
    [board, stage, plaque, manual, match].forEach((element) => observer.observe(element));
    window.addEventListener("resize", positionEntries);
    positionEntries();
    return () => {
      observer.disconnect();
      board.style.removeProperty("--home-student-id-left");
      window.removeEventListener("resize", positionEntries);
      manual.style.removeProperty("--home-manual-center-offset");
    };
  }, []);

  return (
    <section ref={stageRef} className="home-grid-featured home-stage home-terminal-stage home-stage-with-student-id">
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
