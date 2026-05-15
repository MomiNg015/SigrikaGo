import { describe, expect, it } from "vitest";
import { adminUsernameSet, isConfiguredAdminUsername } from "./adminConfig.js";

describe("admin config", () => {
  it("parses comma separated admin usernames", () => {
    expect([...adminUsernameSet(" alice, bob ,,carol ")]).toEqual(["alice", "bob", "carol"]);
  });

  it("matches configured admin usernames after trimming", () => {
    expect(isConfiguredAdminUsername("alice", "alice,bob")).toBe(true);
    expect(isConfiguredAdminUsername(" mallory ", "alice,bob")).toBe(false);
  });
});
