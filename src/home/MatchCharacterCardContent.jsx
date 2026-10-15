import { useState } from "react";
import MatchCharacterPortrait from "./MatchCharacterPortrait.jsx";
import CharacterCandyBorder from "../shared/CharacterCandyBorder.jsx";
import { activeCharacterItemEffects } from "../shared/characterCandyEffects.js";

export default function MatchCharacterCardContent({ character, user, selectionStamp }) {
  const [tilt] = useState(() => `${(Math.random() * 3 - 1.5).toFixed(2)}deg`);
  const [stampTilt] = useState(() => `${(Math.random() * 30 - 15).toFixed(2)}deg`);
  const effects = activeCharacterItemEffects(character.id, user?.itemEffects);
  return <span className="match-character-id" style={{ "--match-character-color": character.palette, "--match-character-tilt": tilt }}>
    <span className="match-character-bust"><MatchCharacterPortrait character={character} user={user} framed /></span>
    <img className="match-character-id-frame" src="/assets/home/character-selection-id-v4.png" alt="" aria-hidden="true" />
    <span className="match-character-id-tint" aria-hidden="true" />
    {effects.length > 0 && <><CharacterCandyBorder /><span className="character-candy-status">{effects.map(effect => effect.label).join("，")}</span></>}
    <span className="match-character-name">{character.name}</span>
    {selectionStamp && <img className="match-character-selection-stamp" style={{ "--selection-stamp-tilt": stampTilt }} src={`/assets/home/selection-stamp-${selectionStamp}-v2.png`} alt={selectionStamp === "flag" ? "已选" : `第${selectionStamp}位`} draggable={false} />}
  </span>;
}
