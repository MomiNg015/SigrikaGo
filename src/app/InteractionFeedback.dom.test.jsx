// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InteractionFeedback from "./InteractionFeedback.jsx";
import { playUiCloseWindowSound, playUiConfirmSound, playUiUnavailableSound } from "../audio/playback.jsx";

vi.mock("../audio/playback.jsx", () => ({
  playUiCloseWindowSound: vi.fn(), playUiConfirmSound: vi.fn(), playUiUnavailableSound: vi.fn(), UI_UNAVAILABLE_SHAKE_MS: 1063
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

function mount(button, settings = { sfx: 0.5 }) {
  return render(<><InteractionFeedback audioSettings={settings} />{button}</>);
}
function press(target) {
  // jsdom has no PointerEvent constructor; preserve the browser's primary-button field.
  fireEvent(target, new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0 }));
}
function advance(ms) { act(() => vi.advanceTimersByTime(ms)); }

describe("global unavailable feedback", () => {
  it("includes disabled buttons with dedicated sounds and blocks clicks from nested icons", () => {
    const onClick = vi.fn();
    mount(<button disabled data-ui-sound="none" onClick={onClick}><span>Unavailable</span></button>);
    const label = screen.getByText("Unavailable");
    const button = screen.getByRole("button");
    press(label);
    fireEvent.click(label, { detail: 1 });
    advance(80);
    expect(playUiUnavailableSound).toHaveBeenCalledExactlyOnceWith({ sfx: 0.5 });
    expect(playUiConfirmSound).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
    expect(button.style.translate).toContain("calc(");
    expect(button.style.getPropertyPriority("translate")).toBe("important");
    advance(1100);
    expect(button.classList.contains("ui-unavailable-shake")).toBe(false);
    expect(button.style.translate).toBe("");
  });

  it.each(["Enter", " "])("blocks ARIA-disabled keyboard handlers and repeats for %s", (key) => {
    const onClick = vi.fn(); const onKeyDown = vi.fn(); const onKeyUp = vi.fn();
    mount(<div role="button" tabIndex={0} aria-disabled="true" onClick={onClick} onKeyDown={onKeyDown} onKeyUp={onKeyUp}>Locked</div>);
    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key });
    fireEvent.keyDown(button, { key, repeat: true });
    fireEvent.keyUp(button, { key });
    expect(playUiUnavailableSound).toHaveBeenCalledTimes(1);
    expect(onKeyDown).not.toHaveBeenCalled();
    expect(onKeyUp).not.toHaveBeenCalled();
    fireEvent.click(button, { detail: 0 });
    expect(playUiUnavailableSound).toHaveBeenCalledTimes(2);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("restarts consecutive presses and restores existing inline style when unmounted", () => {
    const view = mount(<button disabled style={{ translate: "3px 4px", transform: "rotate(7deg)" }}>Locked</button>);
    const button = screen.getByRole("button");
    button.style.setProperty("translate", "3px 4px", "important");
    press(button); advance(800); press(button); advance(400);
    expect(button.classList.contains("ui-unavailable-shake")).toBe(true);
    expect(playUiUnavailableSound).toHaveBeenCalledTimes(2);
    expect(button.style.transform).toBe("rotate(7deg)");
    view.unmount();
    expect(button.style.translate).toBe("3px 4px");
    expect(button.style.getPropertyPriority("translate")).toBe("important");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses a reduced-motion pulse while preserving existing filters", () => {
    window.matchMedia.mockReturnValue({ matches: true });
    mount(<button disabled style={{ filter: "grayscale(1)" }}>Locked</button>);
    const button = screen.getByRole("button");
    press(button); advance(200);
    expect(button.style.translate).toBe("");
    expect(button.style.filter).toMatch(/grayscale\(1\) brightness\(1\./);
    advance(1100);
    expect(button.style.filter).toBe("grayscale(1)");
  });

  it("retains enabled confirm/close sounds and dedicated sound suppression", () => {
    mount(<><button>Confirm</button><button className="close-button">Close</button><button data-ui-sound="none">Dedicated</button></>);
    for (const name of ["Confirm", "Close", "Dedicated"]) fireEvent.click(screen.getByText(name));
    expect(playUiConfirmSound).toHaveBeenCalledTimes(1);
    expect(playUiCloseWindowSound).toHaveBeenCalledTimes(1);
    expect(playUiUnavailableSound).not.toHaveBeenCalled();
  });

  it("covers fieldset-disabled buttons and dynamically disabled controls", () => {
    const { rerender } = mount(<fieldset disabled><button>Locked</button></fieldset>);
    press(screen.getByRole("button"));
    expect(playUiUnavailableSound).toHaveBeenCalledTimes(1);
    rerender(<><InteractionFeedback /><button aria-disabled="true">Locked</button></>);
    fireEvent.click(screen.getByRole("button"));
    expect(playUiUnavailableSound).toHaveBeenCalledTimes(2);
  });
});
