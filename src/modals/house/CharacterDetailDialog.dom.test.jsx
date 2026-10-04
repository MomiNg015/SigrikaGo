// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHARACTERS } from "../../shared/characters.js";
import { DENIA_CANDY_PORTRAIT } from "../../shared/candyPortraits.js";
import { SIGRIKA_CORRUPTED_PORTRAIT_ASSET } from "../../shared/characterPortraitAssetCatalog.js";
import { CharacterDetailDialog } from "./HouseNestedDialogs.jsx";

afterEach(cleanup);

function detailProps(overrides = {}) {
  return {
    character: CHARACTERS.sigrika,
    detailOwned: true,
    user: {},
    itemEffects: {},
    audioSettings: { muted: true },
    onClose: vi.fn(),
    ...overrides
  };
}

describe("character detail full-body portrait", () => {
  it("renders the figure in an independent overlay outside the clipped handbook", () => {
    const appShell = document.createElement("div");
    appShell.className = "app-shell";
    document.body.append(appShell);
    render(<section className="house-modal">
      <CharacterDetailDialog {...detailProps()} />
    </section>, { container: appShell });
    const dialog = screen.getByRole("dialog", { name: "西格莉卡角色详情" });
    expect(dialog.parentElement.parentElement.classList.contains("app-shell")).toBe(true);
    expect(document.querySelector(".house-modal").contains(dialog)).toBe(false);
    const image = screen.getByRole("img", { name: "西格莉卡" });
    expect(image.getAttribute("src")).toBe("/assets/characters/handbook-sprites/sigrika.webp");
    expect(image.parentElement.classList.contains("is-standard-figure")).toBe(true);
    expect(screen.getByText(CHARACTERS.sigrika.skill.name)).toBeTruthy();
    expect(screen.getByText("获得途径")).toBeTruthy();
  });

  it("keeps the wardrobe and detail-voice actions on the existing character", async () => {
    const interaction = userEvent.setup();
    const onOpenCostumes = vi.fn();
    const onPlayDetailVoice = vi.fn();
    render(<div className="app-shell"><CharacterDetailDialog {...detailProps({ onOpenCostumes, onPlayDetailVoice })} /></div>);
    await interaction.click(screen.getByRole("button", { name: "查看西格莉卡的服装" }));
    expect(onOpenCostumes).toHaveBeenCalledOnce();
    await interaction.click(screen.getByRole("button", { name: CHARACTERS.sigrika.description }));
    expect(onPlayDetailVoice).toHaveBeenCalledOnce();
  });

  it.each([
    ["costume", CHARACTERS.sigrika, { equippedCostumes: { sigrika: { portraitUrl: "/costume.webp", portraitScalePercent: 125 } } }, {}, "/costume.webp"],
    ["candy", CHARACTERS.denia, {}, { deniaRainbowGlow: true }, DENIA_CANDY_PORTRAIT],
    ["corruption", CHARACTERS.sigrika, { sigrikaCandyArc: { corrupted: true } }, {}, SIGRIKA_CORRUPTED_PORTRAIT_ASSET.url]
  ])("preserves the effective %s portrait", (_state, character, user, itemEffects, expectedSrc) => {
    render(<div className="app-shell"><CharacterDetailDialog {...detailProps({ character, user, itemEffects })} /></div>);
    const image = screen.getByRole("img", { name: character.name });
    expect(image.getAttribute("src")).toBe(expectedSrc);
    expect(image.parentElement.classList.contains("is-standard-figure")).toBe(false);
    if (user.equippedCostumes) expect(image.style.scale).toBe("1.25");
  });

  it("closes only the detail through Escape and returns focus to the handbook trigger", async () => {
    function Handbook() {
      const [open, setOpen] = useState(false);
      return <div className="app-shell"><section className="house-modal">
        <button onClick={() => setOpen(true)}>查看西格莉卡</button>
        {open && <CharacterDetailDialog {...detailProps({ onClose: () => setOpen(false) })} />}
      </section></div>;
    }
    const interaction = userEvent.setup();
    render(<Handbook />);
    const trigger = screen.getByRole("button", { name: "查看西格莉卡" });
    await interaction.click(trigger);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "关闭角色详情" }));
    await interaction.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.querySelector(".house-modal")).toBeTruthy();
  });
});
