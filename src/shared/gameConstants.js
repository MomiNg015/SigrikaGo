export const COLORS = {
  black: "black",
  white: "white"
};

export function opponent(color) {
  return color === COLORS.black ? COLORS.white : COLORS.black;
}
