import { CHARACTERS } from "../shared/characters.js";
import {
  BOARD_SIZE,
  COLORS,
  GAME_PHASES,
  activatePassiveSkill,
  createGameState,
  gameViewForColor,
  passMove,
  playMove,
  randomBlast,
  useSkill
} from "../shared/game.js";
import { canPreviewSkillTarget } from "../shared/boardView.js";
import { findCharacter } from "../shared/characterDisplay.js";

export function canPreviewPoint(game, player, point, pendingSkill, isScoringMode) {
  if (isScoringMode) return false;
  if (!player || game.phase !== GAME_PHASES.playing || game.turn !== player.color) return false;
  if (pendingSkill) return canPreviewSkillTarget({ game, player, point, fallbackCharacters: CHARACTERS });
  return Boolean(point?.valid && !point.stone);
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
    role: "player",
    color: player.color,
    username: player.user.username,
    rank: player.user.rank,
    rating: player.user.rating
  }));
  const spectators = (room.spectators ?? []).map((spectator) => ({
    id: `spectator-${spectator.user.id}`,
    role: "spectator",
    color: null,
    username: spectator.user.username,
    rank: spectator.user.rank,
    rating: spectator.user.rating
  }));
  return [...players, ...spectators];
}

export function coordLabel(x, y) {
  return `${coordLetter(x)}${BOARD_SIZE - y}`;
}

export function coordLetter(x) {
  return "ABCDEFGHJKLMN"[x];
}

export function buildBoardLines(points) {
  const valid = new Set(points.filter((point) => point.valid).map((point) => point.id));
  const lines = [];
  const center = (value) => ((value + 0.5) / BOARD_SIZE) * 100;

  for (const point of points) {
    if (!point.valid) continue;
    const right = `${point.x + 1},${point.y}`;
    if (point.x < BOARD_SIZE - 1 && valid.has(right)) {
      lines.push({
        key: `${point.id}-h`,
        x1: center(point.x),
        y1: center(point.y),
        x2: center(point.x + 1),
        y2: center(point.y)
      });
    }
    const down = `${point.x},${point.y + 1}`;
    if (point.y < BOARD_SIZE - 1 && valid.has(down)) {
      lines.push({
        key: `${point.id}-v`,
        x1: center(point.x),
        y1: center(point.y),
        x2: center(point.x),
        y2: center(point.y + 1)
      });
    }
  }

  return lines;
}

export function replayRoomAt(room, step, viewColor = COLORS.black) {
  const game = replayGameAt(room, step);
  const replayPlayers = room.players.map((player) => ({
    ...player,
    captures: 0,
    time: player.time ?? { main: 0, byoYomi: 30, periodRemaining: 30, periods: 0 }
  }));

  for (const player of replayPlayers) {
    player.captures = game.captures[player.color] ?? 0;
  }

  return {
    ...room,
    role: "spectator",
    players: replayPlayers,
    game: gameViewForColor(game, viewColor),
    chat: room.chat.filter((message) => message.moveNumber <= game.moveNumber)
  };
}

export function replayGameAt(room, step) {
  let game = createGameState(room.game.players);
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
      } else {
        result = useSkill(game, entry.color, skill, entry.id);
      }
    }
    if (result?.ok) game = result.state;
  }
  return game;
}

export function isStarPoint(x, y) {
  return ((x === 3 || x === 9) && (y === 3 || y === 9)) || (x === 6 && y === 6);
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
