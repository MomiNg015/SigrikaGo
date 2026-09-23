import { useEffect, useState } from "react";
import { Swords } from "lucide-react";
import { isPracticeRoom, practiceCaptureResignThreshold } from "../../shared/practiceMode.js";
import { colorTextForPlayer, secondsUntilTimestamp } from "./lifecycleHelpers.js";
import OpeningDuelPresentation from "./OpeningDuelPresentation.jsx";

export default function OpeningModal({ room, player, characters }) {
  const [now, setNow] = useState(Date.now());
  const [openingEndsAt] = useState(() => room.__openingEndsAt ?? room.openingEndsAt);
  const remaining = secondsUntilTimestamp(openingEndsAt ?? now, now);
  const colorText = colorTextForPlayer(player);
  const isSigrikaCandyDuel = Boolean(room.sigrikaCandyDuel);
  const practiceCaptureTarget = isPracticeRoom(room)
    ? practiceCaptureResignThreshold(room.practice)
    : null;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const copy = (
    <>
      <h2>{colorText ? `本局你执${colorText}` : "对局即将开始"}</h2>
      {practiceCaptureTarget != null && (
        <p className="practice-opening-rule">吃掉准时宝{practiceCaptureTarget}颗棋子就算胜利！</p>
      )}
      <p>{remaining} 秒后正式开始</p>
    </>
  );
  const fallback = (
    <div className="modal-backdrop opening-backdrop">
      <section className={`small-modal opening-modal ${isSigrikaCandyDuel ? "sigrika-duel-opening-modal" : ""}`.trim()}>
        {isSigrikaCandyDuel && <span className="sigrika-duel-modal-atmosphere" aria-hidden="true" />}
        <Swords
          className={isSigrikaCandyDuel ? "sigrika-duel-opening-icon" : undefined}
          size={isSigrikaCandyDuel ? 44 : 34}
          strokeWidth={isSigrikaCandyDuel ? 2.6 : 2}
          aria-hidden="true"
        />
        {copy}
      </section>
    </div>
  );
  return (
    <OpeningDuelPresentation room={room} player={player} characters={characters} deadline={openingEndsAt} fallback={fallback}>
      {copy}
    </OpeningDuelPresentation>
  );
}
