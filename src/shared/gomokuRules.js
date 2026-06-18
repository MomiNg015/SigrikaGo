import { GAME_PHASES } from "./gamePhases.js";
import { getPoint, parsePointId, pointId } from "./gameBoard.js";
import { COLORS, opponent } from "./gameConstants.js";
import { fail, ok } from "./gameActionResult.js";
import { cloneState } from "./gameSkillState.js";

const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1]
];

export function playGomokuMove(state, color, id) {
  if (state.phase !== GAME_PHASES.playing) return fail("对局当前不能落子");
  if (state.turn !== color) return fail("还没有轮到你");
  const next = cloneState(state);
  const point = getPoint(next, id);
  if (!point?.valid) return fail("该交叉点不可落子");
  if (point.stone) return fail("该交叉点已有棋子");

  point.stone = color;
  const forbidden = color === COLORS.black ? blackForbiddenMove(next, id) : "";
  if (forbidden) return fail(forbidden);

  next.moveNumber += 1;
  next.passes = 0;
  next.ko = null;
  next.history.push({ type: "move", color, id, captures: [], moveNumber: next.moveNumber });

  const winner = gomokuWinner(next, color, id);
  if (winner) {
    next.phase = GAME_PHASES.finished;
    next.winner = winner;
    return ok(next);
  }
  if (isBoardFull(next)) {
    next.phase = GAME_PHASES.finished;
    next.winner = { winnerColor: null, reason: "board-full", text: "和棋" };
    return ok(next);
  }

  next.turn = opponent(color);
  return ok(next);
}

export function blackForbiddenMove(state, id) {
  if (hasOverline(state, id, COLORS.black)) return "黑方禁手：长连";
  if (countFourThreatDirections(state, id, COLORS.black) >= 2) return "黑方禁手：双四";
  if (countLiveThreeDirections(state, id, COLORS.black) >= 2) return "黑方禁手：双三";
  return "";
}

function gomokuWinner(state, color, id) {
  const wins = DIRECTIONS.some(([dx, dy]) => contiguousLength(state, id, color, dx, dy) >= 5);
  if (!wins) return null;
  return {
    winnerColor: color,
    reason: "gomoku-five",
    text: `${color === COLORS.black ? "黑" : "白"}五连胜`
  };
}

function hasOverline(state, id, color) {
  return DIRECTIONS.some(([dx, dy]) => contiguousLength(state, id, color, dx, dy) > 5);
}

function countFourThreatDirections(state, id, color) {
  const origin = parsePointId(id);
  return DIRECTIONS.filter(([dx, dy]) => {
    for (let offset = -4; offset <= 4; offset += 1) {
      const candidate = pointId(origin.x + dx * offset, origin.y + dy * offset);
      const point = getPoint(state, candidate);
      if (!point?.valid || point.stone) continue;
      if (virtualContiguousLength(state, candidate, color, dx, dy) === 5) return true;
    }
    return false;
  }).length;
}

function countLiveThreeDirections(state, id, color) {
  const origin = parsePointId(id);
  return DIRECTIONS.filter(([dx, dy]) => {
    for (let offset = -4; offset <= 4; offset += 1) {
      const candidate = pointId(origin.x + dx * offset, origin.y + dy * offset);
      const point = getPoint(state, candidate);
      if (!point?.valid || point.stone) continue;
      if (createsOpenFour(state, candidate, color, dx, dy)) return true;
    }
    return false;
  }).length;
}

function createsOpenFour(state, id, color, dx, dy) {
  const run = virtualRun(state, id, color, dx, dy);
  if (run.length !== 4) return false;
  const before = pointAt(state, run.start.x - dx, run.start.y - dy);
  const after = pointAt(state, run.end.x + dx, run.end.y + dy);
  return isEmptyValid(before) && isEmptyValid(after);
}

function contiguousLength(state, id, color, dx, dy) {
  return virtualRun(state, id, color, dx, dy, { requireExisting: true }).length;
}

function virtualContiguousLength(state, id, color, dx, dy) {
  return virtualRun(state, id, color, dx, dy).length;
}

function virtualRun(state, id, color, dx, dy, { requireExisting = false } = {}) {
  const origin = parsePointId(id);
  if (requireExisting && getPoint(state, id)?.stone !== color) {
    return { length: 0, start: origin, end: origin };
  }

  let start = origin;
  let end = origin;
  let length = 1;

  for (const direction of [-1, 1]) {
    let step = 1;
    while (true) {
      const x = origin.x + dx * step * direction;
      const y = origin.y + dy * step * direction;
      if (stoneAt(state, x, y, id, color) !== color) break;
      if (direction < 0) start = { x, y };
      else end = { x, y };
      length += 1;
      step += 1;
    }
  }

  return { length, start, end };
}

function stoneAt(state, x, y, virtualId, virtualColor) {
  const id = pointId(x, y);
  if (id === virtualId) return virtualColor;
  return getPoint(state, id)?.stone ?? null;
}

function pointAt(state, x, y) {
  return getPoint(state, pointId(x, y));
}

function isEmptyValid(point) {
  return Boolean(point?.valid && !point.stone);
}

function isBoardFull(state) {
  return state.points.every((point) => !point.valid || point.stone);
}
