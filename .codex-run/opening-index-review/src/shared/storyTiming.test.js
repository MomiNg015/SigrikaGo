import { describe, expect, it } from "vitest";
import {
  autoContinueEnabled,
  DEFAULT_NPC_DIALOGUE_AUTO_CONTINUE_SECONDS,
  delayMs,
  manualContinueEnabled,
  NODE_ADVANCE_MODES,
  nodeAdvanceControls,
  nodeAdvanceMode,
  nodeAdvanceModePatch,
  nodeAutoContinueDelayMs,
  optionTransitionDelayMs,
  optionalDelayMs,
  optionalDelaySeconds
} from "./storyTiming.js";

describe("story timing helpers", () => {
  it("normalizes optional non-negative second values for story scripts", () => {
    expect(optionalDelaySeconds("")).toBeNull();
    expect(optionalDelaySeconds(null)).toBeNull();
    expect(optionalDelaySeconds("1.25")).toBe(1.25);
    expect(optionalDelaySeconds(0)).toBe(0);
    expect(optionalDelaySeconds("-1")).toBeNull();
    expect(optionalDelaySeconds("abc")).toBeNull();
  });

  it("converts configured delays to milliseconds with explicit fallback behavior", () => {
    expect(optionalDelayMs("0.4")).toBe(400);
    expect(optionalDelayMs("")).toBeNull();
    expect(delayMs("", 1.5)).toBe(1500);
    expect(delayMs("0", 1.5)).toBe(0);
  });

  it("treats missing option transition delays as immediate navigation", () => {
    expect(optionTransitionDelayMs({})).toBe(0);
    expect(optionTransitionDelayMs({ transitionDelaySeconds: "" })).toBe(0);
    expect(optionTransitionDelayMs({ transitionDelaySeconds: "2.5" })).toBe(2500);
  });

  it("keeps legacy progression boolean helpers explicit", () => {
    expect(DEFAULT_NPC_DIALOGUE_AUTO_CONTINUE_SECONDS).toBe(1.5);
    expect(manualContinueEnabled({})).toBe(true);
    expect(manualContinueEnabled({ manualContinueEnabled: false })).toBe(false);
    expect(autoContinueEnabled({}, true)).toBe(true);
    expect(autoContinueEnabled({ autoContinueEnabled: false }, true)).toBe(false);
    expect(nodeAutoContinueDelayMs({ autoContinueDelaySeconds: "" }, 1.5)).toBe(1500);
  });

  it("uses a single advance mode with auto as the new authoring default", () => {
    expect(NODE_ADVANCE_MODES.auto).toBe("auto");
    expect(NODE_ADVANCE_MODES.manual).toBe("manual");
    expect(nodeAdvanceMode({})).toBe(NODE_ADVANCE_MODES.auto);
    expect(nodeAdvanceMode({ manualContinueEnabled: true, autoContinueEnabled: false })).toBe(NODE_ADVANCE_MODES.manual);
    expect(nodeAdvanceMode({ manualContinueEnabled: true, autoContinueEnabled: true })).toBe(NODE_ADVANCE_MODES.auto);
    expect(nodeAdvanceControls({ manualContinueEnabled: true, autoContinueEnabled: true })).toEqual({
      manualContinue: false,
      autoContinue: true
    });
    expect(nodeAdvanceModePatch(NODE_ADVANCE_MODES.auto)).toEqual({
      manualContinueEnabled: false,
      autoContinueEnabled: true
    });
    expect(nodeAdvanceModePatch(NODE_ADVANCE_MODES.manual)).toEqual({
      manualContinueEnabled: true,
      autoContinueEnabled: false
    });
  });
});
