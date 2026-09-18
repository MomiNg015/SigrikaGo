// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PlayerPlaque from "./PlayerPlaque.jsx";
import { readFileSync } from "node:fs";

afterEach(cleanup);

describe("home student ID", () => {
  const character = { id: "sigrika", portrait: "/sigrika.png" };
  const user = { username: "星炬学院测试同学", rank: "9段", rating: 3000 };

  it("anchors the hanging card to the board, outside the stage's named grid area", () => {
    const home = readFileSync("src/home/HomeScreen.jsx", "utf8");
    const stage = readFileSync("src/home/components/HomeStage.jsx", "utf8");
    const css = readFileSync("src/styles/mobile-adaptive/home-student-id-layout.css", "utf8");
    expect(home).toMatch(/className="home-main-panel home-terminal-main">\s*<PlayerPlaque/);
    expect(stage).not.toContain("<PlayerPlaque");
    const zone = css.match(/\.home-player-zone\.home-student-id-zone\s*\{([^}]+)\}/)?.[1];
    expect(zone).toContain("position: absolute !important");
    expect(zone).toContain("grid-area: auto !important");
    expect(zone).toContain("inset: -10px auto auto 8% !important");
    expect(zone).toContain("width: var(--home-hanging-id-width)");
  });

  it("updates the current portrait, including costume framing, and shows only the username", () => {
    const { container, rerender } = render(<PlayerPlaque character={character} user={user} />);
    expect(screen.getByAltText("当前出战角色").getAttribute("src")).toBe("/sigrika.png");
    expect(screen.getByText(user.username)).toBeTruthy();
    expect(container.textContent).not.toMatch(/9段|3000/);
    const costumeUser = { ...user, equippedCostumes: { sigrika: { portraitUrl: "/costume.png", portraitScalePercent: 110 } } };
    rerender(<PlayerPlaque character={character} user={costumeUser} />);
    expect(screen.getByAltText("当前出战角色").getAttribute("src")).toBe("/costume.png");
    expect(screen.getByAltText("当前出战角色").style.scale).toBe("1.1");
    rerender(<PlayerPlaque character={{ id: "denia", portraitUrl: "/denia.png" }} user={user} />);
    expect(screen.getByAltText("当前出战角色").getAttribute("src")).toBe("/denia.png");
  });

  it("preserves the resume action, dedicated sound opt-out and disabled state", () => {
    const onOpenResume = vi.fn();
    const { rerender } = render(<PlayerPlaque character={character} user={user} onOpenResume={onOpenResume} />);
    const button = screen.getByRole("button", { name: "打开履历" });
    expect(button.getAttribute("data-ui-sound")).toBe("none");
    fireEvent.click(button);
    expect(onOpenResume).toHaveBeenCalledOnce();
    rerender(<PlayerPlaque character={character} user={user} onOpenResume={onOpenResume} disabled />);
    fireEvent.click(button);
    expect(onOpenResume).toHaveBeenCalledOnce();
    expect(button.disabled).toBe(true);
  });

  it("updates the equipped username effect without adding title or badge rows", () => {
    const equippedUser = { ...user, achievementEquipmentAssets: {
      nameplate: { id: "reward-sigrika-spark-100-wins-nameplate", imageUrl: "/nameplate.png" },
      title: { text: "不在学生证展示的称号" },
      badge: { name: "徽章", imageUrl: "/badge.png" }
    } };
    const { container, rerender } = render(<PlayerPlaque character={character} user={equippedUser} />);
    expect(container.querySelector(".user-identity").dataset.nameplateId).toBe("reward-sigrika-spark-100-wins-nameplate");
    expect(container.querySelector(".user-identity-nameplate-effect")).toBeTruthy();
    expect(container.querySelector(".user-identity-title, .user-identity-emblem")).toBeNull();
    rerender(<PlayerPlaque character={character} user={user} />);
    expect(container.querySelector(".user-identity-nameplate-effect")).toBeNull();
    expect(screen.getByText(user.username)).toBeTruthy();
  });
});
