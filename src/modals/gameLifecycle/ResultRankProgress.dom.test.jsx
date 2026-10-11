// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ResultRankProgress from "./ResultRankProgress.jsx";
afterEach(cleanup);
describe("result star trail", () => {
  it.each([[1, 3, "is-added"], [-1, 1, "is-removed"]])("marks only the changed slot for %s star", (delta, after, className) => {
    const { container, rerender } = render(<ResultRankProgress rank="3段" stars={after} reward={{ rank: 0, stars: delta, rankAfter: "3段" }} />);
    const changed = container.querySelector(".is-changed");
    expect(container.querySelectorAll(".result-rank-slot")).toHaveLength(4);
    expect(container.querySelectorAll(".is-filled")).toHaveLength(after);
    expect(container.querySelectorAll(".is-changed")).toHaveLength(1);
    expect(changed.classList.contains(className)).toBe(true);
    rerender(<ResultRankProgress rank="3段" stars={after} reward={{ rank: 0, stars: delta, rankAfter: "3段" }} />);
    expect(container.querySelector(".is-changed")).toBe(changed);
    expect(container.textContent).not.toMatch(/[+-]1星/);
  });
  it.each([[1, "4段", "3段"], [-1, "3段", "4段"], [2, "1段", "1级"], [-2, "1级", "1段"]])("shows %s rank movement without treating reset stars as a loss", (delta, after, before) => {
    const { container } = render(<ResultRankProgress rank={after} stars={2} reward={{ rank: delta, stars: -2, rankAfter: after }} />);
    expect(container.querySelector(".result-rank-before").textContent).toBe(before);
    expect(container.querySelector(".result-rank-next").textContent).toBe(after);
    expect(container.querySelectorAll(".is-changed")).toHaveLength(0);
  });
  it.each([["3段", 4], ["6段", 6], ["8段", 8]])("retains %s capacity", (rank, capacity) => {
    const { container } = render(<ResultRankProgress rank={rank} stars={2} reward={{ stars: 0 }} />);
    expect(container.querySelectorAll(".result-rank-slot")).toHaveLength(capacity);
    expect(container.querySelectorAll(".is-changed")).toHaveLength(0);
  });
  it("shows before and after nine-dan points without star slots", () => {
    const { container } = render(<ResultRankProgress rank="9段" rating={1200} reward={{ rating: 200, rankAfter: "9段" }} />);
    expect(container.querySelector(".result-rank-points").textContent).toBe("10001200分");
    expect(container.querySelectorAll(".result-rank-slot")).toHaveLength(0);
    expect(screen.getByRole("img", { name: "当前9段，1200分，本局+200分" })).toBeTruthy();
  });
  it("does not invent a pending change or an unknown rank", () => {
    const { container, rerender } = render(<ResultRankProgress rank="3段" stars={2} reward={{ rating: 0, coins: 50 }} />);
    expect(container.querySelectorAll(".is-changed")).toHaveLength(0);
    expect(screen.getByRole("img", { name: "当前3段，2星" })).toBeTruthy();
    rerender(<ResultRankProgress rank="未定段" />);
    expect(screen.getByText("未定段")).toBeTruthy();
  });
});
