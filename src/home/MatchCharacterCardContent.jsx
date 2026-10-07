import { useState } from "react";
import MatchCharacterPortrait from "./MatchCharacterPortrait.jsx";

export default function MatchCharacterCardContent({ character, user }) {
  const [tilt] = useState(() => `${(Math.random() * 3 - 1.5).toFixed(2)}deg`);
  return <span className="match-character-id" style={{ "--match-character-color": character.palette, "--match-character-tilt": tilt }}>
    <span className="match-character-bust"><MatchCharacterPortrait character={character} user={user} framed /></span>
    <img className="match-character-id-frame" src="/assets/home/character-selection-id-v4.png" alt="" aria-hidden="true" />
    <span className="match-character-id-tint" aria-hidden="true" />
    <span className="match-character-name">{character.name}</span>
  </span>;
}
