import {
  truncateUsernameToMaxWidthFromEnd,
  USERNAME_MAX_WIDTH,
  usernameDisplayWidth
} from "./security.js";

export function legacyUsernameSuffix(username) {
  const value = String(username ?? "").trim();
  if (usernameDisplayWidth(value) <= USERNAME_MAX_WIDTH) return value;
  return truncateUsernameToMaxWidthFromEnd(value);
}

export function uniqueLegacyUsernameSuffix(username, usedUsernames = new Set(), userId = "") {
  const base = legacyUsernameSuffix(username) || "user";
  if (!usedUsernames.has(base)) return base;

  for (let attempt = 2; attempt < 1000; attempt += 1) {
    const marker = `_${attempt}`;
    const candidate = `${truncateUsernameToMaxWidthFromEnd(base, USERNAME_MAX_WIDTH - marker.length)}${marker}`;
    if (!usedUsernames.has(candidate)) return candidate;
  }

  const idMarker = `_${String(userId).replace(/[^A-Za-z0-9_]/g, "").slice(-6) || "user"}`;
  return `${truncateUsernameToMaxWidthFromEnd(base, Math.max(1, USERNAME_MAX_WIDTH - idMarker.length))}${idMarker}`.slice(-USERNAME_MAX_WIDTH);
}

export async function cleanupLegacyUsernames(prisma) {
  if (!prisma?.user?.findMany || !prisma?.user?.update) return;
  const users = await prisma.user.findMany({
    select: { id: true, username: true },
    orderBy: { createdAt: "asc" }
  });
  const usedUsernames = new Set(
    users
      .filter((user) => usernameDisplayWidth(user.username) <= USERNAME_MAX_WIDTH)
      .map((user) => String(user.username ?? "").trim())
  );

  for (const user of users) {
    if (usernameDisplayWidth(user.username) <= USERNAME_MAX_WIDTH) continue;
    const nextUsername = uniqueLegacyUsernameSuffix(user.username, usedUsernames, user.id);
    usedUsernames.add(nextUsername);
    await prisma.user.update({
      where: { id: user.id },
      data: { username: nextUsername }
    });
  }
}
