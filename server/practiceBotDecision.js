import {
  activeNeighbors,
  collectGroup,
  getPoint,
  isStarPoint,
  opponent,
  playMove
} from "../src/shared/game.js";

export const PRACTICE_CANDIDATE_LIMIT = 48;

export function choosePracticeAction(gameView, botColor, difficulty, { random = Math.random } = {}) {
  const candidates = practiceCandidateIds(gameView, botColor, { random });
  const scored = candidates
    .map((pointId) => scorePracticeMove(gameView, botColor, pointId))
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.pointId.localeCompare(right.pointId));

  if (!scored.length) return { type: "pass", evaluated: candidates.length };
  const allLowValueSelfFill = scored.every((entry) => entry.score <= -18);
  if (allLowValueSelfFill && Number(gameView.moveNumber ?? 0) > gameView.size * 3) {
    return { type: "pass", evaluated: candidates.length };
  }

  const randomMoveChance = Number(difficulty?.randomMoveChance ?? 0);
  const choicePool = random() < randomMoveChance
    ? scored
    : scored.slice(0, Math.max(1, Number(difficulty?.topChoices ?? 3)));
  const chosen = choicePool[Math.min(choicePool.length - 1, Math.floor(random() * choicePool.length))];
  return { type: "move", pointId: chosen.pointId, evaluated: candidates.length, score: chosen.score };
}

export function practiceCandidateIds(gameView, botColor, { random = Math.random } = {}) {
  const candidates = new Set();
  const add = (id) => {
    const point = getPoint(gameView, id);
    if (candidates.size < PRACTICE_CANDIDATE_LIMIT && point?.valid && !point.stone) candidates.add(id);
  };
  const seenGroups = new Set();

  for (const point of gameView.points) {
    if (!point.valid || !point.stone || seenGroups.has(point.id)) continue;
    const group = collectGroup(gameView, point.id);
    group.stones.forEach((id) => seenGroups.add(id));
    if (group.liberties.size <= 2) group.liberties.forEach(add);
  }
  for (const point of gameView.points) {
    if (!point.valid || !point.stone) continue;
    activeNeighbors(gameView, point).forEach((neighbor) => add(neighbor.id));
  }
  gameView.points
    .filter((point) => point.valid && (isStarPoint(point.x, point.y, gameView.size) || isCenterPoint(point, gameView.size)))
    .forEach((point) => add(point.id));

  const remaining = shuffled(
    gameView.points.filter((point) => point.valid && !point.stone && !candidates.has(point.id)),
    random
  );
  for (const point of remaining) add(point.id);
  return [...candidates];
}

export function scorePracticeMove(gameView, botColor, pointId) {
  const beforeCaptures = Number(gameView.captures?.[botColor] ?? 0);
  const point = getPoint(gameView, pointId);
  const neighbors = activeNeighbors(gameView, point);
  const connectedGroups = new Set();
  let threatenedEnemies = 0;
  let rescuedStones = 0;

  for (const neighborPoint of neighbors) {
    if (!neighborPoint.stone) continue;
    const group = collectGroup(gameView, neighborPoint.id);
    if (neighborPoint.stone === botColor) {
      connectedGroups.add([...group.stones].sort().join("|"));
      if (group.liberties.size === 1 && group.liberties.has(pointId)) rescuedStones += group.stones.length;
    } else if (group.liberties.size === 2 && group.liberties.has(pointId)) {
      threatenedEnemies += group.stones.length;
    }
  }

  const result = playMove(gameView, botColor, pointId);
  if (!result.ok) return null;
  const next = result.state;
  const ownGroup = collectGroup(next, pointId);
  const captured = Number(next.captures?.[botColor] ?? 0) - beforeCaptures;
  const center = (gameView.size - 1) / 2;
  const distance = Math.abs(point.x - center) + Math.abs(point.y - center);
  const fillsOwnEye = neighbors.length >= 3 && neighbors.every((neighborPoint) => neighborPoint.stone === botColor);
  const selfAtari = ownGroup.liberties.size <= 1 && captured === 0;
  const score = captured * 52
    + rescuedStones * 16
    + threatenedEnemies * 9
    + Math.max(0, connectedGroups.size - 1) * 7
    + Math.min(ownGroup.liberties.size, 6) * 2
    + Math.max(0, 5 - distance * 0.45)
    - (selfAtari ? 30 : 0)
    - (fillsOwnEye ? 24 : 0);
  return { pointId, score };
}

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

function shuffled(items, random) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}
