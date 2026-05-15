export const USER_ROLES = {
  player: "player",
  admin: "admin"
};

export const USER_STATUS = {
  active: "active",
  banned: "banned"
};

export function adminUsernameSet(value = process.env.ADMIN_USERNAMES ?? "") {
  return new Set(
    String(value)
      .split(",")
      .map((username) => username.trim())
      .filter(Boolean)
  );
}

export function isConfiguredAdminUsername(username, value = process.env.ADMIN_USERNAMES ?? "") {
  return adminUsernameSet(value).has(String(username ?? "").trim());
}

export async function promoteConfiguredAdmins(prisma) {
  const usernames = [...adminUsernameSet()];
  if (usernames.length === 0) return;
  await prisma.user.updateMany({
    where: { username: { in: usernames } },
    data: { role: USER_ROLES.admin }
  });
}

export async function syncConfiguredAdmin(user, prisma) {
  if (!isConfiguredAdminUsername(user.username) || user.role === USER_ROLES.admin) return user;
  return prisma.user.update({
    where: { id: user.id },
    data: { role: USER_ROLES.admin }
  });
}
