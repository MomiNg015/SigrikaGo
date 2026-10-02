// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SigrikaCorruptionTransition from "./SigrikaCorruptionTransition.jsx";

describe("Sigrika corruption theme transition presentation", () => {
  it("renders a pointer-blocking one-shot transition with synchronized timing variables", () => {
    const view = render(<SigrikaCorruptionTransition transition={{
      direction: "enter",
      phase: "covering",
      timings: { coverMs: 210, revealMs: 260 }
    }} />);
    const transition = view.container.querySelector(".sigrika-theme-transition");

    expect(transition.getAttribute("aria-hidden")).toBe("true");
    expect(transition.dataset.direction).toBe("enter");
    expect(transition.dataset.phase).toBe("covering");
    expect(transition.style.getPropertyValue("--sigrika-transition-cover-duration")).toBe("210ms");
    expect(transition.style.getPropertyValue("--sigrika-transition-reveal-duration")).toBe("260ms");
    expect(view.container.querySelectorAll(".sigrika-theme-transition__slice")).toHaveLength(5);
    expect(view.container.querySelectorAll(".sigrika-theme-transition__fault")).toHaveLength(2);
  });

  it("stays unmounted outside an active state transition", () => {
    const view = render(<SigrikaCorruptionTransition transition={null} />);

    expect(view.container.innerHTML).toBe("");
  });
});
