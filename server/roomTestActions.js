import { COLORS, GAME_PHASES, randomLayout, restoreSkillUse } from "../src/shared/game.js";
import { resetByoYomi } from "./roomClockTiming.js";
import { canUseDebugTestActions } from "./security.js";

export const ROOM_TEST_ACTION_TYPES = new Set([
  "test-random-layout",
  "test-restore-skill",
  "test-enter-byo-yomi"
]);

export function isRoomTestAction(action = {}) {
  return ROOM_TEST_ACTION_TYPES.has(action.type);
}

export function handleRoomTestAction({ action = {}, env = process.env, player, room }) {
  if (!isRoomTestAction(action)) return null;
  if (!canUseDebugTestActions(env)) {
    return { ok: false, error: "测试工具仅开发环境可用" };
  }

  const label = player.color === COLORS.black ? "黑" : "白";
  if (action.type === "test-enter-byo-yomi") {
    if (room.game.phase !== GAME_PHASES.playing) return { ok: false, error: "对局当前不能进入读秒" };
    player.time.main = 0;
    resetByoYomi(player);
    return {
      ok: true,
      result: null,
      room,
      skipByoYomiReset: true,
      systemMessage: `测试工具：${label}方已进入读秒。`
    };
  }

  if (action.type === "test-random-layout") {
    return {
      ok: true,
      result: randomLayout(room.game, { black: 50, white: 50 }),
      systemMessage: "测试工具：已生成随机布局。"
    };
  }

  return {
    ok: true,
    result: restoreSkillUse(room.game, player.color),
    systemMessage: `测试工具：${label}方已恢复技能次数。`
  };
}
