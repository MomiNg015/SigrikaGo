import { useEffect, useState } from "react";
import { characterPortraitImageProps } from "../../shared/characterPortraits.js";
import CharacterChainBadge from "../../shared/CharacterChainBadge.jsx";
import { findCharacter } from "../../shared/characterDisplay.js";
import { gameModeById } from "../../shared/gameModes.js";
import { secondsSinceStarted } from "./lifecycleHelpers.js";

export default function MatchModal({ user, startedAt, mode = "spark", onCancel, characters, specialDuel = false }) {
  const [now, setNow] = useState(Date.now());
  const character = findCharacter(characters, user?.selectedCharacter);
  const gameMode = gameModeById(mode);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`modal-backdrop ${specialDuel ? "sigrika-corruption-match-backdrop" : ""}`} onClick={specialDuel ? undefined : onCancel}>
      <section className={`small-modal ${specialDuel ? "sigrika-corruption-match-modal" : ""}`} onClick={(event) => event.stopPropagation()}>
        {!specialDuel && <span className="match-portrait-wrap">
          <img className="match-portrait" {...characterPortraitImageProps(character, { itemEffects: user?.itemEffects, user })} alt={character.name} />
          <CharacterChainBadge user={user} characterId={character.id} />
        </span>}
        <h2>{specialDuel ? "正在锁定西格莉卡？" : `${gameMode.title}匹配中`}</h2>
        <p className="quiet-text">{specialDuel ? "MATCH DATA CORRUPTED" : gameMode.rulesText}</p>
        <p>{secondsSinceStarted(startedAt, now)} 秒</p>
        {!specialDuel && <button onClick={onCancel}>取消匹配</button>}
      </section>
    </div>
  );
}
