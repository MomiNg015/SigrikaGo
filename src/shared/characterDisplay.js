import { CHARACTERS } from "./characters.js";
import { canonicalCharacterId } from "./characterAliases.js";
import { characterVoiceMapForSkill } from "./musicLibrary.js";

const DEFAULT_CHARACTER_SYSTEM_VOICES = characterVoiceMapForSkill();

export function findCharacter(characters, characterOrId) {
  const characterId = canonicalCharacterId(typeof characterOrId === "string" ? characterOrId : characterOrId?.id);
  const fallback = CHARACTERS[characterId] ?? (characterId === "denia" ? CHARACTERS.danea : null) ?? CHARACTERS.sigrika;
  if (characterOrId && typeof characterOrId === "object") {
    return withCharacterSystemVoices({
      ...fallback,
      ...characterOrId,
      id: characterId,
      acquisitionMethod: characterOrId.acquisitionMethod ?? fallback.acquisitionMethod ?? "",
      skill: {
        ...fallback.skill,
        ...(characterOrId.skill ?? {})
      }
    });
  }
  return withCharacterSystemVoices(characters[characterId] ?? fallback);
}

export function withCharacterSystemVoices(character) {
  if (!character?.id) return character;
  return {
    ...character,
    systemVoices: {
      ...(DEFAULT_CHARACTER_SYSTEM_VOICES[character.id] ?? {}),
      ...(character.systemVoices ?? {})
    }
  };
}
