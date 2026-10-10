import CharacterBustPortrait from "../shared/CharacterBustPortrait.jsx";
import { useBattleSkillForm } from "../shared/useBattleSkillForm.js";

export default function BattleCharacterPortrait({ game, player, character, round, variant = "battle" }) {
  const battleForm = useBattleSkillForm(game, character.id, player.color, round);
  return <CharacterBustPortrait character={character} user={player.user}
    costumeSnapshot={player.costumeSnapshot} battleForm={battleForm} variant={variant} alt={character.name} />;
}
