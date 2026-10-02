import { practiceDifficulty } from "../src/shared/practiceMode.js";

export const SIGRIKA_DUEL_ENGINE_CHAIN = Object.freeze(["zhizi", "advanced", "intermediate", "beginner"]);

export async function chooseSigrikaDuelAction({
  view,
  botColor,
  zhiziEngine = null,
  practiceEngine,
  chooseHeuristicAction,
  isLegalAction,
  onFallback = () => {}
}) {
  for (const difficultyId of SIGRIKA_DUEL_ENGINE_CHAIN) {
    if (difficultyId === "zhizi") {
      if (!zhiziEngine?.isEnabled?.()) continue;
      let result = null;
      try {
        result = await zhiziEngine.search(view, botColor);
      } catch {
        result = null;
      }
      if (result?.ok && result.action && isLegalAction(view, botColor, result.action)) {
        return { ok: true, action: result.action, difficultyId };
      }
      onFallback(difficultyId, result?.reason ?? "error");
      continue;
    }
    const difficulty = practiceDifficulty(difficultyId);
    let action = null;
    if (difficulty.strategy === "heuristic") {
      action = chooseHeuristicAction(view, botColor, difficulty);
    } else {
      try {
        const result = await practiceEngine.search(view, botColor, difficulty);
        action = result?.ok ? result.action : null;
      } catch {
        action = null;
      }
    }
    if (action && isLegalAction(view, botColor, action)) {
      return { ok: true, action, difficultyId };
    }
    onFallback(difficultyId);
  }
  return { ok: true, action: { type: "pass" }, difficultyId: "safe-pass" };
}
