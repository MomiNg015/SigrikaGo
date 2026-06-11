import { describe, expect, it } from "vitest";
import { shouldRefreshHomeUser } from "./useHomeUserRefresh.js";

describe("home user refresh", () => {
  it("refreshes user data only for authenticated home views", () => {
    expect(shouldRefreshHomeUser({
      token: "token",
      user: { id: "user-1" },
      view: "home"
    })).toBe(true);

    expect(shouldRefreshHomeUser({
      token: "",
      user: { id: "user-1" },
      view: "home"
    })).toBe(false);
    expect(shouldRefreshHomeUser({
      token: "token",
      user: null,
      view: "home"
    })).toBe(false);
    expect(shouldRefreshHomeUser({
      token: "token",
      user: { id: "user-1" },
      view: "room"
    })).toBe(false);
  });
});
