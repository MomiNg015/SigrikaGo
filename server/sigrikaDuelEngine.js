import { practiceDifficulty } from "../src/shared/practiceMode.js";

export const SIGRIKA_DUEL_ENGINE_CHAIN = Object.freeze(["advanced", "intermediate", "beginner"]);

export async function chooseSigrikaDuelAction({
  view,
  botColor,
  practiceEngine,
  chooseHeuristicAction,
  isLegalAction,
  onFallback = () => {}
}) {
  for (const difficultyId of SIGRIKA_DUEL_ENGINE_CHAIN) {
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
