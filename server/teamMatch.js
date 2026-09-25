import { createGameState, GAME_PHASES } from "../src/shared/game.js";
import { TEAM_MODE, TEAM_ROUND_DURATION_MS, TEAM_ROUND_LIMITS, TEAM_MINIMUM_NOTICE, normalizeTeamLineup } from "../src/shared/teamMatch.js";
import { CHARACTERS } from "../src/shared/characters.js";
import { blockedCharactersForItemEffects } from "./itemEffects.js";
import { canonicalCharacterId } from "../src/shared/characterAliases.js";

export function resolveTeamLineup(user, input, { characters = {}, disabledSlugs = new Set() } = {}) {
  const disabled = new Set([...disabledSlugs].map(canonicalCharacterId));
  const blocked = blockedCharactersForItemEffects(user.itemEffects);
  const catalog = { ...CHARACTERS, ...characters };
  const available = new Set((user.ownedCharacters ?? []).map(canonicalCharacterId)
    .filter((id) => catalog[id] && !disabled.has(id) && !blocked.has(id)));
  if (available.size < 3) return { ok: false, error: TEAM_MINIMUM_NOTICE };
  const ids = normalizeTeamLineup(input);
  if (ids.length !== 3 || new Set(ids).size !== 3 || ids.some((id) => !available.has(id))) {
    return { ok: false, error: "请选择3名不同的可用部员" };
  }
  return { ok: true, lineup: ids.map((id) => ({
    characterId: id,
    character: structuredClone({ ...catalog[id], id }),
    costumeSnapshot: structuredClone(user.equippedCostumes?.[id] ?? null)
  })) };
}

export function initializeTeamRoom(room) {
  if (room.mode !== TEAM_MODE) return room;
  room.rated = false;
  room.matchSource = TEAM_MODE;
  room.recordPolicy = "replay-only";
  room.team = { round: 1, rounds: [{ round: 1, startMove: 1 }] };
  room.game.teamRoundStartHistoryIndex = 0;
  return room;
}

// This boundary runs only after the complete action/skill resolution, before
// the next passive or player action. Board effects and clocks remain intact.
export function advanceTeamRound(room, { now = Date.now, scheduleGameStart = () => {}, io } = {}) {
  if (room.mode !== TEAM_MODE || !room.team || room.team.round >= 3
    || room.game.phase !== GAME_PHASES.playing || room.game.winner
    || room.game.pendingSkill || room.game.extraTurn) return false;
  if (room.game.moveNumber < TEAM_ROUND_LIMITS[room.team.round - 1]) return false;
  const round = room.team.round + 1;
  for (const player of room.players) {
    const next = player.teamLineup[round - 1];
    player.characterId = next.characterId;
    player.character = structuredClone(next.character);
    player.costumeSnapshot = structuredClone(next.costumeSnapshot);
  }
  const players = room.players.map((p) => ({ userId: p.user.id, color: p.color, characterId: p.characterId, character: p.character }));
  const fresh = createGameState(players, { mode: TEAM_MODE });
  room.game.players = players;
  room.game.skillUses = fresh.skillUses;
  room.game.passives = fresh.passives;
  room.game.derivedSkills = {};
  room.game.teamRoundStartHistoryIndex = room.game.history.length;
  room.team.round = round;
  room.team.rounds.push({ round, startMove: room.game.moveNumber + 1 });
  room.game.history.push({ type: "team-round", round, moveNumber: room.game.moveNumber });
  room.game.phase = GAME_PHASES.opening;
  room.openingEndsAt = now() + TEAM_ROUND_DURATION_MS;
  room.lastTick = now();
  scheduleGameStart(room, io);
  return true;
}

export function publicTeamLineup(room, player, viewerId) {
  if (room.mode !== TEAM_MODE) return undefined;
  const revealAll = room.game.phase === GAME_PHASES.finished || player.user.id === viewerId;
  return player.teamLineup.map((entry, index) => revealAll || index < room.team.round
    ? { ...entry, status: index === room.team.round - 1 ? "active" : index < room.team.round - 1 ? "finished" : "waiting" }
    : { characterId: null, character: null, costumeSnapshot: null, status: "hidden" });
}

export function publicMatchPlayerUser(room, player) {
  return room.mode === TEAM_MODE
    ? { ...player.user, selectedCharacter: player.characterId, characterConfig: player.character }
    : player.user;
}
