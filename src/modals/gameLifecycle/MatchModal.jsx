import { useEffect, useState } from "react";
import { resolveCandyPortrait } from "../../shared/candyPortraits.js";
import { findCharacter } from "../../shared/characterDisplay.js";
import { secondsSinceStarted } from "./lifecycleHelpers.js";

export default function MatchModal({ user, startedAt, onCancel, characters }) {
  const [now, setNow] = useState(Date.now());
  const character = findCharacter(characters, user?.selectedCharacter);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <section className="small-modal" onClick={(event) => event.stopPropagation()}>
        <img className="match-portrait" src={resolveCandyPortrait(character, user?.itemEffects)} alt={character.name} />
        <h2>匹配中</h2>
        <p>{secondsSinceStarted(startedAt, now)} 秒</p>
        <button onClick={onCancel}>取消匹配</button>
      </section>
    </div>
  );
}
