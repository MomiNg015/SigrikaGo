import { describe, expect, it, vi } from "vitest";
import { APP_OVERLAYS } from "./overlayRegistry.js";
import {
  buildAppOverlayProps,
  buildAppRouteProps
} from "./appShellProps.js";

describe("app shell prop adapters", () => {
  it("builds route props from grouped state, actions, and registered overlays", () => {
    const emit = vi.fn();
    const socket = { emit };
    const overlayProps = overlayPropsFixture();
    const props = buildAppRouteProps({
      overlayProps,
      routeActions: {
        onAuth: vi.fn(),
        startMatch: vi.fn()
      },
      routeState: {
        room: { code: "12345" },
        roomBackRequestId: 3,
        socket,
        view: "room",
        user: { id: "user-1" }
      }
    });

    props.onCountingRequest();
    props.onCountingRespond(true);

    expect(props.view).toBe("room");
    expect(props.user).toEqual({ id: "user-1" });
    expect(props.roomBackRequestId).toBe(3);
    expect(props.showHouse).toBe(true);
    expect(props.setShowHouse).toBe(overlayProps.setShowHouse);
    expect(emit).toHaveBeenCalledWith("counting:request", { roomCode: "12345" });
    expect(emit).toHaveBeenCalledWith("counting:respond", { roomCode: "12345", accepted: true });
  });

  it("builds overlay props from grouped state, actions, and registered overlays", () => {
    const showToast = vi.fn();
    const onRecruitmentInteractionLockChange = vi.fn();
    const overlayProps = overlayPropsFixture();
    const activeStoryPlayer = { script: { key: "story" }, labels: { next: "继续" }, onComplete: vi.fn() };
    const props = buildAppOverlayProps({
      overlayActions: {
        clearStoryPlayer: vi.fn(),
        onRecruitmentInteractionLockChange,
        openStoryPlayer: vi.fn(),
        showToast
      },
      overlayProps,
      overlayState: {
        activeStoryPlayer,
        resultModalOpen: false,
        toasts: []
      }
    });

    props.onMessageSubmitted();

    expect(props.showHouse).toBe(true);
    expect(props.setShowHouse).toBe(overlayProps.setShowHouse);
    expect(props.onRecruitmentInteractionLockChange).toBe(onRecruitmentInteractionLockChange);
    expect(props.storyPlayerScript).toMatchObject({
      ...activeStoryPlayer,
      open: props.openStoryPlayer,
      clear: props.clearStoryPlayer
    });
    expect(showToast).toHaveBeenCalledWith("感谢您的反馈！", "success");
  });
});

function overlayPropsFixture() {
  return Object.fromEntries(APP_OVERLAYS.flatMap(({ key, showProp, setterProp }) => [
    [showProp, key === "house"],
    [setterProp, vi.fn()]
  ]));
}
