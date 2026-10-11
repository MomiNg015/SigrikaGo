import { canonicalCharacterId } from "../shared/characterAliases.js";
import { CHARACTERS } from "../shared/characters.js";
import { resolveCharacterPortrait } from "../shared/characterPortraits.js";

export function spectatorUsers(room) {
  const players = new Set((room.players ?? []).map((player) => player.user?.id));
  const users = new Map();
  for (const { user } of room.spectators ?? []) {
    if (user?.id && !players.has(user.id)) users.set(user.id, user);
  }
  return [...users.values()];
}

export function presenceSeed(value) {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

// Keep vacancies and a bounded position cache, rather than reindexing the crowd.
export function reconcileSpectatorSeats(previous, roomKey, ids) {
  const fresh = previous?.roomKey !== roomKey;
  const cache = fresh ? {} : { ...previous.cache };
  const occupied = new Set(ids.filter((id) => cache[id]).map((id) => cache[id].slot));
  const seats = {};
  for (const id of ids) {
    let seat = cache[id];
    if (!seat) {
      let slot = 0;
      while (occupied.has(slot)) slot += 1;
      seat = { slot, seed: presenceSeed(`${roomKey}:${id}`), animate: !fresh };
      occupied.add(slot);
      // A returning user must not reuse a position now occupied by someone else.
      for (const cachedId of Object.keys(cache)) {
        if (cache[cachedId].slot === slot) delete cache[cachedId];
      }
    } else seat = { ...seat, animate: false };
    cache[id] = { ...seat, animate: false };
    seats[id] = seat;
  }
  return { roomKey, cache, seats };
}

export function spectatorAppearance(user, characters) {
  const id = canonicalCharacterId(user?.selectedCharacter);
  const character = (Array.isArray(characters) ? characters.find((entry) => entry.id === id) : characters?.[id])
    ?? CHARACTERS[id];
  if (!id || !character) return { src: "", fallback: "" };
  return {
    src: resolveCharacterPortrait(character, { user, itemEffects: user.itemEffects }),
    fallback: resolveCharacterPortrait(character)
  };
}
