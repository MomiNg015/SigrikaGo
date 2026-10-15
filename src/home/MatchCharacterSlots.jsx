import { Plus } from "lucide-react";
import MatchCharacterPortrait from "./MatchCharacterPortrait.jsx";

export default function MatchCharacterSlots({ entry, title, selections, characters, user, onOpen }) {
  return <div className="match-character-slots">
    {Array.from({ length: entry === "team" ? 3 : 1 }, (_, index) => {
      const character = characters[selections[index]];
      return <button className="match-character-slot" data-filled={Boolean(character)} type="button" key={index} aria-label={`${title}选择角色${entry === "team" ? index + 1 : ""}${character ? `：${character.name}` : ""}`} onClick={() => onOpen(entry)}>
        {character ? <MatchCharacterPortrait character={character} user={user} avatar /> : <span className="match-slot-add"><Plus size={18} strokeWidth={2} aria-hidden="true" /><span>选择</span></span>}
      </button>;
    })}
  </div>;
}
