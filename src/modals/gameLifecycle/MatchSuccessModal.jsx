import { useEffect, useRef, useState } from "react";
import { MonitorPlay } from "lucide-react";
import { playEffectSound } from "../../audio/playback.jsx";
import { MATCH_SUCCESS_SOUND } from "../../shared/musicLibrary.js";
import { secondsSinceStarted } from "./lifecycleHelpers.js";

export default function MatchSuccessModal({ startedAt, audioSettings, onComplete, specialDuel = false }) {
  const [now, setNow] = useState(Date.now());
  const completedRef = useRef(false);
  const remaining = Math.max(0, 3 - secondsSinceStarted(startedAt, now));

  useEffect(() => {
    playEffectSound(MATCH_SUCCESS_SOUND, audioSettings);
  }, [audioSettings]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining > 0 || completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [remaining, onComplete]);

  return (
    <div className={`modal-backdrop ${specialDuel ? "sigrika-corruption-match-backdrop" : ""}`}>
      <section className={`small-modal match-success-modal ${specialDuel ? "sigrika-corruption-match-modal" : ""}`}>
        <MonitorPlay size={34} />
        <h2>{specialDuel ? "匹配成功 // 数据损坏" : "匹配成功"}</h2>
        <p>{remaining} 秒后进入{specialDuel ? "决战" : "对弈"}</p>
      </section>
    </div>
  );
}
