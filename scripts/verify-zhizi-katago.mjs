import "dotenv/config";
import { COLORS, createGameState } from "../src/shared/game.js";
import { createZhiziKataGoEngine } from "../server/zhiziKataGoEngine.js";

const engine = createZhiziKataGoEngine();

try {
  if (!engine.isEnabled()) {
    throw new Error("ZHIZI_ENABLED is not enabled");
  }
  const availability = await engine.ensureAvailable();
  if (!availability.ok) {
    throw new Error(`Zhizi availability check failed: ${availability.reason}`);
  }
  const game = createGameState([
    { userId: "verify-black", color: COLORS.black },
    { userId: "verify-white", color: COLORS.white }
  ]);
  game.size = 13;
  game.komi = 2.75;
  const result = await engine.search(game, COLORS.black);
  if (!result.ok) throw new Error(`Zhizi search failed: ${result.reason}`);
  const top = result.analysis?.candidates?.[0] ?? {};
  console.log(JSON.stringify({
    ok: true,
    engine: result.engine,
    action: result.action,
    topCandidate: {
      move: top.move,
      visits: top.visits,
      winrate: top.winrate,
      scoreLead: top.scoreLead
    }
  }, null, 2));
} finally {
  engine.close();
}
