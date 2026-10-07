// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CharacterMusicPreview, MarqueeText } from "./CharacterMusicPreview.jsx";

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

    const closedTitle = screen.getByRole("button", { name: /打开曲目单/ });
    expect(closedTitle.textContent).toBe(baseTrack.name);
    fireEvent.click(closedTitle);
    const baseTab = await screen.findByRole("tab", { name: "普通技·小爱出击" });
    expect(baseTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("region", { name: "角色技能曲目单" }).parentElement?.classList.contains("nested-modal-backdrop")).toBe(true);

    fireEvent.click(await screen.findByRole("tab", { name: "派生技·远航星" }));
    expect(screen.getByRole("tab", { name: "派生技·远航星" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("listbox", { name: "派生技·远航星曲目" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /当前曲目 远航星默认曲/ }).textContent).toBe(derivedTrack.name);

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

  it("preserves the selected override and open sheet through fresh same-character slot payloads", async () => {
    const onTrackChange = vi.fn().mockResolvedValue({});
    const { rerender } = renderPlayer(onTrackChange);
    fireEvent.click(screen.getByRole("button", { name: /打开曲目单/ }));
    fireEvent.click(await screen.findByRole("tab", { name: "派生技·远航星" }));
    fireEvent.click(screen.getByRole("option", { name: derivedAltTrack.name }));
    await waitFor(() => expect(onTrackChange).toHaveBeenCalledTimes(1));
    rerender(playerMarkup(onTrackChange));
    expect(screen.getByRole("region", { name: "角色技能曲目单" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "派生技·远航星" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("button", { name: new RegExp(`当前曲目 ${derivedAltTrack.name}`) })).toBeTruthy();
    expect(screen.getByRole("option", { name: `${derivedAltTrack.name}，已选择` }).getAttribute("aria-selected")).toBe("true");
    expect(onTrackChange).toHaveBeenCalledTimes(1);
  });

  it("switches the fixed playback control through loading, pause, and play states", async () => {
    let resolveDecode;
    const decodePromise = new Promise((resolve) => {
      resolveDecode = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    }));
    vi.stubGlobal("AudioContext", class FakeAudioContext {
      constructor() {
        this.currentTime = 0;
        this.destination = {};
        this.state = "running";
      }

      createBufferSource() {
        return {
          connect() {},
          start() {},
          stop() {}
        };
      }

      createGain() {
        return {
          connect() {},
          disconnect() {},
          gain: { setValueAtTime() {} }
        };
      }

      decodeAudioData() {
        return decodePromise;
      }
    });
    renderPlayer(vi.fn().mockResolvedValue({}));

    const playButton = screen.getByRole("button", { name: "播放角色 BGM" });
    expect(playButton.getAttribute("aria-pressed")).toBe("false");
    expect(playButton.querySelector(".character-music-glyph")?.classList.contains("is-play")).toBe(true);

    fireEvent.click(playButton);
    const loadingButton = screen.getByRole("button", { name: "角色 BGM 加载中" });
    expect(loadingButton.querySelector(".character-music-glyph")?.classList.contains("is-loading")).toBe(true);
    expect(loadingButton.getAttribute("aria-pressed")).toBe("false");

    resolveDecode({ duration: 30 });
    const pauseButton = await screen.findByRole("button", { name: "暂停角色 BGM" });
    expect(pauseButton.querySelector(".character-music-glyph")?.classList.contains("is-pause")).toBe(true);
    expect(pauseButton.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(pauseButton);
    const resumedPlayButton = screen.getByRole("button", { name: "播放角色 BGM" });
    expect(resumedPlayButton.querySelector(".character-music-glyph")?.classList.contains("is-play")).toBe(true);
    expect(resumedPlayButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("animates only overflowing titles by their measured clipped distance", async () => {
    const clientWidth = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function getClientWidth() {
      return this.classList.contains("character-music-marquee-viewport") ? 80 : 0;
    });
    const scrollWidth = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(function getScrollWidth() {
      if (!this.classList.contains("character-music-marquee-content")) return 0;
      return this.textContent === "短曲" ? 40 : 160;
    });
    const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ cancel }));
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value: animate
    });

    try {
      const { rerender } = render(<MarqueeText text="一首非常非常长的角色技能试听曲" active />);
      await waitFor(() => expect(animate).toHaveBeenCalledTimes(1));
      const [keyframes, timing] = animate.mock.calls[0];
      expect(keyframes.at(-1).transform).toBe("translateX(-80px)");
      expect(timing.iterations).toBe(Infinity);

      animate.mockClear();
      rerender(<MarqueeText text="短曲" active />);
      await waitFor(() => expect(animate).not.toHaveBeenCalled());
    } finally {
      clientWidth.mockRestore();
      scrollWidth.mockRestore();
      if (originalAnimate) Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
      else delete HTMLElement.prototype.animate;
    }
  });

  it.each([false, true])("responds to dynamic reduced motion from initial reduce=%s and cleans up on inactivity/unmount", async (initiallyReduced) => {
    let reduced = initiallyReduced;
    const listeners = new Set();
    const preference = {
      get matches() { return reduced; },
      addEventListener: vi.fn((type, listener) => { if (type === "change") listeners.add(listener); }),
      removeEventListener: vi.fn((type, listener) => { if (type === "change") listeners.delete(listener); })
    };
    vi.stubGlobal("matchMedia", vi.fn(() => preference));
    const setReduced = (next) => act(() => {
      reduced = next;
      listeners.forEach((listener) => listener({ matches: next }));
    });
    const clientWidth = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(80);
    const scrollWidth = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(160);
    const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");
    const animations = [];
    const animate = vi.fn(() => {
      const animation = { cancel: vi.fn() };
      animations.push(animation);
      return animation;
    });
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    let unmount;
    try {
      const view = render(<MarqueeText text="一首特别长的试听曲目" active />);
      unmount = view.unmount;
      await waitFor(() => expect(listeners.size).toBe(1));
      expect(animate).toHaveBeenCalledTimes(initiallyReduced ? 0 : 1);
      if (initiallyReduced) setReduced(false);
      expect(animate).toHaveBeenCalledTimes(1);
      setReduced(true);
      expect(animations[0].cancel).toHaveBeenCalledTimes(1);
      expect(animate).toHaveBeenCalledTimes(1);
      setReduced(false);
      expect(animate).toHaveBeenCalledTimes(2);
      expect(animate.mock.calls[1][0].at(-1).transform).toBe("translateX(-80px)");
      view.rerender(<MarqueeText text="一首特别长的试听曲目" active={false} />);
      expect(animations[1].cancel).toHaveBeenCalledTimes(1);
      expect(listeners.size).toBe(0);
      setReduced(true);
      setReduced(false);
      expect(animate).toHaveBeenCalledTimes(2);
      view.rerender(<MarqueeText text="一首特别长的试听曲目" active />);
      expect(animate).toHaveBeenCalledTimes(3);
      expect(listeners.size).toBe(1);
      unmount();
      expect(animations[2].cancel).toHaveBeenCalledTimes(1);
      expect(listeners.size).toBe(0);
      setReduced(true);
      setReduced(false);
      expect(animate).toHaveBeenCalledTimes(3);
    } finally {
      unmount?.();
      clientWidth.mockRestore();
      scrollWidth.mockRestore();
      if (originalAnimate) Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
      else delete HTMLElement.prototype.animate;
    }
  });
});

function renderPlayer(onTrackChange) {
  return render(playerMarkup(onTrackChange));
}

function playerMarkup(onTrackChange) {
  return (
    <div className="app-shell player-theme-enabled theme-bright-school">
      <div className="nested-modal-backdrop">
        <CharacterMusicPreview
          characterId="aemeath"
          slots={[
            {
              id: "base",
              effectType: "",
              label: "普通技·小爱出击",
              track: baseTrack,
              options: [baseTrack]
            },
            {
              id: "derived:voyage-star",
              effectType: "voyage-star",
              label: "派生技·远航星",
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
