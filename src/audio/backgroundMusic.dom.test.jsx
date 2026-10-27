// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { BackgroundMusic } from "./backgroundMusic.jsx";
import { ModalDialog } from "../modals/modalComponents.jsx";
import { DEFAULT_AUDIO_SETTINGS } from "./audioSettings.js";
import { requestBackgroundMusicPause } from "./backgroundMusicPause.js";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("filters local windows without restarting playback, preserves mute and reuses the bus on track changes", async () => {
  const parameter = (value) => ({ value, cancelAndHoldAtTime: vi.fn(), cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  const filter = { frequency: parameter(20000), Q: { value: 1 }, connect: vi.fn() };
  const sources = [];
  const gains = [];
  const context = {
    state: "running", currentTime: 1, sampleRate: 48000, destination: {},
    decodeAudioData: vi.fn(async () => ({ duration: 60 })),
    createBiquadFilter: vi.fn(() => filter),
    createGain: () => {
      const gain = { gain: parameter(1), connect: vi.fn(), disconnect: vi.fn() };
      gains.push(gain);
      return gain;
    },
    createBufferSource: () => {
      const source = { connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      sources.push(source);
      return source;
    }
  };
  vi.stubGlobal("AudioContext", class { constructor() { return context; } });
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })));
  const track = { id: "home", playback: { src: "/home.ogg", loop: true } };
  function scene({ open = false, nested = false, windowFocused = false, muted = false, music = track } = {}) {
    return <>
      <BackgroundMusic track={music} windowFocused={windowFocused} audioSettings={{ ...DEFAULT_AUDIO_SETTINGS, muted: { bgm: muted } }} />
      {open && <ModalDialog ariaLabel="设置">settings</ModalDialog>}
      {nested && <ModalDialog ariaLabel="确认">confirmation</ModalDialog>}
    </>;
  }
  const view = render(scene());
  await waitFor(() => expect(sources).toHaveLength(1));
  view.rerender(scene({ open: true, nested: true }));
  expect(filter.frequency.exponentialRampToValueAtTime).toHaveBeenLastCalledWith(900, 1.5);
  view.rerender(scene({ open: true, muted: true }));
  expect(gains[0].gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 1.12);
  expect(sources).toHaveLength(1);
  view.rerender(scene({ windowFocused: true }));
  expect(filter.frequency.exponentialRampToValueAtTime).toHaveBeenLastCalledWith(900, 1.5);
  view.rerender(scene({ windowFocused: true, music: { ...track, id: "battle", playback: { src: "/battle.ogg", loop: true } } }));
  await waitFor(() => expect(sources).toHaveLength(2));
  expect(context.createBiquadFilter).toHaveBeenCalledOnce();
  view.rerender(scene({ music: { ...track, id: "battle", playback: { src: "/battle.ogg", loop: true } } }));
  expect(filter.frequency.exponentialRampToValueAtTime).toHaveBeenLastCalledWith(20000, 1.5);
  expect(sources).toHaveLength(2);
  const release = requestBackgroundMusicPause();
  try {
    // A hard pause must also stop the previous track still fading out.
    expect(sources[0].stop).toHaveBeenLastCalledWith();
    expect(sources[1].stop).toHaveBeenLastCalledWith();
  } finally { view.unmount(); release(); }
});

it("cancels music still decoding when the negative entrance requests silence", async () => {
  let decoded;
  const context = { state: "running", currentTime: 1,
    decodeAudioData: vi.fn(() => new Promise((resolve) => { decoded = resolve; })),
    createBufferSource: vi.fn(), createGain: vi.fn() };
  vi.stubGlobal("AudioContext", class { constructor() { return context; } });
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })));
  const view = render(<BackgroundMusic track={{ id: "home", playback: { src: "/delayed.ogg", loop: true } }} audioSettings={DEFAULT_AUDIO_SETTINGS} />);
  await waitFor(() => expect(context.decodeAudioData).toHaveBeenCalledOnce());
  const release = requestBackgroundMusicPause();
  try {
    await act(async () => { decoded({ duration: 60 }); });
    expect(context.createBufferSource).not.toHaveBeenCalled();
    expect(context.createGain).not.toHaveBeenCalled();
  } finally { view.unmount(); release(); }
});
