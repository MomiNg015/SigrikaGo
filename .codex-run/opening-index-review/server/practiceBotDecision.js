import {
  activeNeighbors,
  collectGroup,
  getPoint,
  isStarPoint,
  pointId,
  playMove,
  opponent
} from "../src/shared/game.js";

export const PRACTICE_CANDIDATE_LIMIT = 48;

export function choosePracticeAction(gameView, botColor, difficulty, { random = Math.random } = {}) {
  const candidates = practiceCandidateIds(gameView, botColor, { random });
  const scored = candidates
    .map((candidateId) => scorePracticeMove(gameView, botColor, candidateId))
    .filter(Boolean)
    .sort((left, right) => (
      right.priority - left.priority
      || right.score - left.score
      || left.pointId.localeCompare(right.pointId)
    ));

  if (!scored.length) return { type: "pass", evaluated: candidates.length };
  if (shouldPracticeBotPassLowValueMoves(gameView, scored)) {
    return { type: "pass", evaluated: candidates.length };
  }

  const randomMoveChance = Number(difficulty?.randomMoveChance ?? 0);
  const broadChoice = random() < randomMoveChance;
  const topChoices = Math.max(1, Number(difficulty?.topChoices ?? 3));
  const poolLimit = broadChoice ? topChoices + 4 : topChoices;
  const scoreWindow = broadChoice ? 16 : 10;
  const best = scored[0];
  const choicePool = scored
    .filter((entry) => entry.priority === best.priority && entry.score >= best.score - scoreWindow)
    .slice(0, poolLimit);
  const chosen = choicePool[Math.min(choicePool.length - 1, Math.floor(random() * choicePool.length))];
  return {
    type: "move",
    pointId: chosen.pointId,
    evaluated: candidates.length,
    score: chosen.score,
    bestScore: best.score,
    reasons: chosen.reasons
  };
}

export function practiceCandidateIds(gameView, botColor, { random = Math.random } = {}) {
  const candidates = new Set();
  const add = (id) => {
    const point = getPoint(gameView, id);
    if (candidates.size < PRACTICE_CANDIDATE_LIMIT && point?.valid && !point.stone) candidates.add(id);
  };
  const groups = collectVisibleGroups(gameView)
    .filter((group) => group.liberties.size <= 2)
    .sort((left, right) => (
      left.liberties.size - right.liberties.size
      || Number(right.color === opponent(botColor)) - Number(left.color === opponent(botColor))
      || right.stones.length - left.stones.length
    ));

  for (const group of groups) {
    group.liberties.forEach(add);
  }
  recentMovePoints(gameView).forEach((point) => addLocalNeighborhood(gameView, point, add));
  gameView.points
    .filter((point) => point.valid && isStarPoint(point.x, point.y, gameView.size))
    .forEach((point) => add(point.id));
  for (const point of gameView.points) {
    if (!point.valid || !point.stone) continue;
    activeNeighbors(gameView, point).forEach((neighbor) => add(neighbor.id));
  }
  gameView.points
    .filter((point) => point.valid && isCenterPoint(point, gameView.size))
    .forEach((point) => add(point.id));

  const remaining = shuffled(
    gameView.points.filter((point) => point.valid && !point.stone && !candidates.has(point.id)),
    random
  );
  for (const point of remaining) add(point.id);
  return [...candidates];
}

export function scorePracticeMove(gameView, botColor, candidateId) {
  const beforeCaptures = Number(gameView.captures?.[botColor] ?? 0);
  const point = getPoint(gameView, candidateId);
  const neighbors = activeNeighbors(gameView, point);
  const connectedGroups = new Set();
  const adjacentEnemyGroups = new Set();
  let threatenedEnemies = 0;
  let rescuedStones = 0;

  for (const neighborPoint of neighbors) {
    if (!neighborPoint.stone) continue;
    const group = collectGroup(gameView, neighborPoint.id);
    if (neighborPoint.stone === botColor) {
      connectedGroups.add([...group.stones].sort().join("|"));
      if (group.liberties.size === 1 && group.liberties.has(candidateId)) rescuedStones += group.stones.length;
    } else {
      adjacentEnemyGroups.add([...group.stones].sort().join("|"));
      if (group.liberties.size === 2 && group.liberties.has(candidateId)) {
        threatenedEnemies += group.stones.length;
      }
    }
  }

  const result = playMove(gameView, botColor, candidateId, { colorIllusion: null });
  if (!result.ok) return null;
  const next = result.state;
  const ownGroup = collectGroup(next, candidateId);
  const captured = Number(next.captures?.[botColor] ?? 0) - beforeCaptures;
  const immediateReplyCapture = largestImmediateReplyCapture(next, botColor);
  const shape = localShapeScore(next, botColor, candidateId);
  const opening = openingInfluenceScore(gameView, botColor, point);
  const openingCorner = isOpeningCornerMove(gameView, botColor, point);
  const localReply = localReplyScore(gameView, point);
  const fillsOwnEye = neighbors.length >= 2 && neighbors.every((neighborPoint) => neighborPoint.stone === botColor);
  const selfAtari = ownGroup.liberties.size <= 1 && captured === 0;
  const tactical = captured > 0 || rescuedStones > 0 || threatenedEnemies > 0;
  const straightRun = maximumOrthogonalRun(next, botColor, point);
  const earlyStraightExtension = !tactical
    && Number(gameView.moveNumber ?? 0) < gameView.size * 2
    && straightRun >= 3;
  const score = captured * 80
    + rescuedStones * 34
    + threatenedEnemies * 16
    + Math.max(0, connectedGroups.size - 1) * 12
    + Math.max(0, adjacentEnemyGroups.size - 1) * 11
    + Math.min(ownGroup.liberties.size, 6) * 2
    + shape.score
    + opening
    + localReply
    - immediateReplyCapture * 58
    - (selfAtari ? 70 : 0)
    - (fillsOwnEye && !tactical ? 40 : 0)
    - (earlyStraightExtension ? (straightRun - 2) * 18 : 0);
  const priority = captured > 0
    ? 3
    : rescuedStones > 0
      ? 2
      : threatenedEnemies > 0 || openingCorner
        ? 1
        : 0;
  const reasons = [
    captured > 0 && "capture",
    rescuedStones > 0 && "defend",
    threatenedEnemies > 0 && "attack",
    connectedGroups.size > 1 && "connect",
    adjacentEnemyGroups.size > 1 && "cut",
    localReply > 0 && "local-reply",
    openingCorner && "opening-corner",
    opening > 0 && "opening",
    shape.labels,
    immediateReplyCapture > 0 && "hanging-group",
    selfAtari && "self-atari",
    fillsOwnEye && !tactical && "own-eye-fill",
    earlyStraightExtension && "early-straight-line"
  ].flat().filter(Boolean);
  return { pointId: candidateId, score, priority, reasons };
}

export function shouldPracticeBotPassLowValueMoves(gameView, scoredMoves) {
  const validPoints = gameView.points.filter((point) => point.valid);
  const emptyPoints = validPoints.filter((point) => !point.stone);
  const endgameEmptyLimit = Math.max(8, Math.floor(validPoints.length * 0.12));
  return emptyPoints.length <= endgameEmptyLimit
    && scoredMoves.length > 0
    && scoredMoves.every((entry) => entry.score <= -18);
}

// Spark scoring still needs a conservative rule-native dead-group helper because
// GNU Go cannot model skill-created invalid points or neutral stones.
export function obviousDeadBotGroups(game, botColor) {
  const dead = [];
  const visited = new Set();
  const rival = opponent(botColor);
  for (const point of game.points) {
    if (!point.valid || point.stone !== botColor || visited.has(point.id)) continue;
    const group = collectGroup(game, point.id);
    group.stones.forEach((id) => visited.add(id));
    if (group.liberties.size !== 1) continue;
    const [libertyId] = group.liberties;
    const liberty = getPoint(game, libertyId);
    const surrounded = activeNeighbors(game, liberty)
      .filter((neighborPoint) => !group.stones.includes(neighborPoint.id))
      .every((neighborPoint) => neighborPoint.stone === rival);
    if (surrounded) dead.push(point.id);
  }
  return dead;
}

function isCenterPoint(point, size) {
  const center = Math.floor(size / 2);
  return point.x === center && point.y === center;
}

function isOpeningCornerMove(game, color, point) {
  const center = Math.floor(game.size / 2);
  const botMovesPlayed = (game.history ?? [])
    .filter((entry) => entry?.type === "move" && entry.color === color)
    .length;
  return botMovesPlayed < 2
    && isStarPoint(point.x, point.y, game.size)
    && point.x !== center
    && point.y !== center;
}

function collectVisibleGroups(game) {
  const groups = [];
  const seen = new Set();
  for (const point of game.points) {
    if (!point.valid || !point.stone || seen.has(point.id)) continue;
    const group = collectGroup(game, point.id);
    group.stones.forEach((id) => seen.add(id));
    groups.push(group);
  }
  return groups;
}

function recentMovePoints(game) {
  return [...(game.history ?? [])]
    .reverse()
    .filter((entry) => typeof entry?.id === "string")
    .slice(0, 2)
    .map((entry) => getPoint(game, entry.id))
    .filter(Boolean);
}

function addLocalNeighborhood(game, center, add) {
  game.points
    .filter((point) => point.valid && !point.stone)
    .map((point) => ({ point, distance: manhattan(point, center) }))
    .filter(({ distance }) => distance >= 1 && distance <= 2)
    .sort((left, right) => left.distance - right.distance || left.point.id.localeCompare(right.point.id))
    .forEach(({ point }) => add(point.id));
}

function localReplyScore(game, point) {
  const [latest] = recentMovePoints(game);
  if (!latest) return 0;
  const distance = manhattan(point, latest);
  if (distance === 1) return 8;
  if (distance === 2) return 5;
  if (distance === 3) return 2;
  return 0;
}

function openingInfluenceScore(game, botColor, point) {
  const occupied = game.points.filter((entry) => entry.valid && entry.stone);
  if (occupied.length >= game.size * 2) return 0;
  const own = occupied.filter((entry) => entry.stone === botColor);
  const rivals = occupied.filter((entry) => entry.stone === opponent(botColor));
  const edgeDistance = Math.min(point.x, point.y, game.size - 1 - point.x, game.size - 1 - point.y);
  const nearestOwn = nearestDistance(point, own);
  const nearestRival = nearestDistance(point, rivals);
  let score = isStarPoint(point.x, point.y, game.size) ? 12 : 0;
  if (edgeDistance === 2 || edgeDistance === 3) score += 4;
  if (nearestOwn >= 3 && nearestOwn <= 5) score += 5;
  if (nearestOwn === 1) score -= 7;
  if (nearestRival >= 2 && nearestRival <= 3) score += 4;
  return score;
}

function localShapeScore(game, color, moveId) {
  const point = getPoint(game, moveId);
  const diagonals = coordinatePoints(game, point, [[-1, -1], [1, -1], [-1, 1], [1, 1]]);
  const jumps = coordinatePoints(game, point, [[-2, 0], [2, 0], [0, -2], [0, 2]]);
  const diagonalSupport = diagonals.filter((entry) => entry.stone === color).length;
  const jumpSupport = jumps.filter((entry) => entry.stone === color && midpointEmpty(game, point, entry)).length;
  const emptyTriangles = emptyTriangleCount(game, color, point);
  const labels = [];
  if (diagonalSupport > 0) labels.push("diagonal-support");
  if (jumpSupport > 0) labels.push("one-point-jump");
  if (emptyTriangles > 0) labels.push("empty-triangle");
  return {
    score: diagonalSupport * 4 + jumpSupport * 5 - emptyTriangles * 12,
    labels
  };
}

function largestImmediateReplyCapture(game, botColor) {
  if (game.turn !== opponent(botColor)) return 0;
  const replyIds = new Set();
  for (const group of collectVisibleGroups(game)) {
    if (group.color !== botColor || group.liberties.size !== 1) continue;
    group.liberties.forEach((id) => replyIds.add(id));
  }
  const rival = opponent(botColor);
  const beforeCaptures = Number(game.captures?.[rival] ?? 0);
  let largestCapture = 0;
  for (const id of [...replyIds].slice(0, 6)) {
    const response = playMove(game, rival, id, { colorIllusion: null });
    if (!response.ok) continue;
    largestCapture = Math.max(
      largestCapture,
      Number(response.state.captures?.[rival] ?? 0) - beforeCaptures
    );
  }
  return largestCapture;
}

function maximumOrthogonalRun(game, color, point) {
  return Math.max(
    contiguousRun(game, color, point, 1, 0),
    contiguousRun(game, color, point, 0, 1)
  );
}

function contiguousRun(game, color, point, dx, dy) {
  return 1
    + countDirection(game, color, point, dx, dy)
    + countDirection(game, color, point, -dx, -dy);
}

function countDirection(game, color, point, dx, dy) {
  let count = 0;
  for (let step = 1; step < game.size; step += 1) {
    const next = getPoint(game, pointId(point.x + dx * step, point.y + dy * step));
    if (!next?.valid || next.stone !== color) break;
    count += 1;
  }
  return count;
}

function emptyTriangleCount(game, color, point) {
  let count = 0;
  for (const offsetX of [-1, 0]) {
    for (const offsetY of [-1, 0]) {
      const block = coordinatePoints(
        game,
        { x: point.x + offsetX, y: point.y + offsetY },
        [[0, 0], [1, 0], [0, 1], [1, 1]]
      );
      if (block.length !== 4) continue;
      const ownCount = block.filter((entry) => entry.stone === color).length;
      const emptyCount = block.filter((entry) => !entry.stone).length;
      if (ownCount === 3 && emptyCount === 1) count += 1;
    }
  }
  return count;
}

function coordinatePoints(game, origin, offsets) {
  return offsets
    .map(([dx, dy]) => getPoint(game, pointId(origin.x + dx, origin.y + dy)))
    .filter((point) => point?.valid);
}

function midpointEmpty(game, left, right) {
  const midpoint = getPoint(game, pointId((left.x + right.x) / 2, (left.y + right.y) / 2));
  return Boolean(midpoint?.valid && !midpoint.stone);
}

function nearestDistance(point, targets) {
  if (!targets.length) return Number.POSITIVE_INFINITY;
  return Math.min(...targets.map((target) => manhattan(point, target)));
}

function manhattan(left, right) {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function shuffled(items, random) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}
