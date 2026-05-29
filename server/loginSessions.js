export const ALREADY_LOGGED_IN_CODE = "already_logged_in";
export const ALREADY_LOGGED_IN_MESSAGE = "当前账号已登录了，确定继续登录吗？";

export function createLoginSessionStore() {
  const sessions = new Map();
  const revokedSessions = new Set();
  const sessionKey = (userId, sessionId) => `${userId}:${sessionId}`;
  const revoke = (userId, sessionId) => {
    if (userId && sessionId) revokedSessions.add(sessionKey(userId, sessionId));
  };
  return {
    create(userId) {
      const sessionId = crypto.randomUUID();
      revoke(userId, sessions.get(userId));
      sessions.set(userId, sessionId);
      return sessionId;
    },
    replace(userId) {
      return this.create(userId);
    },
    hasActive(userId) {
      return sessions.has(userId);
    },
    isActive(userId, sessionId) {
      return Boolean(sessionId) && sessions.get(userId) === sessionId;
    },
    adopt(userId, sessionId) {
      if (!userId || !sessionId || revokedSessions.has(sessionKey(userId, sessionId))) return false;
      if (!sessions.has(userId)) {
        sessions.set(userId, sessionId);
        return true;
      }
      return sessions.get(userId) === sessionId;
    },
    clear(userId, sessionId) {
      const activeSessionId = sessions.get(userId);
      if (!sessionId || activeSessionId === sessionId) {
        revoke(userId, sessionId ?? activeSessionId);
        sessions.delete(userId);
      }
    },
    clearUser(userId) {
      revoke(userId, sessions.get(userId));
      sessions.delete(userId);
    }
  };
}
