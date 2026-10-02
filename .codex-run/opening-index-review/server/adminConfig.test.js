import { describe, expect, it, vi } from "vitest";
import { promoteExistingUserToAdmin, USER_ROLES } from "./adminConfig.js";

describe("admin config", () => {
  it("promotes an existing player to admin", async () => {
    const player = { id: "user-1", username: "alice", role: USER_ROLES.player };
    const admin = { ...player, role: USER_ROLES.admin };
    const prisma = {
      user: {
        findUnique: vi.fn(async () => player),
        update: vi.fn(async () => admin)
      }
    };

    const result = await promoteExistingUserToAdmin({ prisma, username: "alice" });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: "alice" } });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { role: USER_ROLES.admin }
    });
    expect(result).toEqual({ ok: true, changed: true, user: admin });
  });

  it("is idempotent for an existing admin", async () => {
    const admin = { id: "user-1", username: "alice", role: USER_ROLES.admin };
    const prisma = {
      user: {
        findUnique: vi.fn(async () => admin),
        update: vi.fn()
      }
    };

    const result = await promoteExistingUserToAdmin({ prisma, username: "alice" });

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, changed: false, user: admin });
  });

  it("fails safely when the user does not exist", async () => {
    const prisma = {
      user: {
        findUnique: vi.fn(async () => null),
        update: vi.fn()
      }
    };

    const result = await promoteExistingUserToAdmin({ prisma, username: "missing" });

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      changed: false,
      reason: "not_found",
      username: "missing"
    });
  });
});
