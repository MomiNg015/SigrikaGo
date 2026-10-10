import CharacterBustPortrait from "../shared/CharacterBustPortrait.jsx";
import { useDeniaSkillForm } from "../shared/useDeniaSkillForm.js";

export default function BattleCharacterPortrait({ game, player, character, round, variant = "battle" }) {
  const battleForm = useDeniaSkillForm(game, character.id, player.color, round);
  return <CharacterBustPortrait character={character} user={player.user}
    costumeSnapshot={player.costumeSnapshot} battleForm={battleForm} variant={variant} alt={character.name} />;
}
