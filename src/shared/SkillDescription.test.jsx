// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetSkillTraitCatalogCacheForTests } from "../app/skillTraitCatalog.js";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("../api/client.js", () => ({ api: apiMock }));

import SkillDescription, {
  descriptionParts,
  positionSkillTraitPopover
} from "./SkillDescription.jsx";
import { skillTraitMap } from "./skillTraits.js";

const TRAITS = [
  { id: "trait-no-first", name: "禁先", definition: "对手发动主动技能后才能发动。" },
  { id: "trait-sprint", name: "疾走", definition: "发动该技能不消耗当前回合落子。" }
];

beforeEach(() => {
  resetSkillTraitCatalogCacheForTests();
  apiMock.mockReset();
  apiMock.mockImplementation(() => new Promise(() => {}));
});

afterEach(() => {
  cleanup();
  resetSkillTraitCatalogCacheForTests();
});

describe("SkillDescription", () => {
  it("renders confirmed fallback traits as buttons on the first render", () => {
    render(<SkillDescription description="【疾走】正文" />);

    expect(screen.getByRole("button", { name: /特性词【疾走】/ })).toBeTruthy();
  });

  it("keeps author order and degrades unknown tokens to ordinary text", () => {
    const parts = descriptionParts("前文【禁先】中段【未知】【疾走】后文", skillTraitMap(TRAITS));
    expect(parts.filter((part) => part.type === "trait").map((part) => part.trait.name)).toEqual(["禁先", "疾走"]);
    expect(parts.filter((part) => part.type === "text").map((part) => part.text).join(""))
      .toContain("【未知】");
  });

  it("renders overclock first, opens by click, switches traits, and has no close button", () => {
    render(
      <SkillDescription
        overclockText="超频：3"
        description="【禁先】【疾走】正文"
        traits={TRAITS}
      />
    );
    expect(screen.getByText("超频：3").className).toContain("skill-overclock-line");
    const noFirst = screen.getByRole("button", { name: /禁先/ });
    fireEvent.click(noFirst, { clientX: 120, clientY: 160 });
    expect(screen.getByRole("tooltip").textContent).toContain("对手发动主动技能后才能发动");
    expect(screen.getByRole("tooltip").querySelector("button")).toBeNull();

    fireEvent.click(noFirst, { clientX: 120, clientY: 160 });
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.click(noFirst, { clientX: 120, clientY: 160 });

    fireEvent.click(screen.getByRole("button", { name: /疾走/ }), { clientX: 150, clientY: 180 });
    expect(screen.getByRole("tooltip").textContent).toContain("不消耗当前回合落子");
    expect(screen.queryByText("对手发动主动技能后才能发动。")).toBeNull();
  });

  it("toggles by keyboard and closes only the top layer through its dismiss surface", async () => {
    const user = userEvent.setup();
    render(<SkillDescription description="正文【疾走】" traits={TRAITS} />);
    const trigger = screen.getByRole("button", { name: /疾走/ });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.click(document.body);
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(screen.getByText("正文")).toBeTruthy();
  });

  it("clamps to the viewport and flips below when there is no room above", () => {
    expect(positionSkillTraitPopover(
      { x: 8, y: 20 },
      { width: 280, height: 100 },
      { innerWidth: 320, innerHeight: 480 }
    )).toMatchObject({ x: 12, placement: "below" });
    expect(positionSkillTraitPopover(
      { x: 300, y: 440 },
      { width: 280, height: 100 },
      { innerWidth: 320, innerHeight: 480 }
    )).toMatchObject({ x: 28, placement: "above" });
  });
});
