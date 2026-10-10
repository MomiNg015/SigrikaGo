// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomeScreen from "./HomeScreen.jsx";
import TeamLineupPicker from "./TeamLineupPicker.jsx";
import { useCandyEffectCancellation } from "./useCandyEffectCancellation.js";
import { api } from "../api/client.js";
import { CHARACTERS } from "../shared/characters.js";
import { playMatchSortieVoice } from "./matchSortieVoice.js";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));
vi.mock("./matchSortieVoice.js", () => ({ playMatchSortieVoice: vi.fn() }));
afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks(); vi.unstubAllEnvs(); });
const initial = { id: "candy-picker", ownedCharacters: ["sigrika", "denia", "aemeath"],
  itemEffects: { sigrikaCandyDisabled: true, deniaRainbowGlow: true } };

function Harness({ team = false, token = "test-token", onNotice = vi.fn() }) {
  const [user, setUser] = useState(initial);
  const cancellation = useCandyEffectCancellation({ token, user, onUserChange: setUser, onNotice });
  return team ? <TeamLineupPicker user={user} characters={CHARACTERS} cancellation={cancellation} onClose={vi.fn()} />
    : <HomeScreen user={user} token={token} onUserChange={setUser} characters={CHARACTERS}
      matchModePickerOpen onNotice={onNotice} />;
}
function openPicker() {
  fireEvent.click(screen.getAllByRole("button", { name: "星炬对弈" }).at(-1));
  fireEvent.click(screen.getByRole("button", { name: "常规匹配选择角色" }));
}

describe("selection card candy cancellation", () => {
  it("cancels blocked Sigrika without selecting or closing, then restores her availability", async () => {
    let resolve;
    vi.mocked(api).mockImplementation(() => new Promise(done => { resolve = done; }));
    const onNotice = vi.fn();
    const { container } = render(<Harness onNotice={onNotice} />);
    openPicker();
    expect(screen.getByRole("button", { name: "西格莉卡", exact: true }).disabled).toBe(true);
    expect(container.querySelector("button button")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "取消西格莉卡的糖果效果" }));
    expect(api).toHaveBeenCalledWith("/api/items/rainbow-bean-candy/effects/sigrika/cancel", { method: "POST", token: "test-token" });
    expect(playMatchSortieVoice).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "选择角色" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "取消达妮娅的糖果效果" }).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "取消达妮娅的糖果效果" }));
    expect(api).toHaveBeenCalledTimes(1);
    resolve({ user: { ...initial, itemEffects: { deniaRainbowGlow: true } } });
    await waitFor(() => expect(screen.queryByRole("button", { name: "取消西格莉卡的糖果效果" })).toBeNull());
    expect(screen.getByRole("button", { name: "西格莉卡", exact: true }).disabled).toBe(false);
    expect(container.querySelectorAll(".character-candy-border")).toHaveLength(1);
    expect(onNotice).toHaveBeenCalledWith(expect.stringContaining("已取消"), "success");
  });

  it("keeps failed keyboard cancellation isolated and lets the user retry", async () => {
    vi.mocked(api).mockRejectedValue(new Error("取消失败"));
    const onNotice = vi.fn(), keyboard = userEvent.setup();
    render(<Harness onNotice={onNotice} />);
    openPicker();
    const button = screen.getByRole("button", { name: "取消达妮娅的糖果效果" });
    button.focus();
    await keyboard.keyboard("{Enter}");
    await waitFor(() => expect(button.disabled).toBe(false));
    await keyboard.keyboard(" ");
    expect(api).toHaveBeenCalledTimes(2);
    expect(onNotice).toHaveBeenCalledWith("取消失败", "danger");
    expect(playMatchSortieVoice).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "选择角色" })).toBeTruthy();
  });

  it("offers the separate action on team cards without adding a lineup member", async () => {
    vi.mocked(api).mockResolvedValue({ user: { ...initial, itemEffects: {} } });
    render(<Harness team />);
    fireEvent.click(screen.getByRole("button", { name: "取消达妮娅的糖果效果" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "取消达妮娅的糖果效果" })).toBeNull());
    expect(document.querySelectorAll('.team-lineup-slot[data-filled="true"]')).toHaveLength(0);
    expect(playMatchSortieVoice).not.toHaveBeenCalled();
  });

  it.each(["production", "unauthenticated"])("hides cancellation in %s", (mode) => {
    if (mode === "production") vi.stubEnv("DEV", false);
    render(<Harness token={mode === "unauthenticated" ? "" : "test-token"} />);
    openPicker();
    expect(screen.queryByRole("button", { name: /取消.*糖果效果/ })).toBeNull();
    expect(api).not.toHaveBeenCalled();
  });
});
