// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PlayerPlaque from "./PlayerPlaque.jsx";

afterEach(cleanup);

describe("home student ID", () => {
  const character = { id: "sigrika", portrait: "/sigrika.png" };
  const user = { username: "星炬学院测试同学", rank: "9段", rating: 3000 };

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
});
