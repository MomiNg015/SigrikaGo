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

describe("about and author notes", () => {
  it("closes from the backdrop but not when toggling or clicking inside the dialog", () => {
    const onClose = vi.fn();
    const view = render(<SettingsModal audioSettings={{ master: 100 }} setAudioSettings={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole("tab", { name: "关于" }));
    fireEvent.click(screen.getByRole("button", { name: "碎碎念", exact: true }));
    fireEvent.click(screen.getByRole("region", { name: "碎碎念" }));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(view.container.querySelector(".modal-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  function openAbout(siteSettings) {
    render(<SettingsModal siteSettings={siteSettings} audioSettings={{ master: 100 }} setAudioSettings={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("tab", { name: "关于" }));
  }

  it("replaces only the reading content, resets scrolling and keeps a single return button", () => {
    openAbout({ aboutText: "网站信息", aboutNotesText: "第一行\n<script>这是纯文本</script>" });
    const about = screen.getByRole("region", { name: "网站信息" });
    about.scrollTop = 100;
    const toggle = screen.getByRole("button", { name: "碎碎念", exact: true });
    toggle.focus();
    fireEvent.click(toggle);
    expect(screen.queryByRole("region", { name: "网站信息" })).toBeNull();
    const notes = screen.getByRole("region", { name: "碎碎念" });
    expect(notes.textContent).toBe("第一行\n<script>这是纯文本</script>");
    expect(notes.querySelector("script")).toBeNull();
    expect(notes.scrollTop).toBe(0);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "返回", exact: true })).toBe(toggle);
    expect(document.activeElement).toBe(toggle);
    notes.scrollTop = 200;
    fireEvent.click(toggle);
    expect(screen.getByRole("region", { name: "网站信息" }).scrollTop).toBe(0);
    expect(toggle.textContent).toBe("碎碎念");
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("tab", { name: "界面" }));
    fireEvent.click(screen.getByRole("tab", { name: "关于" }));
    expect(screen.getByRole("region", { name: "网站信息" })).toBeTruthy();
  });

  it.each([undefined, "", " \n "])("keeps return available for missing or blank notes: %s", (aboutNotesText) => {
    openAbout({ aboutText: "原有网站信息", aboutNotesText });
    fireEvent.click(screen.getByRole("button", { name: "碎碎念", exact: true }));
    expect(screen.getByText("还没有写下碎碎念。")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "返回", exact: true }));
    expect(screen.getByText("原有网站信息")).toBeTruthy();
  });
});

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
