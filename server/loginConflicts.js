export function shouldBlockLoginForActiveAccount({
  onlineSessions,
  userId,
  forceLogin = false
} = {}) {
  if (forceLogin) return false;
  return Boolean(userId && onlineSessions?.hasOnlineUser?.(userId));
}
