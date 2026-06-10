import { describe, expect, it } from "vitest";
import { playerChatCount } from "./ChatBox.jsx";

describe("ChatBox", () => {
  it("counts only player chat messages for the collapsed badge", () => {
    expect(playerChatCount([
      { type: "system", kind: "game-start" },
      { type: "chat", text: "hello" },
      { type: "system", kind: "skill" },
      { type: "chat", text: "again" },
      { type: "system", kind: "disconnect" }
    ])).toBe(2);
  });
});
