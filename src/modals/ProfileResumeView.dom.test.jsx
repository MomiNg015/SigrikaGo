// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ProfileResumeView from "./ProfileResumeView.jsx";
import { CHARACTERS } from "../shared/characters.js";

afterEach(cleanup);

describe("profile character record empty state", () => {
  it.each(["self", "social"])("shares the selected-character bust and costume compositor in the %s hero", (context) => {
    const props = {
      context, user: { username: "测试部员", characterId: "aemeath" },
      characters: CHARACTERS, mode: "spark", stats: {},
      characterStats: [{ characterId: "aemeath", total: 2, wins: 1, losses: 1 }],
    };
    const { container, rerender } = render(<ProfileResumeView {...props} />);
    const image = screen.getByAltText(`${CHARACTERS.aemeath.name}立绘`);
    expect(image.getAttribute("src")).toBe("/assets/characters/handbook-sprites/aemeath.webp");
    expect(image.closest(".profile-portrait-mask")).toBeTruthy();
    const recordImage = container.querySelector(".profile-character-table img");
    expect(recordImage.getAttribute("loading")).toBe("lazy");
    expect(recordImage.closest(".character-bust-portrait")).toBeNull();
    rerender(<ProfileResumeView {...props} user={{ ...props.user, equippedCostumes: {
      aemeath: { portraitUrl: "/aemeath-costume.webp", portraitScalePercent: 120, portraitOffsetYPercent: 3 },
    } }} />);
    const costumeImage = screen.getByAltText(`${CHARACTERS.aemeath.name}立绘`);
    expect(costumeImage.getAttribute("src")).toBe("/aemeath-costume.webp");
    expect(costumeImage.parentElement.style.scale).toBe("1.2");
    expect(costumeImage.parentElement.style.translate).toBe("0% 3%");
  });
  it.each(["self", "social"])("shows complete mode stats and zero-game defaults in %s profiles", (context) => {
    const props = { context, user: { username: "测试部员" }, characters: [], mode: "spark", stats: { totalGames: 10, wins: 6, losses: 3, draws: 1 } };
    const { rerender } = render(<ProfileResumeView {...props} />);
    const summary = () => screen.getByText("战绩").closest(".profile-summary-item");
    expect(within(summary()).getByLabelText("总对局 10局")).toBeTruthy();
    expect([...summary().querySelectorAll("dd")].map((item) => item.textContent)).toEqual(["10", "6", "3", "1", "60.0%"]);
    expect(document.querySelectorAll(".profile-summary-item")).toHaveLength(2);
    rerender(<ProfileResumeView {...props} mode="standard" stats={{}} />);
    expect(within(summary()).getByLabelText("总对局 0局")).toBeTruthy();
    expect([...summary().querySelectorAll("dd")].map((item) => item.textContent)).toEqual(["0", "0", "0", "0", "0.0%"]);
  });

  it.each(["self", "social"])("preserves the empty record frame and restores the table in %s profiles", (context) => {
    const props = { context, user: { username: "测试部员", characterId: "sigrika" }, characters: [], mode: "spark", stats: {} };
    const { rerender } = render(<ProfileResumeView {...props} />);
    const empty = screen.getByLabelText("角色战绩");
    expect(empty.classList.contains("profile-character-section")).toBe(true);
    expect(empty.classList.contains("window-empty-state")).toBe(false);
    expect(empty.querySelector(".window-empty-state")).toBeTruthy();
    expect(empty.querySelector(".profile-character-table-head")).toBeNull();
    expect(empty.textContent).toBe("暂无角色战绩");
    expect(empty.querySelector(".recent-result-empty")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByLabelText("角色战绩列表")).toBeNull();
    rerender(<ProfileResumeView {...props} mode="standard" characterStats={[{ characterId: "sigrika", total: 2, wins: 1, losses: 1, draws: 0 }]} />);
    expect(screen.getByRole("table")).toBeTruthy();
    expect(within(screen.getByLabelText("角色战绩")).queryByText("暂无角色战绩")).toBeNull();
    rerender(<ProfileResumeView {...props} />);
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByLabelText("角色战绩").textContent).toBe("暂无角色战绩");
  });
});
