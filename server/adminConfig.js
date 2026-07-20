export const USER_ROLES = {
  player: "player",
  admin: "admin"
};

export const USER_STATUS = {
  active: "active",
  banned: "banned"
};

export async function promoteExistingUserToAdmin({ prisma, username }) {
  const user = await prisma.user.findUnique({
    where: { username }
  });
  if (!user) {
    return {
      ok: false,
      changed: false,
      reason: "not_found",
      username
    };
  }
  if (user.role === USER_ROLES.admin) {
    return {
      ok: true,
      changed: false,
      user
    };
  }
  const promotedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: USER_ROLES.admin }
  });
  return {
    ok: true,
    changed: true,
    user: promotedUser
  };
}
