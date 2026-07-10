// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CharacterMusicPreview } from "./CharacterMusicPreview.jsx";

const baseTrack = track("base", "普通技能曲");
const derivedTrack = track("derived-default", "远航星默认曲");
const derivedAltTrack = track("derived-alt", "远航星特别长的备用试听曲目名称");

describe("CharacterMusicPreview interaction", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback) => window.setTimeout(callback, 0));
    vi.stubGlobal("cancelAnimationFrame", (id) => window.clearTimeout(id));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("switches skill tabs and keeps the floating track sheet open after selection", async () => {
    const onTrackChange = vi.fn().mockResolvedValue({});
    renderPlayer(onTrackChange);

    fireEvent.click(screen.getByRole("button", { name: /打开曲目单/ }));
    const baseTab = await screen.findByRole("tab", { name: "普通技·小爱出击" });
    expect(baseTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("region", { name: "角色技能曲目单" }).parentElement?.classList.contains("nested-modal-backdrop")).toBe(true);

    fireEvent.click(await screen.findByRole("tab", { name: "派生技·远航星" }));
    expect(screen.getByRole("tab", { name: "派生技·远航星" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("listbox", { name: "派生技·远航星曲目" })).toBeTruthy();

    fireEvent.click(screen.getByRole("option", { name: derivedAltTrack.name }));
    await waitFor(() => expect(onTrackChange).toHaveBeenCalledWith({
      trackId: "derived-alt",
      effectType: "voyage-star"
    }));

    expect(screen.getByRole("region", { name: "角色技能曲目单" })).toBeTruthy();
    expect(screen.getByRole("button", { name: new RegExp(`当前曲目 ${derivedAltTrack.name}`) })).toBeTruthy();
  });

  it("rolls a rejected selection back and exposes an in-sheet retry", async () => {
    const onTrackChange = vi.fn().mockRejectedValue(new Error("保存失败"));
    renderPlayer(onTrackChange);

    fireEvent.click(screen.getByRole("button", { name: /打开曲目单/ }));
    fireEvent.click(await screen.findByRole("tab", { name: "派生技·远航星" }));
    fireEvent.click(screen.getByRole("option", { name: derivedAltTrack.name }));

    expect(await screen.findByRole("button", { name: "保存失败 · 点击重试" })).toBeTruthy();
    expect(screen.getByRole("option", { name: /远航星默认曲，已选择/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("region", { name: "角色技能曲目单" })).toBeTruthy();
  });
});

function renderPlayer(onTrackChange) {
  return render(
    <div className="app-shell player-theme-enabled theme-bright-school">
      <div className="nested-modal-backdrop">
        <CharacterMusicPreview
          characterId="aemeath"
          slots={[
            {
              id: "base",
              effectType: "",
              label: "普通技·小爱出击",
              shortLabel: "普通技",
              track: baseTrack,
              options: [baseTrack]
            },
            {
              id: "derived:voyage-star",
              effectType: "voyage-star",
              label: "派生技·远航星",
              shortLabel: "远航星",
              track: derivedTrack,
              options: [derivedTrack, derivedAltTrack]
            }
          ]}
          audioSettings={{}}
          onTrackChange={onTrackChange}
        />
      </div>
    </div>
  );
}

function track(id, name) {
  return {
    id,
    name,
    playback: { mode: "single-loop", src: `/${id}.ogg`, loop: true }
  };
}
