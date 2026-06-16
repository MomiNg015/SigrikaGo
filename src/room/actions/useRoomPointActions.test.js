import { describe, expect, it } from "vitest";
import { canConfirmPointAction } from "./useRoomPointActions.js";

describe("room point action confirmation", () => {
  it("allows no-target skills to use a valid board point as a release confirmation", () => {
    expect(canConfirmPointAction({
      actionType: "skill",
      canConfirmSkillPoint: () => false,
      point: { id: "D4", valid: true, stone: "white" },
      skillUsesBoardConfirmation: true
    })).toBe(true);
  });

  it("keeps targeted skills bound to their target validator", () => {
    expect(canConfirmPointAction({
      actionType: "skill",
      canConfirmSkillPoint: () => false,
      point: { id: "D4", valid: true, stone: "white" },
      skillUsesBoardConfirmation: false
    })).toBe(false);
  });

  it("rejects invalid board points for no-target skill confirmations", () => {
    expect(canConfirmPointAction({
      actionType: "skill",
      canConfirmSkillPoint: () => false,
      point: { id: "A1", valid: false },
      skillUsesBoardConfirmation: true
    })).toBe(false);
  });

  it("allows surface-confirmed skills to release from any board point", () => {
    expect(canConfirmPointAction({
      actionType: "skill",
      canConfirmSkillPoint: () => false,
      point: { id: "A1", valid: false },
      skillUsesBoardConfirmation: true,
      skillUsesBoardSurfaceConfirmation: true
    })).toBe(true);
  });

  it("rejects banned-color ordinary moves on empty protocol-banned points", () => {
    expect(canConfirmPointAction({
      actionType: "move",
      me: { color: "white" },
      point: {
        id: "D4",
        valid: true,
        stone: null,
        protocolBan: { owner: "black", bannedColor: "white", effect: "protocol-takeover" }
      }
    })).toBe(false);
  });
});
