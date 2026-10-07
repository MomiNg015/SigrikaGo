// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { BackgroundMusic } from "./backgroundMusic.jsx";
import { ModalDialog } from "../modals/modalComponents.jsx";
import { DEFAULT_AUDIO_SETTINGS } from "./audioSettings.js";

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
});
