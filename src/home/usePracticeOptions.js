import { useState } from "react";
import { CAPTURE_CHALLENGE_MODE } from "../shared/captureChallenge.js";
import { PRACTICE_PUBLIC_DIFFICULTY_IDS } from "../shared/practiceMode.js";

function readOptions(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return {
      mode: ["practice", CAPTURE_CHALLENGE_MODE].includes(saved?.mode) ? saved.mode : null,
      difficulty: PRACTICE_PUBLIC_DIFFICULTY_IDS.includes(saved?.difficulty) ? saved.difficulty : "beginner"
    };
  } catch {
    return { mode: null, difficulty: "beginner" };
  }
}

export function usePracticeOptions(user) {
  const key = `sigrika-practice-options:${user.id ?? user.username}`;
  const [saved, setSaved] = useState(() => ({ key, ...readOptions(key) }));
  if (saved.key !== key) setSaved({ key, ...readOptions(key) });
  function update(options) {
    const next = { ...saved, ...options, key };
    setSaved(next);
    try { localStorage.setItem(key, JSON.stringify({ mode: next.mode, difficulty: next.difficulty })); }
    catch { /* Optional cache; the current selection remains usable. */ }
  }
  return { mode: saved.mode, difficulty: saved.difficulty, update };
}
