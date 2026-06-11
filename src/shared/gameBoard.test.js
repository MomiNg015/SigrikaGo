import { describe, expect, it } from "vitest";
import {
  BOARD_SIZE,
  activeNeighbors,
  createPoints,
  getPoint,
  isStarPoint,
  parsePointId,
  pointId
} from "./gameBoard.js";

describe("game board geometry", () => {
  it("creates the standard board with stable row-major point ids and neighbors", () => {
    const points = createPoints();

    expect(points).toHaveLength(BOARD_SIZE * BOARD_SIZE);
    expect(points[0]).toMatchObject({
      id: "0,0",
      x: 0,
      y: 0,
      valid: true,
      stone: null,
      mark: null,
      neighbors: ["1,0", "0,1"]
    });
    expect(points.at(-1)).toMatchObject({
      id: "12,12",
      neighbors: ["11,12", "12,11"]
    });
  });

  it("resolves point ids and active neighbors without depending on game rules", () => {
    const state = { size: 3, points: createPoints(3) };
    state.points[1].valid = false;

    expect(pointId(2, 1)).toBe("2,1");
    expect(parsePointId("2,1")).toEqual({ x: 2, y: 1 });
    expect(getPoint(state, "2,1")).toBe(state.points[5]);
    expect(activeNeighbors(state, state.points[4]).map((point) => point.id)).toEqual(["0,1", "2,1", "1,2"]);
  });

  it("uses standard star-point layouts for 13-line and 19-line boards", () => {
    const thirteenStars = collectStars(13);
    const nineteenStars = collectStars(19);

    expect(thirteenStars).toEqual(["3,3", "9,3", "6,6", "3,9", "9,9"]);
    expect(nineteenStars).toEqual([
      "3,3", "9,3", "15,3",
      "3,9", "9,9", "15,9",
      "3,15", "9,15", "15,15"
    ]);
  });
});

function collectStars(size) {
  const ids = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (isStarPoint(x, y, size)) ids.push(pointId(x, y));
    }
  }
  return ids;
}
