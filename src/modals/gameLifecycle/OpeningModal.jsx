import { useEffect, useState } from "react";
import { Swords } from "lucide-react";
import { isPracticeRoom, practiceCaptureResignThreshold } from "../../shared/practiceMode.js";
import { colorTextForPlayer, secondsUntilTimestamp } from "./lifecycleHelpers.js";

export default function OpeningModal({ room, player }) {
  const [now, setNow] = useState(Date.now());
  const remaining = secondsUntilTimestamp(room.openingEndsAt ?? now, now);
  const colorText = colorTextForPlayer(player);
  const practiceCaptureTarget = isPracticeRoom(room)
    ? practiceCaptureResignThreshold(room.practice)
    : null;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="modal-backdrop opening-backdrop">
      <section className="small-modal opening-modal">
        <Swords size={34} />
        <h2>{colorText ? `本局你执${colorText}` : "对局即将开始"}</h2>
        {practiceCaptureTarget != null && (
          <p className="practice-opening-rule">吃掉准时宝{practiceCaptureTarget}颗棋子就算胜利！</p>
        )}
        <p>{remaining} 秒后正式开始</p>
      </section>
    </div>
  );
}
