import { GAME_PHASES } from "../src/shared/game.js";
import { clearCandyEffectsForValidGame } from "./itemEffects.js";

export function candyEffectData(player, candyEffectUpdates) {
  const entry = candyEffectUpdates.find((candidate) => candidate.player.user.id === player.user.id);
  return entry ? { itemEffects: entry.clear.itemEffects } : {};
}

export function prepareCandyEffectUpdates(room) {
  if (room.candyEffectUpdates) return room.candyEffectUpdates;
  if (room.game.phase !== GAME_PHASES.finished || room.game.winner?.invalid) {
    room.candyEffectUpdates = [];
    return room.candyEffectUpdates;
  }
  room.candyEffectUpdates = room.players
    .map((player) => ({
      player,
      clear: clearCandyEffectsForValidGame(player.user, player.characterId)
    }))
    .filter((entry) => entry.clear.changed);
  applyCandyEffectUpdatesToRoom(room.candyEffectUpdates);
  return room.candyEffectUpdates;
}

function applyCandyEffectUpdatesToRoom(candyEffectUpdates) {
  for (const { player, clear } of candyEffectUpdates) {
    player.user = {
      ...player.user,
      itemEffects: clear.itemEffects ? JSON.parse(clear.itemEffects) : {}
    };
  }
}
