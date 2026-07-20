import { describe, expect, it, vi } from "vitest";
import { createVerificationFixtureHandlers } from "./verificationFixtureRoutes.js";

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

describe("verification fixture routes", () => {
  it("grants a character only in an explicitly enabled stability environment", async () => {
    const update = vi.fn().mockResolvedValue({});
    const handlers = createVerificationFixtureHandlers({
      prisma: { user: { update } },
      env: { NODE_ENV: "stability", ENABLE_TEST_ACTIONS: "true" }
    });
    const response = responseRecorder();

    await handlers.grantCharacter({
      user: { id: "user-1", ownedCharacters: "sigrika,denia" },
      body: { characterId: "aemeath" }
    }, response);

    expect(response.body).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { ownedCharacters: "sigrika,denia,aemeath" }
    });
  });

  it("promotes the authenticated capacity fixture without changing registration", async () => {
    const update = vi.fn().mockResolvedValue({});
    const handlers = createVerificationFixtureHandlers({
      prisma: { user: { update } },
      env: { NODE_ENV: "capacity", ENABLE_TEST_ACTIONS: "1" }
    });
    const response = responseRecorder();

    await handlers.promoteAdmin({ user: { id: "capacity-1" } }, response);

    expect(response.body).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: "capacity-1" },
      data: { role: "admin" }
    });
  });

  it.each(["production", "development", "test"])("returns 404 in %s", async (nodeEnv) => {
    const update = vi.fn();
    const handlers = createVerificationFixtureHandlers({
      prisma: { user: { update } },
      env: { NODE_ENV: nodeEnv, ENABLE_TEST_ACTIONS: "true" }
    });
    const response = responseRecorder();

    await handlers.promoteAdmin({ user: { id: "user-1" } }, response);

    expect(response.statusCode).toBe(404);
    expect(update).not.toHaveBeenCalled();
  });
});
