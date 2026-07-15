// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHARACTERS } from "../shared/characters.js";
import { COLORS } from "../shared/game.js";

const MOCK_TRAITS = vi.hoisted(() => [
  { id: "trait-no-first", name: "禁先", definition: "对手发动主动技能后才能发动。" },
  { id: "trait-sprint", name: "疾走", definition: "发动该技能不消耗当前回合落子。" }
]);

vi.mock("../app/skillTraitCatalog.js", () => ({
  getSkillTraitCatalogSnapshot: vi.fn(() => MOCK_TRAITS),
  loadCachedPublicSkillTraitCatalog: vi.fn(async () => MOCK_TRAITS),
  subscribeSkillTraitCatalog: vi.fn(() => () => {})
}));

import PlayerInfo from "./PlayerInfo.jsx";

describe("PlayerInfo mobile skill traits", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("opens a trait immediately from the mobile skill tooltip without closing the skill tooltip", async () => {
    const user = userEvent.setup();
    const character = {
      ...CHARACTERS.changli,
      skill: {
        ...CHARACTERS.changli.skill,
        description: "【禁先】【疾走】当前技能说明。"
      }
    };
    render(
      <PlayerInfo
        player={{
          color: COLORS.black,
          characterId: "changli",
          user: { username: "测试玩家", itemEffects: {}, rank: "", rating: "" },
          captures: 0,
          time: { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 }
        }}
        game={{
          mode: "spark",
          phase: "playing",
          turn: COLORS.black,
          skillUses: { black: 1, white: 1 },
          skillCosts: { black: 0, white: 0 },
          skillRemovals: { black: 0, white: 0 },
          winner: null
        }}
        characters={{ changli: character }}
        align="self"
        viewColor={COLORS.black}
        canSwitchView={false}
        onViewColor={() => {}}
        isWinner={false}
        isActiveTurn
        isDrawResult={false}
        isSkillTargeting={false}
        floatingLayerZ={91}
        onFloatingLayerRequest={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: new RegExp(character.skill.name) }));
    const traitTrigger = screen.getByRole("button", { name: /特性词【禁先】/ });
    expect(document.querySelector(".mobile-tap-tooltip")).toBeTruthy();

    await user.click(traitTrigger);
    await waitFor(() => {
      expect(document.querySelector(".skill-trait-popover")?.textContent)
        .toContain("对手发动主动技能后才能发动");
    });
    expect(document.querySelector(".skill-trait-popover")?.style.getPropertyValue("--room-floating-z"))
      .toBe("120");
    expect(document.querySelector(".mobile-tap-tooltip")).toBeTruthy();
  });

  it("keeps the card and username passive while isolating viewpoint and stat controls", async () => {
    const user = userEvent.setup();
    const onViewColor = vi.fn();
    render(
      <PlayerInfo
        player={{
          color: COLORS.black,
          characterId: "changli",
          user: { username: "Moming88", itemEffects: {}, rank: "1段", rating: 1800 },
          captures: 2,
          time: { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 }
        }}
        game={{
          mode: "spark",
          phase: "playing",
          turn: COLORS.black,
          skillEnabled: true,
          skillUses: { black: 1, white: 1 },
          skillCosts: { black: 0, white: 0 },
          skillRemovals: { black: 1, white: 0 },
          winner: null
        }}
        characters={CHARACTERS}
        align="self"
        viewColor={COLORS.black}
        canSwitchView
        onViewColor={onViewColor}
      />
    );

    const card = document.querySelector("aside.player-info");
    expect(card).toBeTruthy();
    expect(card.getAttribute("role")).not.toBe("button");
    expect(card.getAttribute("tabindex")).toBeNull();
    expect(screen.getByText("Moming88").closest("button")).toBeNull();

    const portraitButton = within(card).getByRole("button", { name: "当前为黑方视角" });
    const removalButton = within(card).getByRole("button", { name: /除子1/ });
    await user.click(removalButton);
    expect(onViewColor).not.toHaveBeenCalled();

    await user.click(portraitButton);
    expect(onViewColor).toHaveBeenCalledOnce();
    expect(onViewColor).toHaveBeenCalledWith(COLORS.black);
  });
});
