import { useState } from "react";
import { availableTeamCharacters } from "./TeamLineupPicker.jsx";
import { teamLineupSlots } from "./teamLineupSlots.js";
import { matchCharacterStorageKey, readMatchCharacters } from "../shared/studentIdentity.js";

export const MATCH_CHARACTER_NOTICE = "尚未选择角色，无法匹配";
const ENTRIES = ["standard", "gomoku", "regular", "capture", "practice", "team"];

export function useMatchCharacterSelection(user, characters) {
  const storageKey = matchCharacterStorageKey(user);
  const [saved, setSaved] = useState(() => readMatchCharacters(user));
  // Reload synchronously when the account changes so another account's lineup cannot render.
  const [accountKey, setAccountKey] = useState(storageKey);
  if (accountKey !== storageKey) {
    setAccountKey(storageKey);
    setSaved(readMatchCharacters(user));
  }
  const available = availableTeamCharacters(user, characters);
  const availableIds = new Set(available.map((character) => character.id));
  const selections = Object.fromEntries(ENTRIES.map((entry) => [entry,
    entry === "team" ? teamLineupSlots(saved[entry], availableIds)
      : [...new Set(Array.isArray(saved[entry]) ? saved[entry] : [])].filter((id) => availableIds.has(id)).slice(0, 1)
  ]));
  function select(entry, ids) {
    const next = { ...selections, [entry]: ids };
    setSaved(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Cache is optional. */ }
  }
  return { available, selections, select };
}
