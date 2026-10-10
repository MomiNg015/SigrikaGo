// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SkillBanner from "./SkillBanner.jsx";
import { CHARACTERS } from "../shared/characters.js";
import { playSystemVoice } from "../audio/systemVoicePlayback.js";

vi.mock("../audio/systemVoicePlayback.js", () => ({ playSystemVoice: vi.fn() }));
vi.mock("../shared/systemVoices.js", async (importOriginal) => ({ ...await importOriginal(), resolveSystemVoice: () => ({ text: "释放技能" }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("SkillBanner lifecycle", () => {
  it("restarts animation only for a new cast and keeps voice deduplicated across snapshots", async () => {
    const banner = { id: "cast-1", characterId: "sigrika" };
    const { container, rerender } = render(<SkillBanner banner={banner} characters={CHARACTERS} />);
    const firstScene = container.querySelector('.skill-cutin-scene');
    await act(async () => rerender(<SkillBanner banner={{ ...banner }} characters={CHARACTERS} />));
    expect(container.querySelector('.skill-cutin-scene')).toBe(firstScene);
    expect(playSystemVoice).toHaveBeenCalledTimes(1);
    await act(async () => rerender(<SkillBanner banner={{ ...banner, id: "cast-2" }} characters={CHARACTERS} />));
    expect(container.querySelector('.skill-cutin-scene')).not.toBe(firstScene);
    expect(playSystemVoice).toHaveBeenCalledTimes(2);
  });
});
