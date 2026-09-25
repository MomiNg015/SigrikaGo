import { canonicalCharacterId } from "./characterAliases.js";

export const TEAM_MODE = "team";
export const TEAM_ROUND_DURATION_MS = 5000;
export const TEAM_ROUND_LIMITS = [40, 80];
export const TEAM_MINIMUM_NOTICE = "需要至少拥有3名部员才能参加";

export function isTeamMatch(room) {
  return room?.mode === TEAM_MODE;
}

export function normalizeTeamLineup(value) {
  return Array.isArray(value) ? value.map((id) => canonicalCharacterId(typeof id === "string" ? id : "")) : [];
}
