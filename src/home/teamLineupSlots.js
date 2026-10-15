import { canonicalCharacterId } from "../shared/characterAliases.js";

export function teamLineupSlots(value, availableIds) {
  const seen = new Set();
  return Array.from({ length: 3 }, (_, index) => {
    const id = canonicalCharacterId(typeof value?.[index] === "string" ? value[index] : "");
    if (!id || seen.has(id) || (availableIds && !availableIds.has(id))) return "";
    seen.add(id);
    return id;
  });
}

export function toggleTeamMember(lineup, id) {
  const next = teamLineupSlots(lineup);
  const selected = next.indexOf(id);
  if (selected >= 0) next[selected] = "";
  else {
    const vacancy = next.indexOf("");
    if (vacancy >= 0) next[vacancy] = id;
  }
  return next;
}
