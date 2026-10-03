import { isPracticePlayerColor, requestedPracticeDifficulty } from "../src/shared/practiceMode.js";
import { CAPTURE_CHALLENGE_MODE } from "../src/shared/captureChallenge.js";
import { LOCAL_PRACTICE_VERSION, LOCAL_PRACTICE_BACKEND } from "../src/shared/localPractice.js";

const INVALID_OPTIONS = "练习设置无效";

export function registerPracticeSocketEvents(socket, {
  io,
  refreshSocketUser,
  createPracticeRoom,
  isUserInActiveRoom,
  leaveMatchmaking,
  broadcastLobbyStats = () => {},
  practiceEngineReady = async () => ({ ok: true }),
  localPracticeEngine = null,
  runtimeServiceState = null,
  metrics = null
}) {
  socket.on("practice:compute", (payload, acknowledge) => {
    acknowledge?.(localPracticeEngine?.request(socket, payload) ?? { ok: false, code: "local_practice_unavailable" });
  });
  socket.on("practice:computed", (payload, acknowledge) => {
    acknowledge?.(localPracticeEngine?.submit(socket, payload, io) ?? { ok: false, code: "local_practice_unavailable" });
  });
  socket.on("practice:start", async (payload = {}, acknowledge) => {
    payload ??= {};
    const difficulty = requestedPracticeDifficulty(payload.difficulty);
    if (!difficulty || !isPracticePlayerColor(payload.playerColor)
      || (payload.challenge != null && (payload.challenge !== CAPTURE_CHALLENGE_MODE || difficulty.id !== "advanced"))) {
      acknowledge?.({ ok: false, error: INVALID_OPTIONS, code: "invalid_practice_options" });
      return;
    }
    const admission = runtimeServiceState?.admission?.("match") ?? { ok: true };
    if (!admission.ok) {
      metrics?.increment?.("admissionRejectedMatches");
      acknowledge?.({ ok: false, error: admission.error, code: "capacity_reached" });
      return;
    }
    try {
      await refreshSocketUser(socket);
      if (isUserInActiveRoom(socket.user.id)) {
        acknowledge?.({ ok: false, error: "你已有进行中的对局", code: "active_room_exists" });
        return;
      }
      const local = payload.engineVersion === LOCAL_PRACTICE_VERSION;
      if (localPracticeEngine && !local) {
        acknowledge?.({ ok: false, code: "local_practice_version", error: "请刷新页面，加载本机陪练引擎后重试" });
        return;
      }
      if (!local && difficulty.strategy === "gnugo") {
        const engineStatus = await practiceEngineReady().catch(() => ({ ok: false }));
        if (!engineStatus?.ok) {
          acknowledge?.({
            ok: false,
            error: "准时宝的 GNU Go 引擎暂时不可用，请联系管理员",
            code: "practice_engine_unavailable"
          });
          return;
        }
      }
      leaveMatchmaking(socket.user.id);
      const room = createPracticeRoom(
        { user: socket.user, socketId: socket.id, mode: "spark" },
        io,
        { difficulty: difficulty.id, playerColor: payload.playerColor,
          ...(local ? { engineBackend: LOCAL_PRACTICE_BACKEND } : {}),
          ...(payload.challenge ? { challenge: payload.challenge } : {}) }
      );
      acknowledge?.({ ok: true, roomCode: room.code });
      broadcastLobbyStats();
    } catch (error) {
      acknowledge?.({ ok: false, error: error.code === "active_room_exists" ? error.message : "登录状态已失效，请重新登录", code: error.code === "active_room_exists" ? error.code : "auth_expired" });
    }
  });
}
