import { COLORS } from "../../shared/game.js";
import { canonicalCharacterId } from "../../shared/characterAliases.js";
import {
  characterPortraitImageProps,
  resolveCharacterPortrait
} from "../../shared/characterPortraits.js";
import { recordWinnerColor } from "../../shared/gameRecords.js";
import { SYSTEM_VOICE_EVENTS } from "../../shared/systemVoices.js";
import { playSystemVoice } from "../../audio/systemVoicePlayback.js";

export const RAINBOW_BEAN_CANDY_ICON = "/assets/items/rainbow-bean-candy.webp";

const CHARACTER_ITEM_EFFECT_BADGES = [
  {
    characterId: "aemeath",
    effectKey: "aemeathRainbowMove",
    itemId: "rainbow-bean-candy",
    label: "彩虹落子模式",
    icon: RAINBOW_BEAN_CANDY_ICON
  },
  {
    characterId: "sigrika",
    effectKey: "sigrikaCandyDisabled",
    itemId: "rainbow-bean-candy",
    label: "彩虹豆豆跳跳糖效果中",
    icon: RAINBOW_BEAN_CANDY_ICON
  },
  {
    characterId: "denia",
    effectKey: "deniaRainbowGlow",
    itemId: "rainbow-bean-candy",
    label: "彩虹豆豆跳跳糖效果中",
    icon: RAINBOW_BEAN_CANDY_ICON
  },
  {
    characterId: "lynae",
    effectKey: "lynaeContraryVoice",
    itemId: "rainbow-bean-candy",
    label: "反话语音模式",
    icon: RAINBOW_BEAN_CANDY_ICON
  }
];

export function deriveCharacterRecordStats(user = {}, records = [], characters = []) {
  const owned = new Set((user.ownedCharacters ?? []).map(canonicalCharacterId));
  const characterMap = new Map(characters.map((character) => [canonicalCharacterId(character.id), character]));
  const stats = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    const color = playerColorForReplayRecord(user, record);
    if (!color) continue;
    const characterId = canonicalCharacterId(color === COLORS.black ? record.blackCharacter : record.whiteCharacter);
    const character = characterMap.get(characterId);
    if (!character || !owned.has(canonicalCharacterId(character.id))) continue;
    if (!stats.has(character.id)) {
      stats.set(character.id, { character, total: 0, wins: 0, losses: 0, draws: 0 });
    }
    const entry = stats.get(character.id);
    const winner = recordWinnerColor(record);
    entry.total += 1;
    if (!winner) {
      entry.draws += 1;
    } else if (winner === color) {
      entry.wins += 1;
    } else {
      entry.losses += 1;
    }
  }
  return Array.from(stats.values()).sort((a, b) => b.total - a.total || b.wins - a.wins || a.character.name.localeCompare(b.character.name, "zh-CN"));
}

export function characterSortieDisabledReason(characterId, itemEffects = {}) {
  return canonicalCharacterId(characterId) === "sigrika" && itemEffects?.sigrikaCandyDisabled
    ? "糖果效果中，暂时无法出战"
    : "";
}

export function characterCandyPortrait(character = {}, itemEffects = {}, user = null) {
  return resolveCharacterPortrait(character, { itemEffects, user });
}

export function characterCandyPortraitProps(character = {}, itemEffects = {}, user = null) {
  return characterPortraitImageProps(character, { itemEffects, user });
}

export function activeCharacterItemEffects(characterId, itemEffects = {}) {
  const canonicalId = canonicalCharacterId(characterId);
  return CHARACTER_ITEM_EFFECT_BADGES.filter((effect) => (
    effect.characterId === canonicalId && itemEffects?.[effect.effectKey]
  ));
}

export function selectSortieCharacter({
  character = {},
  disabled = false,
  itemEffects = {},
  audioSettings = undefined,
  playVoice = playSystemVoice,
  onSelectCharacter = () => {}
} = {}) {
  if (disabled) return;
  playVoice(SYSTEM_VOICE_EVENTS.sortie, {
    character: { ...character, itemEffects },
    audioSettings
  });
  onSelectCharacter(canonicalCharacterId(character.id));
}

export function playerColorForReplayRecord(user = {}, record = {}) {
  if (user.id && record.blackUserId === user.id) return COLORS.black;
  if (user.id && record.whiteUserId === user.id) return COLORS.white;
  if (user.username && record.blackName === user.username) return COLORS.black;
  if (user.username && record.whiteName === user.username) return COLORS.white;
  return null;
}
