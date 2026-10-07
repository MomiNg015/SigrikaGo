import { useState } from "react";
import { availableTeamCharacters } from "./TeamLineupPicker.jsx";

export const MATCH_CHARACTER_NOTICE = "尚未选择角色，无法匹配";
const ENTRIES = ["standard", "gomoku", "regular", "capture", "team"];

export function useMatchCharacterSelection(user, characters) {
  const storageKey = `sigrika-match-characters:${user.id ?? user.username}`;
  const [saved, setSaved] = useState(() => read(storageKey));
  // Reload synchronously when the account changes so another account's lineup cannot render.
  const [accountKey, setAccountKey] = useState(storageKey);
  if (accountKey !== storageKey) {
    setAccountKey(storageKey);
    setSaved(read(storageKey));
  }
  const available = availableTeamCharacters(user, characters);
  const availableIds = new Set(available.map((character) => character.id));
  const selections = Object.fromEntries(ENTRIES.map((entry) => [entry,
    [...new Set(Array.isArray(saved[entry]) ? saved[entry] : [])].filter((id) => availableIds.has(id)).slice(0, entry === "team" ? 3 : 1)
  ]));
  function select(entry, ids) {
    const next = { ...selections, [entry]: ids };
    setSaved(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Cache is optional. */ }
  }
  return { available, selections, select };
}

function read(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
