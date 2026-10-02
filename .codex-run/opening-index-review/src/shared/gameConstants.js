export const COLORS = {
  black: "black",
  white: "white"
};

export const NEUTRAL_STONES = {
  spray: "spray"
};

export const PLAYER_COLORS = Object.freeze(Object.values(COLORS));
export const NEUTRAL_STONE_TYPES = Object.freeze(Object.values(NEUTRAL_STONES));

export function opponent(color) {
  return color === COLORS.black ? COLORS.white : COLORS.black;
}

export function isPlayerColor(stone) {
  return PLAYER_COLORS.includes(stone);
}

export function isNeutralStone(stone) {
  return NEUTRAL_STONE_TYPES.includes(stone);
}

export function captureCreditOwner(stone) {
  return isPlayerColor(stone) ? opponent(stone) : null;
}

export function canSprayTransformStone(point) {
  return Boolean(point?.valid && point.stone && point.stone !== NEUTRAL_STONES.spray && !point.hiddenHand);
}
