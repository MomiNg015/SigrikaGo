import { CHARACTERS } from "../shared/characters.js";
import {
  BOARD_SIZE,
  COLORS,
  GAME_PHASES,
  activatePassiveSkill,
  captureCreditOwner,
  createGameState,
  gameViewForColor,
  getPoint,
  isStarPoint as sharedIsStarPoint,
  passMove,
  playMove,
  randomBlast,
  sprayStone,
  useSkill
} from "../shared/game.js";
import { applySkillCost, isLibertyPurgeForbiddenPoint } from "../shared/gameSkillState.js";
import { canPreviewSkillTarget } from "../shared/boardView.js";
import { findCharacter } from "../shared/characterDisplay.js";

export function canPreviewPoint(game, player, point, pendingSkill, isScoringMode) {
  if (isScoringMode) return false;
  if (!player || game.phase !== GAME_PHASES.playing || game.turn !== player.color) return false;
  if (pendingSkill) return canPreviewSkillTarget({ game, player, point, fallbackCharacters: CHARACTERS });
  return Boolean(point?.valid
    && !point.stone
    && point.protocolBan?.bannedColor !== player.color
    && !isLibertyPurgeForbiddenPoint(game, player.color, point));
}

export function stoneDecorationsForRoom(room) {
  return Object.fromEntries(
    (room.players ?? []).map((player) => [
      player.color,
      player.user?.selectedStoneDecoration ?? ""
    ])
  );
}

export function voiceCharacterForPlayer(player, characters) {
  if (!player) return null;
  return findCharacter(characters, player.character ?? player.characterId);
}

export function roomPeople(room) {
  const players = (room.players ?? []).map((player) => ({
    id: `player-${player.color}-${player.user.id}`,
    userId: player.user.id,
    role: "player",
    color: player.color,
    username: player.user.username,
    rank: player.user.rank,
    rating: player.user.rating,
    achievementEquipment: player.user.achievementEquipment ?? null,
    achievementEquipmentAssets: player.user.achievementEquipmentAssets ?? null,
    connected: player.connected
  }));
  const spectators = (room.spectators ?? []).map((spectator) => ({
    id: `spectator-${spectator.user.id}`,
    userId: spectator.user.id,
    role: "spectator",
    color: null,
    username: spectator.user.username,
    rank: spectator.user.rank,
    rating: spectator.user.rating,
    achievementEquipment: spectator.user.achievementEquipment ?? null,
    achievementEquipmentAssets: spectator.user.achievementEquipmentAssets ?? null
  }));
  return [...players, ...spectators];
}

export function coordLabel(x, y, size = BOARD_SIZE) {
  return `${coordLetter(x)}${size - y}`;
}

export function coordLetter(x) {
  return "ABCDEFGHJKLMNOPQRST"[x] ?? String(x + 1);
}

export function buildBoardLines(points) {
  const size = boardSizeFromPoints(points);
  const valid = new Set(points.filter((point) => point.valid).map((point) => point.id));
  const lines = [];
  const center = (value) => ((value + 0.5) / size) * 100;

  for (let y = 0; y < size; y += 1) {
    for (const run of validRuns((x) => valid.has(`${x},${y}`), size)) {
      lines.push({
        key: `row-${y}-${run.start}-${run.end}`,
        x1: center(run.start),
        y1: center(y),
        x2: center(run.end),
        y2: center(y),
        edge: y === 0 || y === size - 1
      });
    }
  }

  for (let x = 0; x < size; x += 1) {
    for (const run of validRuns((y) => valid.has(`${x},${y}`), size)) {
      lines.push({
        key: `col-${x}-${run.start}-${run.end}`,
        x1: center(x),
        y1: center(run.start),
        x2: center(x),
        y2: center(run.end),
        edge: x === 0 || x === size - 1
      });
    }
  }

  return lines;
}

function validRuns(isValid, size = BOARD_SIZE) {
  const runs = [];
  let start = null;

  for (let index = 0; index < size; index += 1) {
    if (isValid(index)) {
      if (start === null) start = index;
      continue;
    }
    if (start !== null && index - start > 1) {
      runs.push({ start, end: index - 1 });
    }
    start = null;
  }

  if (start !== null && size - start > 1) {
    runs.push({ start, end: size - 1 });
  }

  return runs;
}

export function replayRoomAt(room, step, viewColor = COLORS.black) {
  const game = replayGameAt(room, step);
  const replayGame = {
    ...game,
    phase: room.game.phase === GAME_PHASES.finished ? GAME_PHASES.finished : game.phase,
    winner: room.game.winner ?? game.winner
  };
  const replayPlayers = room.players.map((player) => ({
    ...player,
    captures: 0,
    skillRemovals: 0,
    time: player.time ?? { main: 0, byoYomi: 30, periodRemaining: 30, periods: 0 }
  }));

  for (const player of replayPlayers) {
    player.captures = game.captures[player.color] ?? 0;
    player.skillRemovals = game.skillRemovals?.[player.color] ?? 0;
  }

  return {
    ...room,
    role: "spectator",
    players: replayPlayers,
    game: gameViewForColor(replayGame, viewColor),
    chat: (room.chat ?? []).filter((message) => message.moveNumber <= game.moveNumber)
  };
}

export function replayGameAt(room, step) {
  let game = createGameState(room.game.players, { mode: room.game.mode ?? room.mode });
  for (const entry of room.game.history.slice(0, step)) {
    let result = null;
    if (entry.type === "move") result = playMove(game, entry.color, entry.id, {
      colorIllusion: Object.hasOwn(entry, "colorIllusion") ? entry.colorIllusion : null
    });
    if (entry.type === "pass") result = passMove(game, entry.color);
    if (entry.type === "skill") {
      const player = room.players.find((candidate) => candidate.color === entry.color);
      const skill = player?.character?.skill ?? player?.characterId;
      if (entry.effectType === "color-illusion-passive") {
        result = activatePassiveSkill(game, entry.color, skill);
      } else if (entry.effectType === "random-blast") {
        result = randomBlast(game, entry.color, {
          skill,
          skillName: entry.skill,
          consumesTurn: false,
          centerId: entry.id
        });
      } else if (entry.effectType === "spray-stone") {
        result = sprayStone(game, entry.color, entry.id, {
          skill,
          skillName: entry.skill,
          consumesTurn: true,
          randomTargetId: replaySprayRandomTargetId(entry)
        });
      } else if (entry.effectType === "voyage-star") {
        result = replayVoyageStarFromHistory(game, entry, player);
      } else {
        result = useSkill(game, entry.color, skill, entry.id);
      }
    }
    if (result?.ok) game = result.state;
  }
  return game;
}

function replayVoyageStarFromHistory(game, entry, player) {
  if (!entry?.id) return { ok: false };
  const next = structuredClone(game);
  const erasedPointIds = new Set(
    Array.isArray(entry.erasedPointIds) && entry.erasedPointIds.length
      ? entry.erasedPointIds
      : [entry.id, ...(Array.isArray(entry.affectedPointIds) ? entry.affectedPointIds : [])]
  );
  const removalIds = new Set([
    ...historyRemovalIds(entry.directRemovals),
    ...historyRemovalIds(entry.erasedPointRemovals),
    ...historyRemovalIds(entry.secondaryRemovals),
    ...historyRemovalIds(entry.cleanupRemovals),
    ...(Array.isArray(entry.secondaryRemovalIds) ? entry.secondaryRemovalIds : [])
  ]);

  for (const pointIdValue of erasedPointIds) {
    const point = getPoint(next, pointIdValue);
    if (!point) continue;
    point.stone = null;
    point.hiddenHand = null;
    point.colorIllusion = null;
    delete point.protocolBan;
    point.valid = false;
    point.mark = null;
    point.skillEffect = point.id === entry.id ? "voyage-star-crater-point" : "voyage-star-erased-point";
    point.skillEffectOwner = entry.color;
    point.neighbors = [];
  }

  for (const point of next.points) {
    point.neighbors = (point.neighbors ?? []).filter((neighborId) => !erasedPointIds.has(neighborId));
  }

  for (const pointIdValue of removalIds) {
    const point = getPoint(next, pointIdValue);
    if (!point) continue;
    point.stone = null;
    point.hiddenHand = null;
    point.colorIllusion = null;
  }

  applySkillCost(next, entry.color, {
    characterId: player?.characterId ?? player?.character?.id ?? null,
    costType: entry.costType ?? "numeric",
    costValue: String(entry.costValue ?? 0)
  });
  next.skillRemovals ??= { black: 0, white: 0 };
  for (const [owner, count] of Object.entries(historyRemovedByColor(entry))) {
    if (owner) next.skillRemovals[owner] = (next.skillRemovals[owner] ?? 0) + count;
  }
  if (next.derivedSkills?.[entry.color]?.effectType === "voyage-star") {
    next.derivedSkills[entry.color] = {
      ...next.derivedSkills[entry.color],
      uses: 0,
      spent: true,
      sourceHiddenHandId: null
    };
  }
  next.ko = null;
  next.history.push({ ...entry });
  return { ok: true, state: next };
}

function historyRemovalIds(removals) {
  if (!Array.isArray(removals)) return [];
  return removals.flatMap((removal) => {
    if (!removal) return [];
    if (typeof removal === "string") return [removal];
    if (Array.isArray(removal.stones)) return removal.stones;
    return removal.id ? [removal.id] : [];
  });
}

function historyRemovedByColor(entry) {
  const counts = {};
  const hasRecordedDirectCounts = Object.keys(entry.removedByColor ?? {}).length > 0;
  for (const [stoneColor, count] of Object.entries(entry.removedByColor ?? {})) {
    addRemovalCount(counts, captureCreditOwner(stoneColor), count);
  }
  const removals = [
    ...(hasRecordedDirectCounts ? [] : (Array.isArray(entry.directRemovals) ? entry.directRemovals : [])),
    ...(Array.isArray(entry.cleanupRemovals) ? entry.cleanupRemovals : [])
  ];
  for (const removal of removals) {
    const count = Array.isArray(removal.stones) ? removal.stones.length : removal.id ? 1 : 0;
    addRemovalCount(counts, removal?.owner, count);
  }
  return counts;
}

function addRemovalCount(counts, owner, count) {
  if (owner !== COLORS.black && owner !== COLORS.white) return;
  const numericCount = Number(count);
  if (!Number.isFinite(numericCount) || numericCount <= 0) return;
  counts[owner] = (counts[owner] ?? 0) + numericCount;
}

function replaySprayRandomTargetId(entry) {
  if (Object.hasOwn(entry, "randomTargetId")) return entry.randomTargetId;
  return Array.isArray(entry.transformed)
    ? entry.transformed.find((target) => target?.id && target.id !== entry.id)?.id
    : undefined;
}

export function isStarPoint(x, y) {
  return sharedIsStarPoint(x, y, arguments[2] ?? BOARD_SIZE);
}

function boardSizeFromPoints(points = []) {
  const max = points.reduce((size, point) => Math.max(size, point.x ?? 0, point.y ?? 0), 0);
  return max + 1 || BOARD_SIZE;
}

export function signedStoneTerm(value, label) {
  if (!value) return `+ ${label} 0`;
  const sign = value > 0 ? "+" : "-";
  return `${sign} ${label} ${formatAbsStones(value)}`;
}

export function formatMessageTime(value) {
  return new Date(value).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

export function formatClock(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function formatAbsStones(value) {
  const abs = Math.abs(value);
  if (Number.isInteger(abs)) return String(abs);
  const doubled = abs * 2;
  if (Number.isInteger(doubled)) {
    const whole = Math.floor(doubled / 2);
    return doubled % 2 === 0 ? String(whole) : whole > 0 ? `${whole}又1/2` : "1/2";
  }
  const quartered = abs * 4;
  if (Number.isInteger(quartered)) {
    const whole = Math.floor(quartered / 4);
    const remainder = quartered % 4;
    const fraction = remainder === 1 ? "1/4" : remainder === 2 ? "1/2" : "3/4";
    return whole > 0 ? `${whole}又${fraction}` : fraction;
  }
  return String(abs);
}
