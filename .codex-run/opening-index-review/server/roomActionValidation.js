import { validatePointId } from "./security.js";

export function validateActionPoint(action, boardSize) {
  if (!action || typeof action !== "object") return "未知操作";
  if (action.pointId == null) return null;
  const point = validatePointId(action.pointId, boardSize);
  return point.ok ? null : point.error;
}
