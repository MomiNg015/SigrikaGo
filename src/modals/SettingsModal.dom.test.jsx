// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SettingsModal from "./SettingsModal.jsx";
import InteractionFeedback from "../app/InteractionFeedback.jsx";
import { playUiUnavailableSound } from "../audio/playback.jsx";

vi.mock("../audio/playback.jsx", () => ({
  playUiUnavailableSound: vi.fn(), playUiConfirmSound: vi.fn(), playUiCloseWindowSound: vi.fn(), UI_UNAVAILABLE_SHAKE_MS: 1200
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("unreleased interface themes", () => {
  it("shows one notice and unavailable feedback per pointer/keyboard activation without changing theme", () => {
    const onNotice = vi.fn();
    const setVisualTheme = vi.fn();
    const onClose = vi.fn();
    render(<><InteractionFeedback /><SettingsModal audioSettings={{ master: 100 }} setAudioSettings={vi.fn()} onNotice={onNotice} setVisualTheme={setVisualTheme} onClose={onClose} /></>);
    fireEvent.click(screen.getByRole("tab", { name: "界面" }));
    const buttons = screen.getAllByRole("button").filter(button => button.getAttribute("aria-disabled") === "true");
    expect(buttons).toHaveLength(2);
    const button = buttons[0];
    fireEvent(button, new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
    fireEvent.click(button, { detail: 1 });
    expect(onNotice).toHaveBeenCalledExactlyOnceWith("敬请期待~", "success");
    expect(playUiUnavailableSound).toHaveBeenCalledTimes(1);
    expect(button.classList.contains("ui-unavailable-shake")).toBe(true);
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.keyDown(button, { key: "Enter", repeat: true });
    fireEvent.keyUp(button, { key: "Enter" });
    expect(onNotice).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(buttons[1], { key: " " });
    fireEvent.keyUp(buttons[1], { key: " " });
    expect(onNotice).toHaveBeenCalledTimes(3);
    expect(setVisualTheme).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(document.querySelector('.theme-choice-button[aria-pressed="true"]'));
    expect(setVisualTheme).toHaveBeenCalledExactlyOnceWith("bright-school");
    expect(onNotice).toHaveBeenCalledTimes(3);
  });
});
