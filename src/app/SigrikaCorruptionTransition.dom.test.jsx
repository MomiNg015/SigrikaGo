// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SigrikaCorruptionTransition from "./SigrikaCorruptionTransition.jsx";

describe("Sigrika corruption theme transition presentation", () => {
  afterEach(cleanup);
  it("renders a pointer-blocking one-shot transition with synchronized timing variables", () => {
    const view = render(<SigrikaCorruptionTransition transition={{
      direction: "exit",
      phase: "covering",
      timings: { coverMs: 210, revealMs: 260 }
    }} />);
    const transition = view.container.querySelector(".sigrika-theme-transition");

    expect(transition.getAttribute("aria-hidden")).toBe("true");
    expect(transition.dataset.direction).toBe("exit");
    expect(transition.dataset.phase).toBe("covering");
    expect(transition.style.getPropertyValue("--sigrika-transition-cover-duration")).toBe("210ms");
    expect(transition.style.getPropertyValue("--sigrika-transition-reveal-duration")).toBe("260ms");
    expect(view.container.querySelectorAll(".sigrika-theme-transition__slice")).toHaveLength(5);
    expect(view.container.querySelectorAll(".sigrika-theme-transition__fault")).toHaveLength(2);
  });

  it("portals a full-window negative with one focused choice and no old entrance slices", () => {
    const root = document.createElement("div"); root.id = "root"; document.body.append(root);
    const confirm = vi.fn();
    const view = render(<SigrikaCorruptionTransition transition={{ direction: "enter", phase: "negative", ready: true }} onConfirm={confirm} />, { container: root });
    expect(root.inert).toBe(true);
    expect(document.querySelector(".sigrika-theme-transition__slice")).toBeNull();
    expect(screen.queryByRole("button", { name: "......怎么回事？？" })).toBeNull();
    view.rerender(<SigrikaCorruptionTransition transition={{ direction: "enter", phase: "choice", ready: true }} onConfirm={confirm} />);
    const button = screen.getByRole("button", { name: "......怎么回事？？" });
    expect(document.activeElement).toBe(button);
    fireEvent.keyDown(button, { key: "Escape" });
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(confirm).toHaveBeenCalledOnce();
    view.unmount();
    expect(root.inert).not.toBe(true);
    root.remove();
  });

  it("stays unmounted outside an active state transition", () => {
    const view = render(<SigrikaCorruptionTransition transition={null} />);

    expect(view.container.innerHTML).toBe("");
  });
});
