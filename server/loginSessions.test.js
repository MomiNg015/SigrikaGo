import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { createLoginSessionStore } from "./loginSessions.js";
import { withToken } from "./auth.js";

describe("login session store", () => {
  it("tracks a single active session per user", () => {
    const sessions = createLoginSessionStore();
    const first = sessions.create("user-1");
    expect(sessions.hasActive("user-1")).toBe(true);
    expect(sessions.isActive("user-1", first)).toBe(true);

    const second = sessions.replace("user-1");

    expect(second).not.toBe(first);
    expect(sessions.isActive("user-1", first)).toBe(false);
    expect(sessions.isActive("user-1", second)).toBe(true);
  });

  it("adopts a token session after an in-memory session store restart", () => {
    const sessions = createLoginSessionStore();

    expect(sessions.adopt("user-1", "restored-session")).toBe(true);
    expect(sessions.isActive("user-1", "restored-session")).toBe(true);
  });

  it("does not adopt a different token when a session already exists", () => {
    const sessions = createLoginSessionStore();
    const active = sessions.create("user-1");

    expect(sessions.adopt("user-1", "other-session")).toBe(false);
    expect(sessions.isActive("user-1", active)).toBe(true);
  });

  it("does not re-adopt a session that was explicitly cleared", () => {
    const sessions = createLoginSessionStore();
    const active = sessions.create("user-1");

    sessions.clear("user-1", active);

    expect(sessions.adopt("user-1", active)).toBe(false);
    expect(sessions.hasActive("user-1")).toBe(false);
  });

  it("signs tokens with the active session id", () => {
    const sessions = createLoginSessionStore();
    const sessionId = sessions.create("user-1");
    const response = withToken(testUser("user-1"), "secret", { sessionId });
    const payload = jwt.verify(response.token, "secret");

    expect(payload).toMatchObject({ sub: "user-1", sid: sessionId });
  });
});

function testUser(id) {
  return {
    id,
    username: "alice",
    role: "player",
    status: "active",
    rating: 1000,
    wins: 0,
    losses: 0,
    coins: 300,
    selectedCharacter: "sigrika",
    selectedStoneDecoration: "",
    ownedCharacters: "sigrika,danea,aemeath",
    ownedItems: "",
    itemEffects: "",
    ownedDecorations: ""
  };
}
