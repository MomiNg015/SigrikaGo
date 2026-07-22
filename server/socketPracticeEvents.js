import { isPracticePlayerColor, practiceDifficulty } from "../src/shared/practiceMode.js";

const INVALID_OPTIONS = "练习设置无效";

export function registerPracticeSocketEvents(socket, {
  io,
  refreshSocketUser,
  createPracticeRoom,
  isUserInActiveRoom,
  leaveMatchmaking,
  broadcastLobbyStats = () => {},
  runtimeServiceState = null,
  metrics = null
}) {
  socket.on("practice:start", async (payload = {}, acknowledge) => {
    const difficulty = practiceDifficulty(payload.difficulty);
    if (!difficulty || !isPracticePlayerColor(payload.playerColor)) {
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
      leaveMatchmaking(socket.user.id);
      const room = createPracticeRoom(
        { user: socket.user, socketId: socket.id, mode: "spark" },
        io,
        { difficulty: difficulty.id, playerColor: payload.playerColor }
      );
      acknowledge?.({ ok: true, roomCode: room.code });
      broadcastLobbyStats();
    } catch {
      acknowledge?.({ ok: false, error: "登录状态已失效，请重新登录", code: "auth_expired" });
    }
  });
}
